import pytest
from pydantic import ValidationError

from app.config import DEVELOPMENT_AUTH_SECRET, Settings


def test_development_allows_documented_local_auth_secret() -> None:
    settings = Settings(
        app_env="development",
        auth_secret_key=DEVELOPMENT_AUTH_SECRET,
    )

    assert settings.auth_secret_key == DEVELOPMENT_AUTH_SECRET


def test_auth_secret_must_be_at_least_32_characters() -> None:
    with pytest.raises(ValidationError, match="at least 32 characters"):
        Settings(auth_secret_key="too-short")


def test_session_expiry_must_be_positive() -> None:
    with pytest.raises(ValidationError, match="greater than 0"):
        Settings(auth_token_expire_minutes=0)


def test_production_rejects_documented_development_secret() -> None:
    with pytest.raises(ValidationError, match="must be changed"):
        Settings(
            app_env="production",
            auth_secret_key=DEVELOPMENT_AUTH_SECRET,
        )


def test_production_accepts_a_distinct_long_secret() -> None:
    settings = Settings(
        app_env="production",
        auth_secret_key="production-secret-with-more-than-32-characters",
    )

    assert settings.app_env == "production"
