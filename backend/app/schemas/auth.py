import re

from pydantic import BaseModel, EmailStr, Field, field_validator

USERNAME_PATTERN = re.compile(r"^[a-z0-9](?:[a-z0-9._-]*[a-z0-9])?$")


class LoginRequest(BaseModel):
    username: str = Field(min_length=1, max_length=50)
    password: str = Field(min_length=1, max_length=128)

    @field_validator("username")
    @classmethod
    def normalize_username(cls, value: str) -> str:
        return value.strip().lower()


class RegistrationRequest(BaseModel):
    display_name: str = Field(min_length=2, max_length=100)
    username: str = Field(min_length=3, max_length=30)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)

    @field_validator("display_name")
    @classmethod
    def normalize_display_name(cls, value: str) -> str:
        normalized = " ".join(value.split())
        if len(normalized) < 2:
            raise ValueError("Display name must contain at least 2 characters.")
        return normalized

    @field_validator("username")
    @classmethod
    def normalize_registration_username(cls, value: str) -> str:
        normalized = value.strip().lower()
        if not USERNAME_PATTERN.fullmatch(normalized):
            raise ValueError(
                "Username may contain lowercase letters, numbers, dots, "
                "underscores, and hyphens, and must start and end with a "
                "letter or number."
            )
        return normalized

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: EmailStr) -> str:
        return str(value).strip().lower()

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, value: str) -> str:
        requirements = (
            any(character.islower() for character in value),
            any(character.isupper() for character in value),
            any(character.isdigit() for character in value),
        )
        if not all(requirements):
            raise ValueError(
                "Password must include an uppercase letter, a lowercase "
                "letter, and a number."
            )
        return value


class AuthenticatedUserResponse(BaseModel):
    id: int
    username: str
    display_name: str
    avatar_key: str


class RegistrationResponse(AuthenticatedUserResponse):
    email: str


class LogoutResponse(BaseModel):
    message: str
