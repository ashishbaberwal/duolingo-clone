from collections import deque
from collections.abc import Callable
from dataclasses import dataclass
from math import ceil
from re import Pattern, compile
from threading import Lock
from time import monotonic

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.responses import JSONResponse, Response
from starlette.types import ASGIApp


@dataclass(frozen=True)
class RateLimitPolicy:
    name: str
    method: str
    path_pattern: Pattern[str]
    limit: int
    window_seconds: int


RATE_LIMIT_POLICIES = (
    RateLimitPolicy(
        name="auth-login",
        method="POST",
        path_pattern=compile(r"^/api/v1/auth/login$"),
        limit=10,
        window_seconds=60,
    ),
    RateLimitPolicy(
        name="auth-register",
        method="POST",
        path_pattern=compile(r"^/api/v1/auth/register$"),
        limit=5,
        window_seconds=60,
    ),
    RateLimitPolicy(
        name="answer-submission",
        method="POST",
        path_pattern=compile(r"^/api/v1/attempts/\d+/answers$"),
        limit=120,
        window_seconds=60,
    ),
    RateLimitPolicy(
        name="heart-refill",
        method="POST",
        path_pattern=compile(r"^/api/v1/hearts/refill$"),
        limit=10,
        window_seconds=60,
    ),
)


def match_rate_limit_policy(method: str, path: str) -> RateLimitPolicy | None:
    return next(
        (
            policy
            for policy in RATE_LIMIT_POLICIES
            if policy.method == method and policy.path_pattern.fullmatch(path)
        ),
        None,
    )


class SlidingWindowRateLimiter:
    def __init__(self, clock: Callable[[], float] = monotonic) -> None:
        self._clock = clock
        self._requests: dict[tuple[str, str], deque[float]] = {}
        self._lock = Lock()

    def check(self, policy: RateLimitPolicy, client_key: str) -> tuple[bool, int]:
        now = self._clock()
        window_start = now - policy.window_seconds
        bucket_key = (policy.name, client_key)

        with self._lock:
            timestamps = self._requests.setdefault(bucket_key, deque())
            while timestamps and timestamps[0] <= window_start:
                timestamps.popleft()

            if len(timestamps) >= policy.limit:
                retry_after = max(
                    1,
                    ceil(policy.window_seconds - (now - timestamps[0])),
                )
                return False, retry_after

            timestamps.append(now)
            return True, 0


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app: ASGIApp, *, enabled: bool) -> None:
        super().__init__(app)
        self._enabled = enabled
        self._limiter = SlidingWindowRateLimiter()

    async def dispatch(
        self,
        request: Request,
        call_next: RequestResponseEndpoint,
    ) -> Response:
        policy = match_rate_limit_policy(request.method, request.url.path)
        if not self._enabled or policy is None:
            return await call_next(request)

        client_key = request.client.host if request.client is not None else "unknown"
        allowed, retry_after = self._limiter.check(policy, client_key)
        if allowed:
            return await call_next(request)

        return JSONResponse(
            status_code=429,
            content={"detail": "Too many requests. Please try again shortly."},
            headers={"Retry-After": str(retry_after)},
        )
