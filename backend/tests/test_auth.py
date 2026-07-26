import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.config import get_settings
from app.seed import seed_database


def test_login_sets_http_only_session_cookie(
    db_session: Session,
    api_client: TestClient,
) -> None:
    seed_database(db_session)

    response = api_client.post(
        "/api/v1/auth/login",
        json={"username": " LEARNER ", "password": "LingoTrail@123"},
    )

    assert response.status_code == 200
    assert response.json() == {
        "id": 1,
        "username": "learner",
        "display_name": "Ava",
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
    ("username", "password"),
    [
        ("unknown", "LingoTrail@123"),
        ("learner", "wrong-password"),
    ],
)
def test_login_uses_generic_error_for_invalid_credentials(
    username: str,
    password: str,
    db_session: Session,
    api_client: TestClient,
) -> None:
    seed_database(db_session)

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
    login = api_client.post(
        "/api/v1/auth/login",
        json={"username": "learner", "password": "LingoTrail@123"},
    )
    assert login.status_code == 200

    current_user = api_client.get("/api/v1/auth/me")
    assert current_user.status_code == 200
    assert current_user.json()["username"] == "learner"

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
