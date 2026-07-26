from fastapi import APIRouter, HTTPException, status

from app.api.dependencies import LearnerDependency, SessionDependency
from app.schemas.lesson import LessonResponse
from app.schemas.path import LearningPathResponse
from app.services.learning import (
    CourseUnavailableError,
    LessonLockedError,
    LessonNotFoundError,
    get_learning_path,
    get_lesson_for_learner,
)

router = APIRouter()


@router.get("/path", response_model=LearningPathResponse)
def learning_path(
    session: SessionDependency,
    learner: LearnerDependency,
) -> LearningPathResponse:
    try:
        return get_learning_path(session, learner)
    except CourseUnavailableError as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="No active course is available.",
        ) from error


@router.get("/lessons/{lesson_id}", response_model=LessonResponse)
def lesson_detail(
    lesson_id: int,
    session: SessionDependency,
    learner: LearnerDependency,
) -> LessonResponse:
    try:
        return get_lesson_for_learner(session, learner, lesson_id)
    except LessonNotFoundError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lesson not found.",
        ) from error
    except LessonLockedError as error:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Complete the prerequisite skills to unlock this lesson.",
        ) from error
