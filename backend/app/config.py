from functools import lru_cache

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

DEVELOPMENT_AUTH_SECRET = (
    "development-only-secret-key-change-before-production-2026"
)


class Settings(BaseSettings):
    app_name: str = "LingoTrail API"
    app_env: str = "development"
    frontend_origin: str = "http://localhost:3000"
    database_url: str = "sqlite:///./data/lingotrail.db"
    database_echo: bool = False
    auth_secret_key: str = DEVELOPMENT_AUTH_SECRET
    auth_cookie_name: str = "lingotrail_session"
    auth_token_expire_minutes: int = Field(default=480, gt=0)
    auth_issuer: str = "lingotrail-api"
    auth_audience: str = "lingotrail-web"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @model_validator(mode="after")
    def validate_auth_secret(self) -> "Settings":
        if len(self.auth_secret_key) < 32:
            raise ValueError("AUTH_SECRET_KEY must contain at least 32 characters")

        if (
            self.app_env.casefold() == "production"
            and self.auth_secret_key == DEVELOPMENT_AUTH_SECRET
        ):
            raise ValueError(
                "AUTH_SECRET_KEY must be changed before running in production"
            )

        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()
