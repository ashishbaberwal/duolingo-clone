from typing import cast

from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Lesson

TEST_DISPLAY_NAME = "Trail Explorer"
TEST_USERNAME = "trail-explorer"
TEST_EMAIL = "trail.explorer@example.com"
TEST_PASSWORD = "TrailPass123"


def register_test_user(client: TestClient) -> dict[str, object]:
    response = client.post(
        "/api/v1/auth/register",
        json={
            "display_name": TEST_DISPLAY_NAME,
            "username": TEST_USERNAME,
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD,
        },
    )
    assert response.status_code == 201
    return cast(dict[str, object], response.json())


def login_test_user(client: TestClient) -> None:
    response = client.post(
        "/api/v1/auth/login",
        json={"username": TEST_USERNAME, "password": TEST_PASSWORD},
    )
    assert response.status_code == 200


def register_and_login_user(client: TestClient) -> None:
    register_test_user(client)
    login_test_user(client)


def lesson_id_by_title(session: Session, title: str) -> int:
    lesson_id = session.scalar(select(Lesson.id).where(Lesson.title == title))
    assert lesson_id is not None
    return lesson_id
