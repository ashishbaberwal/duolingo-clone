import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import get_settings
from app.models import User
from app.seed import seed_database
from app.services.auth import password_matches
from tests.helpers import (
    TEST_DISPLAY_NAME,
    TEST_EMAIL,
    TEST_PASSWORD,
    TEST_USERNAME,
    login_test_user,
    register_test_user,
)


def test_registration_normalizes_details_and_hashes_password(
    db_session: Session,
    api_client: TestClient,
) -> None:
    seed_database(db_session)

    response = api_client.post(
        "/api/v1/auth/register",
        json={
            "display_name": "  Trail   Explorer  ",
            "username": " TRAIL-EXPLORER ",
            "email": "TRAIL.EXPLORER@EXAMPLE.COM",
            "password": TEST_PASSWORD,
        },
    )

    assert response.status_code == 201
    assert response.json() == {
        "id": 5,
        "username": TEST_USERNAME,
        "display_name": TEST_DISPLAY_NAME,
        "email": TEST_EMAIL,
        "avatar_key": "fox",
    }
    assert "set-cookie" not in response.headers

    user = db_session.scalar(select(User).where(User.username == TEST_USERNAME))
    assert user is not None
    assert user.email == TEST_EMAIL
    assert user.password_hash != TEST_PASSWORD
    assert password_matches(TEST_PASSWORD, user.password_hash)
    assert user.hearts == user.max_hearts == 5
    assert user.gems == 500
    assert user.total_xp == 0
    assert user.current_streak == 0


def test_registered_user_can_login_with_http_only_session_cookie(
    db_session: Session,
    api_client: TestClient,
) -> None:
    seed_database(db_session)
    register_test_user(api_client)

    response = api_client.post(
        "/api/v1/auth/login",
        json={"username": f" {TEST_USERNAME.upper()} ", "password": TEST_PASSWORD},
    )

    assert response.status_code == 200
    assert response.json() == {
        "id": 5,
        "username": TEST_USERNAME,
        "display_name": TEST_DISPLAY_NAME,
        "avatar_key": "fox",
    }
    cookie = response.headers["set-cookie"]
    assert "lingotrail_session=" in cookie
    assert "HttpOnly" in cookie
    assert "Max-Age=28800" in cookie
    assert "Path=/" in cookie
    assert "SameSite=lax" in cookie
    assert "Secure" not in cookie


@pytest.mark.parametrize(
    ("overrides", "expected_detail"),
    [
        (
            {"username": TEST_USERNAME.upper(), "email": "second@example.com"},
            "That username is already in use.",
        ),
        (
            {"username": "second-user", "email": TEST_EMAIL.upper()},
            "That email address is already registered.",
        ),
    ],
)
def test_registration_rejects_duplicate_identity_fields(
    overrides: dict[str, str],
    expected_detail: str,
    db_session: Session,
    api_client: TestClient,
) -> None:
    seed_database(db_session)
    register_test_user(api_client)
    payload = {
        "display_name": "Second User",
        "username": "second-user",
        "email": "second@example.com",
        "password": "SecondPass123",
        **overrides,
    }

    response = api_client.post("/api/v1/auth/register", json=payload)

    assert response.status_code == 409
    assert response.json() == {"detail": expected_detail}


@pytest.mark.parametrize(
    ("field", "value"),
    [
        ("username", "bad user"),
        ("username", "_starts-wrong"),
        ("email", "not-an-email"),
        ("password", "onlylowercase"),
        ("password", "NOLOWERCASE1"),
        ("password", "NoNumberHere"),
    ],
)
def test_registration_rejects_invalid_account_details(
    field: str,
    value: str,
    api_client: TestClient,
) -> None:
    payload = {
        "display_name": TEST_DISPLAY_NAME,
        "username": TEST_USERNAME,
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD,
    }
    payload[field] = value

    response = api_client.post("/api/v1/auth/register", json=payload)

    assert response.status_code == 422


@pytest.mark.parametrize(
    ("username", "password"),
    [
        ("unknown", TEST_PASSWORD),
        (TEST_USERNAME, "wrong-password"),
    ],
)
def test_login_uses_generic_error_for_invalid_credentials(
    username: str,
    password: str,
    db_session: Session,
    api_client: TestClient,
) -> None:
    seed_database(db_session)
    register_test_user(api_client)

    response = api_client.post(
        "/api/v1/auth/login",
        json={"username": username, "password": password},
    )

    assert response.status_code == 401
    assert response.json() == {"detail": "Invalid username or password."}


def test_session_can_be_read_then_revoked(
    db_session: Session,
    api_client: TestClient,
) -> None:
    seed_database(db_session)
    register_test_user(api_client)
    login_test_user(api_client)

    current_user = api_client.get("/api/v1/auth/me")
    assert current_user.status_code == 200
    assert current_user.json()["username"] == TEST_USERNAME

    logout = api_client.post("/api/v1/auth/logout")
    assert logout.status_code == 200
    assert logout.json() == {"message": "Signed out successfully."}
    assert "Max-Age=0" in logout.headers["set-cookie"]

    after_logout = api_client.get("/api/v1/auth/me")
    assert after_logout.status_code == 401


def test_tampered_session_token_is_rejected(
    db_session: Session,
    api_client: TestClient,
) -> None:
    seed_database(db_session)
    settings = get_settings()
    api_client.cookies.set(settings.auth_cookie_name, "not-a-valid-jwt")

    response = api_client.get("/api/v1/auth/me")

    assert response.status_code == 401
    assert response.json() == {"detail": "Authentication required."}
