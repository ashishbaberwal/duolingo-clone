from app.schemas.common import ApiModel


class LeaderboardEntry(ApiModel):
    rank: int
    username: str
    display_name: str
    avatar_key: str
    total_xp: int
    is_current_learner: bool


class LeaderboardResponse(ApiModel):
    entries: list[LeaderboardEntry]
    current_learner_rank: int
