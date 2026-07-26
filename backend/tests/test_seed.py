from datetime import date

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import (
    Achievement,
    AttemptAnswer,
    Course,
    DailyActivity,
    Exercise,
    ExerciseOption,
    ExerciseType,
    Lesson,
    LessonAttempt,
    Skill,
    Unit,
    User,
    UserAchievement,
    UserSkillProgress,
)
from app.seed import seed_database

SEED_DATE = date(2026, 7, 26)


def table_counts(session: Session) -> dict[str, int]:
    models = (
        Course,
        Unit,
        Skill,
        Lesson,
        Exercise,
        ExerciseOption,
        User,
        UserSkillProgress,
        LessonAttempt,
        AttemptAnswer,
        DailyActivity,
        Achievement,
        UserAchievement,
    )
    return {
        model.__tablename__: int(
            session.scalar(select(func.count()).select_from(model)) or 0
        )
        for model in models
    }


def test_seed_creates_complete_course_and_leaderboard(db_session: Session) -> None:
    result = seed_database(db_session, today=SEED_DATE)

    assert result.created is True
    assert result.courses == 1
    assert result.units == 2
    assert result.skills == 5
    assert result.lessons == 6
    assert result.exercises == 30
    assert result.users == 5

    exercise_types = set(db_session.scalars(select(Exercise.exercise_type)))
    assert exercise_types == set(ExerciseType)

    leaderboard = list(
        db_session.scalars(select(User).order_by(User.total_xp.desc(), User.username))
    )
    assert [learner.username for learner in leaderboard] == [
        "maya",
        "zara",
        "leo",
        "noah",
        "learner",
    ]


def test_seed_is_idempotent(db_session: Session) -> None:
    first_result = seed_database(db_session, today=SEED_DATE)
    counts_after_first_run = table_counts(db_session)

    second_result = seed_database(db_session, today=SEED_DATE)
    counts_after_second_run = table_counts(db_session)

    assert first_result.created is True
    assert second_result.created is False
    assert counts_after_second_run == counts_after_first_run


def test_seeded_path_has_linear_prerequisites(db_session: Session) -> None:
    seed_database(db_session, today=SEED_DATE)

    skills = {
        skill.title: skill for skill in db_session.scalars(select(Skill)).unique()
    }

    assert skills["Basics"].prerequisites == []
    assert skills["Greetings"].prerequisites == [skills["Basics"]]
    assert skills["Food"].prerequisites == [skills["Greetings"]]
    assert skills["Family"].prerequisites == [skills["Food"]]
    assert skills["Travel"].prerequisites == [skills["Family"]]


def test_default_learner_has_consistent_partial_progress(db_session: Session) -> None:
    seed_database(db_session, today=SEED_DATE)

    learner = db_session.scalar(select(User).where(User.username == "learner"))
    assert learner is not None
    assert learner.total_xp == 10
    assert learner.current_streak == 1
    assert learner.longest_streak == 1

    progress_by_skill = {
        progress.skill.title: progress for progress in learner.skill_progress
    }
    assert len(progress_by_skill) == 5
    assert progress_by_skill["Basics"].is_unlocked is True
    assert progress_by_skill["Basics"].lessons_completed == 1
    assert progress_by_skill["Basics"].is_completed is False
    assert all(
        not progress.is_unlocked
        for skill_title, progress in progress_by_skill.items()
        if skill_title != "Basics"
    )

    assert len(learner.lesson_attempts) == 1
    attempt = learner.lesson_attempts[0]
    assert attempt.status.value == "completed"
    assert attempt.correct_count == len(attempt.answers) == 5
    assert attempt.wrong_count == 0
    assert attempt.xp_earned == 10

    assert learner.daily_activity[0].activity_date == SEED_DATE
    assert learner.daily_activity[0].xp_earned == 10
    assert learner.achievements[0].achievement.code == "first-step"
