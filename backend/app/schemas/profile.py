from datetime import datetime

from app.schemas.common import ApiModel, LearnerStats


class AchievementResponse(ApiModel):
    code: str
    title: str
    description: str
    icon: str
    unlocked_at: datetime


class ProfileResponse(ApiModel):
    username: str
    display_name: str
    avatar_key: str
    stats: LearnerStats
    longest_streak: int
    skills_completed: int
    lessons_completed: int
    achievements: list[AchievementResponse]
