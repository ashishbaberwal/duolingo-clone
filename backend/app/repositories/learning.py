from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models import (
    Course,
    Exercise,
    Lesson,
    LessonAttempt,
    Skill,
    Unit,
    UserSkillProgress,
)
from app.models.enums import AttemptStatus


def get_active_course(session: Session) -> Course | None:
    statement = (
        select(Course)
        .where(Course.is_active.is_(True))
        .options(
            selectinload(Course.units)
            .selectinload(Unit.skills)
            .selectinload(Skill.lessons),
            selectinload(Course.units)
            .selectinload(Unit.skills)
            .selectinload(Skill.prerequisites),
        )
        .order_by(Course.id)
    )
    return session.scalar(statement)


def get_skill_progress(
    session: Session,
    user_id: int,
) -> dict[int, UserSkillProgress]:
    progress_rows = session.scalars(
        select(UserSkillProgress).where(UserSkillProgress.user_id == user_id)
    )
    return {progress.skill_id: progress for progress in progress_rows}


def get_completed_lesson_ids(session: Session, user_id: int) -> set[int]:
    lesson_ids = session.scalars(
        select(LessonAttempt.lesson_id)
        .where(
            LessonAttempt.user_id == user_id,
            LessonAttempt.status == AttemptStatus.COMPLETED,
        )
        .distinct()
    )
    return set(lesson_ids)


def get_lesson_with_content(session: Session, lesson_id: int) -> Lesson | None:
    statement = (
        select(Lesson)
        .where(Lesson.id == lesson_id)
        .options(
            selectinload(Lesson.exercises).selectinload(Exercise.options),
            selectinload(Lesson.skill).selectinload(Skill.prerequisites),
        )
    )
    return session.scalar(statement)
