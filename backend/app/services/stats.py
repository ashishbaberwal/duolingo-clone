from datetime import date, datetime
from zoneinfo import ZoneInfo

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import DailyActivity, LessonAttempt, User, UserSkillProgress
from app.models.enums import AttemptStatus
from app.schemas.common import LearnerStats


def current_date_for_learner(user: User) -> date:
    return datetime.now(ZoneInfo(user.timezone)).date()


def get_learner_stats(
    session: Session,
    user: User,
    *,
    today: date | None = None,
) -> LearnerStats:
    activity_date = today or current_date_for_learner(user)
    today_xp = session.scalar(
        select(DailyActivity.xp_earned).where(
            DailyActivity.user_id == user.id,
            DailyActivity.activity_date == activity_date,
        )
    )
    return LearnerStats(
        hearts=user.hearts,
        max_hearts=user.max_hearts,
        gems=user.gems,
        total_xp=user.total_xp,
        current_streak=user.current_streak,
        daily_goal_xp=user.daily_goal_xp,
        today_xp=today_xp or 0,
    )


def count_completed_skills(session: Session, user_id: int) -> int:
    value = session.scalar(
        select(func.count())
        .select_from(UserSkillProgress)
        .where(
            UserSkillProgress.user_id == user_id,
            UserSkillProgress.is_completed.is_(True),
        )
    )
    return int(value or 0)


def count_completed_lessons(session: Session, user_id: int) -> int:
    value = session.scalar(
        select(func.count(func.distinct(LessonAttempt.lesson_id))).where(
            LessonAttempt.user_id == user_id,
            LessonAttempt.status == AttemptStatus.COMPLETED,
        )
    )
    return int(value or 0)
