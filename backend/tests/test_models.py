from datetime import UTC, datetime

import pytest
from sqlalchemy import Engine, func, inspect, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.base import utc_now
from app.models import (
    AttemptAnswer,
    Course,
    Exercise,
    ExerciseOption,
    ExerciseType,
    Lesson,
    LessonAttempt,
    Skill,
    Unit,
    User,
    UserSkillProgress,
)


def build_course_graph() -> tuple[Course, Skill, Skill, Lesson, Exercise]:
    course = Course(
        code="es-en",
        title="Spanish for English Speakers",
        description="A compact Spanish course.",
        source_language="English",
        target_language="Spanish",
    )
    unit = Unit(
        title="First Steps",
        description="Learn the essentials.",
        position=1,
    )
    basics = Skill(
        title="Basics",
        description="Essential words.",
        icon="book",
        position=1,
    )
    greetings = Skill(
        title="Greetings",
        description="Meet and greet.",
        icon="wave",
        position=2,
        prerequisites=[basics],
    )
    lesson = Lesson(title="Basics 1", position=1, xp_reward=10)
    exercise = Exercise(
        exercise_type=ExerciseType.MULTIPLE_CHOICE,
        instruction="Choose the correct translation",
        prompt="Hello",
        correct_answer="hola",
        answer_data=None,
        explanation="Hola means hello.",
        position=1,
    )
    exercise.options = [
        ExerciseOption(
            text="Hola",
            value="hola",
            position=1,
            is_correct=True,
            pair_key=None,
            match_side=None,
        ),
        ExerciseOption(
            text="Adiós",
            value="adios",
            position=2,
            is_correct=False,
            pair_key=None,
            match_side=None,
        ),
    ]
    lesson.exercises = [exercise]
    basics.lessons = [lesson]
    unit.skills = [basics, greetings]
    course.units = [unit]

    return course, basics, greetings, lesson, exercise


def test_schema_contains_all_domain_tables(db_engine: Engine) -> None:
    table_names = set(inspect(db_engine).get_table_names())

    assert table_names == {
        "achievements",
        "attempt_answers",
        "courses",
        "daily_activity",
        "exercise_options",
        "exercises",
        "lesson_attempts",
        "lessons",
        "skill_prerequisites",
        "skills",
        "units",
        "user_achievements",
        "user_skill_progress",
        "users",
    }


def test_course_relationships_and_prerequisites_are_persisted(db_session: Session) -> None:
    course, basics, greetings, _, _ = build_course_graph()
    db_session.add(course)
    db_session.commit()
    db_session.expire_all()

    stored_course = db_session.scalar(select(Course).where(Course.code == "es-en"))

    assert stored_course is not None
    assert stored_course.units[0].skills == [basics, greetings]
    assert greetings.prerequisites == [basics]
    assert basics.unlocks == [greetings]
    assert basics.lessons[0].exercises[0].options[0].is_correct is True


def test_attempt_answer_and_skill_progress_form_an_audit_trail(db_session: Session) -> None:
    course, basics, _, lesson, exercise = build_course_graph()
    user = User(username="learner", display_name="Ava")
    db_session.add_all([course, user])
    db_session.flush()

    progress = UserSkillProgress(
        user=user,
        skill=basics,
        lessons_completed=0,
        crowns=0,
        is_unlocked=True,
        is_completed=False,
        completed_at=None,
    )
    attempt = LessonAttempt(
        user=user,
        lesson=lesson,
        hearts_at_start=5,
        hearts_remaining=5,
        started_at=datetime.now(UTC),
    )
    answer = AttemptAnswer(
        attempt=attempt,
        exercise=exercise,
        submitted_answer={"value": "hola"},
        is_correct=True,
        feedback="Correct",
    )
    db_session.add_all([progress, attempt, answer])
    db_session.commit()

    assert user.skill_progress == [progress]
    assert attempt.answers == [answer]
    assert attempt.answers[0].submitted_answer == {"value": "hola"}


def test_foreign_keys_are_enforced_for_sqlite(db_session: Session) -> None:
    db_session.add(
        Unit(
            course_id=999,
            title="Orphaned unit",
            description=None,
            position=1,
        )
    )

    with pytest.raises(IntegrityError):
        db_session.commit()


def test_duplicate_positions_are_rejected_within_a_parent(db_session: Session) -> None:
    course = Course(
        code="duplicate-test",
        title="Duplicate Test",
        description=None,
        source_language="English",
        target_language="Spanish",
        units=[
            Unit(title="One", description=None, position=1),
            Unit(title="Also One", description=None, position=1),
        ],
    )
    db_session.add(course)

    with pytest.raises(IntegrityError):
        db_session.commit()


def test_user_hearts_cannot_exceed_maximum(db_session: Session) -> None:
    db_session.add(
        User(
            username="too-many-hearts",
            display_name="Invalid Learner",
            hearts=6,
            max_hearts=5,
        )
    )

    with pytest.raises(IntegrityError):
        db_session.commit()


def test_deleting_course_cascades_through_content(db_session: Session) -> None:
    course, _, _, _, _ = build_course_graph()
    db_session.add(course)
    db_session.commit()

    db_session.delete(course)
    db_session.commit()

    remaining_skills = db_session.scalar(select(func.count()).select_from(Skill))
    remaining_lessons = db_session.scalar(select(func.count()).select_from(Lesson))
    remaining_exercises = db_session.scalar(select(func.count()).select_from(Exercise))

    assert remaining_skills == 0
    assert remaining_lessons == 0
    assert remaining_exercises == 0


def test_timestamps_are_timezone_aware_before_storage() -> None:
    timestamp = utc_now()

    assert timestamp.tzinfo is UTC
