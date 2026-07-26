from sqlalchemy.orm import Session

from app.models import Lesson, Skill, User, UserSkillProgress
from app.repositories.learning import (
    get_active_course,
    get_completed_lesson_ids,
    get_lesson_with_content,
    get_skill_progress,
)
from app.schemas.lesson import (
    ExerciseOptionResponse,
    ExerciseResponse,
    LessonResponse,
)
from app.schemas.path import (
    CourseSummary,
    LearningPathResponse,
    LessonNode,
    SkillNode,
    SkillState,
    UnitNode,
)
from app.services.stats import get_learner_stats


class CourseUnavailableError(Exception):
    """Raised when no active course has been configured."""


class LessonNotFoundError(Exception):
    """Raised when a requested lesson does not exist."""


class LessonLockedError(Exception):
    """Raised when a learner requests content they have not unlocked."""


def _skill_state(
    skill: Skill,
    progress_by_skill: dict[int, UserSkillProgress],
) -> SkillState:
    progress = progress_by_skill.get(skill.id)
    if progress is not None and progress.is_completed:
        return SkillState.COMPLETED

    prerequisites_complete = all(
        prerequisite.id in progress_by_skill
        and progress_by_skill[prerequisite.id].is_completed
        for prerequisite in skill.prerequisites
    )
    explicitly_unlocked = progress is not None and progress.is_unlocked
    if explicitly_unlocked or (not skill.prerequisites) or prerequisites_complete:
        return SkillState.AVAILABLE

    return SkillState.LOCKED


def _next_lesson_id(
    lessons: list[Lesson],
    completed_lesson_ids: set[int],
    state: SkillState,
) -> int | None:
    if state == SkillState.LOCKED or not lessons:
        return None

    for lesson in lessons:
        if lesson.id not in completed_lesson_ids:
            return lesson.id

    return lessons[0].id


def get_learning_path(session: Session, learner: User) -> LearningPathResponse:
    course = get_active_course(session)
    if course is None:
        raise CourseUnavailableError

    progress_by_skill = get_skill_progress(session, learner.id)
    completed_lesson_ids = get_completed_lesson_ids(session, learner.id)
    units: list[UnitNode] = []

    for unit in course.units:
        skill_nodes: list[SkillNode] = []
        for skill in unit.skills:
            progress = progress_by_skill.get(skill.id)
            state = _skill_state(skill, progress_by_skill)
            lessons = [
                LessonNode(
                    id=lesson.id,
                    title=lesson.title,
                    position=lesson.position,
                    is_completed=lesson.id in completed_lesson_ids,
                )
                for lesson in skill.lessons
            ]
            skill_nodes.append(
                SkillNode(
                    id=skill.id,
                    title=skill.title,
                    description=skill.description,
                    icon=skill.icon,
                    position=skill.position,
                    state=state,
                    lessons_completed=progress.lessons_completed if progress else 0,
                    lesson_count=len(skill.lessons),
                    crowns=progress.crowns if progress else 0,
                    next_lesson_id=_next_lesson_id(
                        skill.lessons,
                        completed_lesson_ids,
                        state,
                    ),
                    prerequisite_ids=[
                        prerequisite.id for prerequisite in skill.prerequisites
                    ],
                    lessons=lessons,
                )
            )
        units.append(
            UnitNode(
                id=unit.id,
                title=unit.title,
                description=unit.description,
                position=unit.position,
                skills=skill_nodes,
            )
        )

    return LearningPathResponse(
        course=CourseSummary.model_validate(course),
        learner=get_learner_stats(session, learner),
        units=units,
    )


def get_lesson_for_learner(
    session: Session,
    learner: User,
    lesson_id: int,
) -> LessonResponse:
    lesson = get_lesson_with_content(session, lesson_id)
    if lesson is None:
        raise LessonNotFoundError

    progress_by_skill = get_skill_progress(session, learner.id)
    if _skill_state(lesson.skill, progress_by_skill) == SkillState.LOCKED:
        raise LessonLockedError

    exercises = [
        ExerciseResponse(
            id=exercise.id,
            exercise_type=exercise.exercise_type,
            instruction=exercise.instruction,
            prompt=exercise.prompt,
            position=exercise.position,
            options=[
                ExerciseOptionResponse(
                    id=option.id,
                    text=option.text,
                    value=option.value,
                    position=option.position,
                    match_side=option.match_side,
                )
                for option in exercise.options
            ],
        )
        for exercise in lesson.exercises
    ]
    return LessonResponse(
        id=lesson.id,
        skill_id=lesson.skill_id,
        skill_title=lesson.skill.title,
        title=lesson.title,
        position=lesson.position,
        xp_reward=lesson.xp_reward,
        exercise_count=len(exercises),
        exercises=exercises,
    )
