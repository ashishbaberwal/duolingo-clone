from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "LingoTrail API"
    app_env: str = "development"
    frontend_origin: str = "http://localhost:3000"
    database_url: str = "sqlite:///./data/lingotrail.db"
    database_echo: bool = False

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


@lru_cache
def get_settings() -> Settings:
    return Settings()
