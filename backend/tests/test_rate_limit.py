from re import compile

from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.middleware.rate_limit import (
    RateLimitMiddleware,
    RateLimitPolicy,
    SlidingWindowRateLimiter,
    match_rate_limit_policy,
)


def test_matches_only_protected_write_endpoints() -> None:
    assert match_rate_limit_policy("POST", "/api/v1/auth/login") is not None
    assert match_rate_limit_policy("POST", "/api/v1/attempts/42/answers") is not None
    assert match_rate_limit_policy("GET", "/api/v1/auth/login") is None
    assert match_rate_limit_policy("POST", "/api/v1/path") is None


def test_sliding_window_blocks_then_recovers() -> None:
    current_time = 100.0
    policy = RateLimitPolicy(
        name="test",
        method="POST",
        path_pattern=compile(r"^/test$"),
        limit=2,
        window_seconds=60,
    )
    limiter = SlidingWindowRateLimiter(clock=lambda: current_time)

    assert limiter.check(policy, "client") == (True, 0)
    assert limiter.check(policy, "client") == (True, 0)
    assert limiter.check(policy, "client") == (False, 60)

    current_time = 161.0
    assert limiter.check(policy, "client") == (True, 0)


def test_middleware_returns_safe_rate_limit_response() -> None:
    protected_app = FastAPI()
    protected_app.add_middleware(RateLimitMiddleware, enabled=True)

    @protected_app.post("/api/v1/auth/register")
    def register() -> dict[str, str]:
        return {"status": "created"}

    with TestClient(protected_app) as client:
        for _ in range(5):
            assert client.post("/api/v1/auth/register").status_code == 200

        limited_response = client.post("/api/v1/auth/register")

    assert limited_response.status_code == 429
    assert limited_response.json() == {
        "detail": "Too many requests. Please try again shortly."
    }
    assert int(limited_response.headers["Retry-After"]) > 0
