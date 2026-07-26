from collections.abc import Callable
from dataclasses import dataclass
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import (
    Achievement,
    DailyActivity,
    LessonAttempt,
    User,
    UserAchievement,
)
from app.services.stats import count_completed_lessons


@dataclass(frozen=True)
class AchievementContext:
    learner: User
    attempt: LessonAttempt
    completed_lessons: int


AchievementRule = Callable[[AchievementContext], bool]


ACHIEVEMENT_RULES: dict[str, AchievementRule] = {
    "first-step": lambda context: context.completed_lessons >= 1,
    "xp-100": lambda context: context.learner.total_xp >= 100,
    "week-warrior": lambda context: context.learner.current_streak >= 7,
    "perfect-lesson": lambda context: context.attempt.wrong_count == 0,
}


def award_eligible_achievements(
    session: Session,
    learner: User,
    attempt: LessonAttempt,
    daily_activity: DailyActivity,
    *,
    unlocked_at: datetime,
) -> list[Achievement]:
    """Award every newly satisfied achievement and apply its XP bonus once."""
    achievements = list(
        session.scalars(select(Achievement).order_by(Achievement.id))
    )
    awarded_codes = set(
        session.scalars(
            select(Achievement.code)
            .join(UserAchievement)
            .where(UserAchievement.user_id == learner.id)
        )
    )
    newly_unlocked: list[Achievement] = []

    while True:
        context = AchievementContext(
            learner=learner,
            attempt=attempt,
            completed_lessons=count_completed_lessons(session, learner.id),
        )
        eligible = [
            achievement
            for achievement in achievements
            if achievement.code not in awarded_codes
            and (rule := ACHIEVEMENT_RULES.get(achievement.code)) is not None
            and rule(context)
        ]
        if not eligible:
            break

        for achievement in eligible:
            session.add(
                UserAchievement(
                    user=learner,
                    achievement=achievement,
                    unlocked_at=unlocked_at,
                )
            )
            learner.total_xp += achievement.xp_reward
            daily_activity.xp_earned += achievement.xp_reward
            awarded_codes.add(achievement.code)
            newly_unlocked.append(achievement)

    return newly_unlocked
