from collections import defaultdict
from datetime import date, timedelta
from typing import Any, cast

from fastapi.testclient import TestClient
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import (
    Achievement,
    AttemptAnswer,
    Exercise,
    LessonAttempt,
    MatchSide,
    User,
    UserAchievement,
    UserSkillProgress,
)
from app.seed import seed_database
from app.services.stats import current_date_for_learner, record_daily_streak
from tests.helpers import (
    TEST_USERNAME,
    lesson_id_by_title,
    register_and_login_user,
)


def lesson_payload(
    client: TestClient,
    session: Session,
    lesson_id: int,
) -> dict[str, Any]:
    response = client.get(f"/api/v1/lessons/{lesson_id}")
    assert response.status_code == 200
    return cast(dict[str, Any], response.json())


def correct_answer_for(
    session: Session,
    exercise_payload: dict[str, Any],
) -> dict[str, object]:
    exercise_type = exercise_payload["exercise_type"]
    exercise = session.get(Exercise, exercise_payload["id"])
    assert exercise is not None

    if exercise_type == "multiple_choice":
        return {"value": exercise.correct_answer}
    if exercise_type == "word_bank":
        assert exercise.correct_answer is not None
        return {"tokens": exercise.correct_answer.split()}
    if exercise_type == "fill_blank":
        return {"text": exercise.correct_answer}
    if exercise_type == "type_answer":
        return {"text": exercise.correct_answer}

    options_by_pair: defaultdict[str, dict[MatchSide, int]] = defaultdict(dict)
    for option in exercise.options:
        assert option.pair_key is not None
        assert option.match_side is not None
        options_by_pair[option.pair_key][option.match_side] = option.id

    return {
        "pairs": [
            {
                "left_option_id": pair[MatchSide.LEFT],
                "right_option_id": pair[MatchSide.RIGHT],
            }
            for pair in options_by_pair.values()
        ]
    }


def complete_lesson(
    client: TestClient,
    session: Session,
    lesson_id: int,
) -> dict[str, Any]:
    lesson = lesson_payload(client, session, lesson_id)
    start = client.post(f"/api/v1/lessons/{lesson_id}/attempts")
    assert start.status_code == 200
    attempt_id = start.json()["id"]

    feedback: dict[str, Any] = {}
    for exercise in lesson["exercises"]:
        response = client.post(
            f"/api/v1/attempts/{attempt_id}/answers",
            json={
                "exercise_id": exercise["id"],
                "answer": correct_answer_for(session, exercise),
            },
        )
        assert response.status_code == 200
        feedback = response.json()
        assert feedback["is_correct"] is True

    return feedback


def test_starting_an_attempt_is_resumable_and_idempotent(
    db_session: Session,
    api_client: TestClient,
) -> None:
    seed_database(db_session)
    register_and_login_user(api_client)
    lesson_id = lesson_id_by_title(db_session, "Basics 1")

    first = api_client.post(f"/api/v1/lessons/{lesson_id}/attempts")
    second = api_client.post(f"/api/v1/lessons/{lesson_id}/attempts")

    assert first.status_code == second.status_code == 200
    assert first.json() == second.json()
    assert first.json()["status"] == "in_progress"
    assert first.json()["answered_count"] == 0
    assert first.json()["exercise_count"] == 5
    attempt_count = db_session.scalar(
        select(func.count()).select_from(LessonAttempt)
    )
    assert attempt_count == 1


def test_wrong_answer_loses_a_heart_and_cannot_be_resubmitted(
    db_session: Session,
    api_client: TestClient,
) -> None:
    seed_database(db_session)
    register_and_login_user(api_client)
    lesson_id = lesson_id_by_title(db_session, "Basics 1")
    lesson = lesson_payload(api_client, db_session, lesson_id)
    start = api_client.post(f"/api/v1/lessons/{lesson_id}/attempts").json()
    first_exercise = lesson["exercises"][0]

    response = api_client.post(
        f"/api/v1/attempts/{start['id']}/answers",
        json={
            "exercise_id": first_exercise["id"],
            "answer": {"value": "incorrect"},
        },
    )

    assert response.status_code == 200
    feedback = response.json()
    assert feedback["is_correct"] is False
    assert feedback["correct_answer"] == "hola"
    assert feedback["hearts_remaining"] == 4
    assert feedback["learner"]["hearts"] == 4
    assert feedback["next_exercise_id"] == lesson["exercises"][1]["id"]

    duplicate = api_client.post(
        f"/api/v1/attempts/{start['id']}/answers",
        json={
            "exercise_id": first_exercise["id"],
            "answer": {"value": "la niña"},
        },
    )
    assert duplicate.status_code == 409
    assert duplicate.json()["detail"] == (
        "Answer the current exercise before continuing."
    )


def test_all_exercise_types_complete_lesson_and_persist_progress(
    db_session: Session,
    api_client: TestClient,
) -> None:
    seed_database(db_session)
    register_and_login_user(api_client)
    first_lesson_id = lesson_id_by_title(db_session, "Basics 1")
    second_lesson_id = lesson_id_by_title(db_session, "Basics 2")

    first_feedback = complete_lesson(api_client, db_session, first_lesson_id)
    feedback = complete_lesson(api_client, db_session, second_lesson_id)

    assert first_feedback["learner"]["total_xp"] == 25
    assert [
        achievement["code"]
        for achievement in first_feedback["unlocked_achievements"]
    ] == ["first-step", "perfect-lesson"]
    assert feedback["status"] == "completed"
    assert feedback["answered_count"] == feedback["exercise_count"] == 5
    assert feedback["next_exercise_id"] is None
    assert feedback["xp_earned"] == 10
    assert feedback["learner"]["total_xp"] == 35
    assert feedback["learner"]["today_xp"] == 35
    assert feedback["learner"]["hearts"] == 5
    assert feedback["unlocked_achievements"] == []

    learner = db_session.scalar(select(User).where(User.username == TEST_USERNAME))
    assert learner is not None
    progress = db_session.scalar(
        select(UserSkillProgress).where(
            UserSkillProgress.user_id == learner.id,
            UserSkillProgress.skill.has(title="Basics"),
        )
    )
    assert progress is not None
    assert progress.lessons_completed == 2
    assert progress.is_completed is True
    assert progress.crowns == 1

    answer_count = db_session.scalar(
        select(func.count()).select_from(AttemptAnswer)
    )
    assert answer_count == 10

    path = api_client.get("/api/v1/path")
    assert path.status_code == 200
    skills = {
        skill["title"]: skill
        for unit in path.json()["units"]
        for skill in unit["skills"]
    }
    assert skills["Basics"]["state"] == "completed"
    assert skills["Greetings"]["state"] == "available"


def test_practice_awards_xp_without_double_counting_skill_progress(
    db_session: Session,
    api_client: TestClient,
) -> None:
    seed_database(db_session)
    register_and_login_user(api_client)
    lesson_id = lesson_id_by_title(db_session, "Basics 1")

    complete_lesson(api_client, db_session, lesson_id)
    second_completion = complete_lesson(api_client, db_session, lesson_id)

    assert second_completion["learner"]["total_xp"] == 35
    learner = db_session.scalar(select(User).where(User.username == TEST_USERNAME))
    assert learner is not None
    progress = db_session.scalar(
        select(UserSkillProgress).where(
            UserSkillProgress.user_id == learner.id,
            UserSkillProgress.skill.has(title="Basics"),
        )
    )
    assert progress is not None
    assert progress.lessons_completed == 1
    assert progress.crowns == 0


def test_completion_awards_every_eligible_achievement_once(
    db_session: Session,
    api_client: TestClient,
) -> None:
    seed_database(db_session)
    register_and_login_user(api_client)
    learner = db_session.scalar(select(User).where(User.username == TEST_USERNAME))
    assert learner is not None
    today = current_date_for_learner(learner)
    learner.total_xp = 90
    learner.current_streak = 6
    learner.longest_streak = 6
    learner.last_activity_date = today - timedelta(days=1)
    db_session.commit()

    lesson_id = lesson_id_by_title(db_session, "Basics 1")
    feedback = complete_lesson(api_client, db_session, lesson_id)

    assert feedback["learner"]["total_xp"] == 140
    assert feedback["learner"]["today_xp"] == 50
    assert feedback["learner"]["current_streak"] == 7
    assert [
        (achievement["code"], achievement["xp_reward"])
        for achievement in feedback["unlocked_achievements"]
    ] == [
        ("first-step", 5),
        ("xp-100", 10),
        ("week-warrior", 15),
        ("perfect-lesson", 10),
    ]

    achievement_rows = db_session.execute(
        select(UserAchievement, Achievement)
        .join(Achievement)
        .where(UserAchievement.user_id == learner.id)
        .order_by(Achievement.id)
    ).all()
    assert [achievement.code for _, achievement in achievement_rows] == [
        "first-step",
        "xp-100",
        "week-warrior",
        "perfect-lesson",
    ]

    profile = api_client.get("/api/v1/profile")
    assert profile.status_code == 200
    assert [
        (achievement["code"], achievement["xp_reward"])
        for achievement in profile.json()["achievements"]
    ] == [
        ("first-step", 5),
        ("xp-100", 10),
        ("week-warrior", 15),
        ("perfect-lesson", 10),
    ]

    practice_feedback = complete_lesson(api_client, db_session, lesson_id)
    assert practice_feedback["unlocked_achievements"] == []
    assert len(learner.achievements) == 4


def test_zero_hearts_fails_attempt_until_mock_refill(
    db_session: Session,
    api_client: TestClient,
) -> None:
    seed_database(db_session)
    register_and_login_user(api_client)
    learner = db_session.scalar(select(User).where(User.username == TEST_USERNAME))
    assert learner is not None
    learner.hearts = 1
    db_session.commit()
    lesson_id = lesson_id_by_title(db_session, "Basics 1")
    lesson = lesson_payload(api_client, db_session, lesson_id)
    start = api_client.post(f"/api/v1/lessons/{lesson_id}/attempts").json()

    failed = api_client.post(
        f"/api/v1/attempts/{start['id']}/answers",
        json={
            "exercise_id": lesson["exercises"][0]["id"],
            "answer": {"value": "incorrect"},
        },
    )

    assert failed.status_code == 200
    assert failed.json()["status"] == "failed"
    assert failed.json()["hearts_remaining"] == 0

    closed = api_client.post(
        f"/api/v1/attempts/{start['id']}/answers",
        json={
            "exercise_id": lesson["exercises"][1]["id"],
            "answer": {"tokens": ["él", "es", "un", "hombre"]},
        },
    )
    assert closed.status_code == 409
    assert closed.json()["detail"] == "This lesson attempt is already closed."

    blocked = api_client.post(f"/api/v1/lessons/{lesson_id}/attempts")
    assert blocked.status_code == 409
    assert blocked.json()["detail"] == (
        "Refill your hearts before starting another lesson."
    )

    refill = api_client.post("/api/v1/hearts/refill")
    assert refill.status_code == 200
    assert refill.json()["learner"]["hearts"] == 5

    restarted = api_client.post(f"/api/v1/lessons/{lesson_id}/attempts")
    assert restarted.status_code == 200
    assert restarted.json()["id"] != start["id"]


def test_invalid_answer_shape_is_rejected_without_recording_answer(
    db_session: Session,
    api_client: TestClient,
) -> None:
    seed_database(db_session)
    register_and_login_user(api_client)
    lesson_id = lesson_id_by_title(db_session, "Basics 1")
    lesson = lesson_payload(api_client, db_session, lesson_id)
    start = api_client.post(f"/api/v1/lessons/{lesson_id}/attempts").json()

    response = api_client.post(
        f"/api/v1/attempts/{start['id']}/answers",
        json={
            "exercise_id": lesson["exercises"][0]["id"],
            "answer": {"text": "la niña"},
        },
    )

    assert response.status_code == 422
    assert response.json()["detail"] == (
        "The submitted answer is invalid for this exercise."
    )
    resumed = api_client.post(f"/api/v1/lessons/{lesson_id}/attempts")
    assert resumed.json()["answered_count"] == 0


def test_streak_updates_once_per_day_and_resets_after_a_gap() -> None:
    learner = User(
        username="streak-test",
        display_name="Streak Test",
        current_streak=2,
        longest_streak=4,
        last_activity_date=date(2026, 7, 25),
    )

    record_daily_streak(learner, date(2026, 7, 26))
    assert learner.current_streak == 3
    assert learner.longest_streak == 4

    record_daily_streak(learner, date(2026, 7, 26))
    assert learner.current_streak == 3

    record_daily_streak(
        learner,
        date(2026, 7, 26) + timedelta(days=2),
    )
    assert learner.current_streak == 1
    assert learner.longest_streak == 4


def test_locked_lesson_cannot_start_attempt(
    db_session: Session,
    api_client: TestClient,
) -> None:
    seed_database(db_session)
    register_and_login_user(api_client)
    lesson_id = lesson_id_by_title(db_session, "Greetings 1")

    response = api_client.post(f"/api/v1/lessons/{lesson_id}/attempts")

    assert response.status_code == 403
