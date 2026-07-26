from pydantic import BaseModel, ConfigDict


class ApiModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class LearnerStats(ApiModel):
    hearts: int
    max_hearts: int
    gems: int
    total_xp: int
    current_streak: int
    daily_goal_xp: int
    today_xp: int
