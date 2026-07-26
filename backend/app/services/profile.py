from datetime import UTC, date, datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Achievement, User, UserAchievement
from app.schemas.profile import AchievementResponse, ProfileResponse
from app.services.stats import (
    count_completed_lessons,
    count_completed_skills,
    get_learner_stats,
)


def _as_utc(timestamp: datetime) -> datetime:
    if timestamp.tzinfo is None:
        return timestamp.replace(tzinfo=UTC)
    return timestamp.astimezone(UTC)


def get_profile(
    session: Session,
    learner: User,
    *,
    today: date | None = None,
) -> ProfileResponse:
    achievement_rows = session.execute(
        select(UserAchievement, Achievement)
        .join(Achievement)
        .where(UserAchievement.user_id == learner.id)
        .order_by(UserAchievement.unlocked_at)
    ).all()
    achievements = [
        AchievementResponse(
            code=achievement.code,
            title=achievement.title,
            description=achievement.description,
            icon=achievement.icon,
            xp_reward=achievement.xp_reward,
            unlocked_at=_as_utc(user_achievement.unlocked_at),
        )
        for user_achievement, achievement in achievement_rows
    ]

    return ProfileResponse(
        username=learner.username,
        display_name=learner.display_name,
        avatar_key=learner.avatar_key,
        stats=get_learner_stats(session, learner, today=today),
        longest_streak=learner.longest_streak,
        skills_completed=count_completed_skills(session, learner.id),
        lessons_completed=count_completed_lessons(session, learner.id),
        achievements=achievements,
    )
