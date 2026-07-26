from datetime import UTC, datetime, timedelta
from typing import cast

import jwt
from jwt.exceptions import InvalidTokenError
from pwdlib import PasswordHash
from pwdlib.exceptions import UnknownHashError
from sqlalchemy.orm import Session

from app.config import Settings
from app.models import User
from app.repositories.auth import get_user_by_username
from app.schemas.auth import AuthenticatedUserResponse

ALGORITHM = "HS256"
password_hasher = PasswordHash.recommended()
DUMMY_PASSWORD_HASH = password_hasher.hash("not-a-real-lingotrail-password")


def hash_password(password: str) -> str:
    return password_hasher.hash(password)


def password_matches(password: str, password_hash: str) -> bool:
    try:
        return password_hasher.verify(password, password_hash)
    except UnknownHashError:
        return False


def authenticate_user(
    session: Session,
    username: str,
    password: str,
) -> User | None:
    user = get_user_by_username(session, username)
    stored_hash = user.password_hash if user is not None else DUMMY_PASSWORD_HASH

    if not password_matches(password, stored_hash):
        return None

    return user


def create_session_token(user: User, settings: Settings) -> str:
    issued_at = datetime.now(UTC)
    expires_at = issued_at + timedelta(minutes=settings.auth_token_expire_minutes)
    payload = {
        "sub": str(user.id),
        "iat": issued_at,
        "exp": expires_at,
        "iss": settings.auth_issuer,
        "aud": settings.auth_audience,
    }
    return jwt.encode(payload, settings.auth_secret_key, algorithm=ALGORITHM)


def decode_session_token(token: str, settings: Settings) -> int | None:
    try:
        payload = cast(
            dict[str, object],
            jwt.decode(
                token,
                settings.auth_secret_key,
                algorithms=[ALGORITHM],
                audience=settings.auth_audience,
                issuer=settings.auth_issuer,
                options={"require": ["sub", "iat", "exp", "iss", "aud"]},
            ),
        )
    except InvalidTokenError:
        return None

    subject = payload.get("sub")
    if not isinstance(subject, str) or not subject.isdigit():
        return None

    return int(subject)


def to_authenticated_user(user: User) -> AuthenticatedUserResponse:
    return AuthenticatedUserResponse(
        id=user.id,
        username=user.username,
        display_name=user.display_name,
        avatar_key=user.avatar_key,
    )
