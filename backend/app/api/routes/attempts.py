from fastapi import APIRouter, HTTPException, status

from app.api.dependencies import LearnerDependency, SessionDependency
from app.schemas.attempt import (
    AnswerFeedbackResponse,
    AnswerSubmissionRequest,
    HeartsRefillResponse,
    LessonAttemptResponse,
)
from app.services.answer_evaluation import InvalidAnswerError
from app.services.learning import LessonLockedError, LessonNotFoundError
from app.services.lesson_attempts import (
    AttemptClosedError,
    AttemptNotFoundError,
    ExerciseOrderError,
    OutOfHeartsError,
    refill_hearts,
    start_or_resume_attempt,
    submit_answer,
)

router = APIRouter()


@router.post(
    "/lessons/{lesson_id}/attempts",
    response_model=LessonAttemptResponse,
)
def start_lesson_attempt(
    lesson_id: int,
    session: SessionDependency,
    learner: LearnerDependency,
) -> LessonAttemptResponse:
    try:
        return start_or_resume_attempt(session, learner, lesson_id)
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
    except OutOfHeartsError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Refill your hearts before starting another lesson.",
        ) from error


@router.post(
    "/attempts/{attempt_id}/answers",
    response_model=AnswerFeedbackResponse,
)
def answer_exercise(
    attempt_id: int,
    payload: AnswerSubmissionRequest,
    session: SessionDependency,
    learner: LearnerDependency,
) -> AnswerFeedbackResponse:
    try:
        return submit_answer(
            session,
            learner,
            attempt_id,
            payload.exercise_id,
            payload.answer,
        )
    except AttemptNotFoundError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lesson attempt not found.",
        ) from error
    except AttemptClosedError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This lesson attempt is already closed.",
        ) from error
    except ExerciseOrderError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Answer the current exercise before continuing.",
        ) from error
    except InvalidAnswerError as error:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="The submitted answer is invalid for this exercise.",
        ) from error


@router.post("/hearts/refill", response_model=HeartsRefillResponse)
def refill_learner_hearts(
    session: SessionDependency,
    learner: LearnerDependency,
) -> HeartsRefillResponse:
    return refill_hearts(session, learner)
