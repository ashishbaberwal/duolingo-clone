from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Lesson

DEMO_USERNAME = "learner"
DEMO_PASSWORD = "LingoTrail@123"


def login_demo(client: TestClient) -> None:
    response = client.post(
        "/api/v1/auth/login",
        json={"username": DEMO_USERNAME, "password": DEMO_PASSWORD},
    )
    assert response.status_code == 200


def lesson_id_by_title(session: Session, title: str) -> int:
    lesson_id = session.scalar(select(Lesson.id).where(Lesson.title == title))
    assert lesson_id is not None
    return lesson_id
