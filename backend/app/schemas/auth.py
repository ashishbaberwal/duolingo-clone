from pydantic import BaseModel, Field, field_validator


class LoginRequest(BaseModel):
    username: str = Field(min_length=1, max_length=50)
    password: str = Field(min_length=1, max_length=128)

    @field_validator("username")
    @classmethod
    def normalize_username(cls, value: str) -> str:
        return value.strip().lower()


class AuthenticatedUserResponse(BaseModel):
    id: int
    username: str
    display_name: str
    avatar_key: str


class LogoutResponse(BaseModel):
    message: str
