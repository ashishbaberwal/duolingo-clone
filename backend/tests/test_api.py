from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.seed import seed_database
from tests.helpers import lesson_id_by_title, login_demo


def test_learning_path_returns_progress_and_unlock_states(
    db_session: Session,
    api_client: TestClient,
) -> None:
    seed_database(db_session)
    login_demo(api_client)

    response = api_client.get("/api/v1/path")

    assert response.status_code == 200
    body = response.json()
    assert body["course"]["code"] == "es-en"
    assert len(body["units"]) == 2
    assert body["learner"]["total_xp"] == 10
    assert body["learner"]["today_xp"] == 10

    skills = {
        skill["title"]: skill
        for unit in body["units"]
        for skill in unit["skills"]
    }
    basics = skills["Basics"]
    assert basics["state"] == "available"
    assert basics["lessons_completed"] == 1
    assert basics["lesson_count"] == 2
    assert basics["lessons"][0]["is_completed"] is True
    assert basics["lessons"][1]["is_completed"] is False
    assert basics["next_lesson_id"] == basics["lessons"][1]["id"]

    assert skills["Greetings"]["state"] == "locked"
    assert skills["Greetings"]["next_lesson_id"] is None
    assert skills["Greetings"]["prerequisite_ids"] == [basics["id"]]


def test_unlocked_lesson_hides_private_answer_data(
    db_session: Session,
    api_client: TestClient,
) -> None:
    seed_database(db_session)
    login_demo(api_client)
    lesson_id = lesson_id_by_title(db_session, "Basics 2")

    response = api_client.get(f"/api/v1/lessons/{lesson_id}")

    assert response.status_code == 200
    body = response.json()
    assert body["title"] == "Basics 2"
    assert body["exercise_count"] == 5
    assert len(body["exercises"]) == 5

    for exercise in body["exercises"]:
        assert "correct_answer" not in exercise
        assert "answer_data" not in exercise
        assert "explanation" not in exercise
        for option in exercise["options"]:
            assert "is_correct" not in option
            assert "pair_key" not in option


def test_locked_lesson_returns_forbidden(
    db_session: Session,
    api_client: TestClient,
) -> None:
    seed_database(db_session)
    login_demo(api_client)
    lesson_id = lesson_id_by_title(db_session, "Greetings 1")

    response = api_client.get(f"/api/v1/lessons/{lesson_id}")

    assert response.status_code == 403
    assert response.json() == {
        "detail": "Complete the prerequisite skills to unlock this lesson."
    }


def test_unknown_lesson_returns_not_found(
    db_session: Session,
    api_client: TestClient,
) -> None:
    seed_database(db_session)
    login_demo(api_client)

    response = api_client.get("/api/v1/lessons/999999")

    assert response.status_code == 404
    assert response.json() == {"detail": "Lesson not found."}


def test_profile_combines_stats_progress_and_achievements(
    db_session: Session,
    api_client: TestClient,
) -> None:
    seed_database(db_session)
    login_demo(api_client)

    response = api_client.get("/api/v1/profile")

    assert response.status_code == 200
    body = response.json()
    assert body["username"] == "learner"
    assert body["display_name"] == "Ava"
    assert body["stats"]["total_xp"] == 10
    assert body["stats"]["today_xp"] == 10
    assert body["lessons_completed"] == 1
    assert body["skills_completed"] == 0
    assert [achievement["code"] for achievement in body["achievements"]] == [
        "first-step"
    ]
    assert body["achievements"][0]["unlocked_at"].endswith("Z")


def test_leaderboard_is_ranked_and_highlights_learner(
    db_session: Session,
    api_client: TestClient,
) -> None:
    seed_database(db_session)
    login_demo(api_client)

    response = api_client.get("/api/v1/leaderboard")

    assert response.status_code == 200
    body = response.json()
    assert [entry["username"] for entry in body["entries"]] == [
        "maya",
        "zara",
        "leo",
        "noah",
        "learner",
    ]
    assert [entry["rank"] for entry in body["entries"]] == [1, 2, 3, 4, 5]
    assert body["current_learner_rank"] == 5
    assert body["entries"][4]["is_current_learner"] is True


def test_learning_path_requires_authentication(api_client: TestClient) -> None:
    response = api_client.get("/api/v1/path")

    assert response.status_code == 401
    assert response.json() == {"detail": "Authentication required."}


def test_openapi_lists_public_endpoints_without_answer_fields(
    api_client: TestClient,
) -> None:
    response = api_client.get("/openapi.json")

    assert response.status_code == 200
    document = response.json()
    assert {
        "/api/v1/path",
        "/api/v1/lessons/{lesson_id}",
        "/api/v1/profile",
        "/api/v1/leaderboard",
        "/api/v1/auth/login",
        "/api/v1/auth/logout",
        "/api/v1/auth/me",
        "/api/v1/lessons/{lesson_id}/attempts",
        "/api/v1/attempts/{attempt_id}/answers",
        "/api/v1/hearts/refill",
    }.issubset(document["paths"])

    lesson_schema = document["components"]["schemas"]["ExerciseResponse"]
    properties = lesson_schema["properties"]
    assert "correct_answer" not in properties
    assert "answer_data" not in properties
