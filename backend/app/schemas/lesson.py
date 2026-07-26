from app.models.enums import ExerciseType, MatchSide
from app.schemas.common import ApiModel


class ExerciseOptionResponse(ApiModel):
    id: int
    text: str
    value: str
    position: int
    match_side: MatchSide | None


class ExerciseResponse(ApiModel):
    id: int
    exercise_type: ExerciseType
    instruction: str
    prompt: str
    position: int
    options: list[ExerciseOptionResponse]


class LessonResponse(ApiModel):
    id: int
    skill_id: int
    skill_title: str
    title: str
    position: int
    xp_reward: int
    exercise_count: int
    exercises: list[ExerciseResponse]
