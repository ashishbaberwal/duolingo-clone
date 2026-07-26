from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models import (
    DailyActivity,
    Exercise,
    Lesson,
    LessonAttempt,
    Skill,
    UserSkillProgress,
)
from app.models.enums import AttemptStatus


def get_active_attempt(
    session: Session,
    *,
    user_id: int,
    lesson_id: int,
) -> LessonAttempt | None:
    statement = (
        select(LessonAttempt)
        .where(
            LessonAttempt.user_id == user_id,
            LessonAttempt.lesson_id == lesson_id,
            LessonAttempt.status == AttemptStatus.IN_PROGRESS,
        )
        .options(
            selectinload(LessonAttempt.answers),
            selectinload(LessonAttempt.lesson)
            .selectinload(Lesson.exercises)
            .selectinload(Exercise.options),
        )
        .order_by(LessonAttempt.started_at.desc(), LessonAttempt.id.desc())
    )
    return session.scalar(statement)


def get_attempt_for_user(
    session: Session,
    *,
    attempt_id: int,
    user_id: int,
) -> LessonAttempt | None:
    statement = (
        select(LessonAttempt)
        .where(
            LessonAttempt.id == attempt_id,
            LessonAttempt.user_id == user_id,
        )
        .options(
            selectinload(LessonAttempt.answers),
            selectinload(LessonAttempt.lesson)
            .selectinload(Lesson.exercises)
            .selectinload(Exercise.options),
            selectinload(LessonAttempt.lesson)
            .selectinload(Lesson.skill)
            .selectinload(Skill.lessons),
        )
    )
    return session.scalar(statement)


def get_skill_progress_row(
    session: Session,
    *,
    user_id: int,
    skill_id: int,
) -> UserSkillProgress | None:
    return session.scalar(
        select(UserSkillProgress).where(
            UserSkillProgress.user_id == user_id,
            UserSkillProgress.skill_id == skill_id,
        )
    )


def get_daily_activity(
    session: Session,
    *,
    user_id: int,
    activity_date: date,
) -> DailyActivity | None:
    return session.scalar(
        select(DailyActivity).where(
            DailyActivity.user_id == user_id,
            DailyActivity.activity_date == activity_date,
        )
    )


def has_completed_lesson(
    session: Session,
    *,
    user_id: int,
    lesson_id: int,
) -> bool:
    return (
        session.scalar(
            select(LessonAttempt.id)
            .where(
                LessonAttempt.user_id == user_id,
                LessonAttempt.lesson_id == lesson_id,
                LessonAttempt.status == AttemptStatus.COMPLETED,
            )
            .limit(1)
        )
        is not None
    )
