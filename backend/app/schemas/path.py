from enum import StrEnum

from app.schemas.common import ApiModel, LearnerStats


class SkillState(StrEnum):
    COMPLETED = "completed"
    AVAILABLE = "available"
    LOCKED = "locked"


class LessonNode(ApiModel):
    id: int
    title: str
    position: int
    is_completed: bool


class SkillNode(ApiModel):
    id: int
    title: str
    description: str | None
    icon: str
    position: int
    state: SkillState
    lessons_completed: int
    lesson_count: int
    crowns: int
    next_lesson_id: int | None
    prerequisite_ids: list[int]
    lessons: list[LessonNode]


class UnitNode(ApiModel):
    id: int
    title: str
    description: str | None
    position: int
    skills: list[SkillNode]


class CourseSummary(ApiModel):
    id: int
    code: str
    title: str
    source_language: str
    target_language: str


class LearningPathResponse(ApiModel):
    course: CourseSummary
    learner: LearnerStats
    units: list[UnitNode]
