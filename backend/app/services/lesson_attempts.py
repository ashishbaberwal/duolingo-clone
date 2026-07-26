from datetime import UTC, datetime

from sqlalchemy.orm import Session

from app.models import (
    AttemptAnswer,
    Exercise,
    LessonAttempt,
    User,
)
from app.models.enums import AttemptStatus, ExerciseType
from app.repositories.attempts import (
    get_active_attempt,
    get_attempt_for_user,
)
from app.schemas.attempt import (
    AnswerFeedbackResponse,
    HeartsRefillResponse,
    LessonAttemptResponse,
    SubmittedAnswer,
)
from app.services.answer_evaluation import evaluate_answer
from app.services.learning import get_accessible_lesson
from app.services.lesson_progression import complete_attempt
from app.services.stats import (
    current_date_for_learner,
    get_learner_stats,
)


class AttemptNotFoundError(Exception):
    """Raised when an attempt does not belong to the authenticated learner."""


class AttemptClosedError(Exception):
    """Raised when an answer is submitted to a completed or failed attempt."""


class ExerciseOrderError(Exception):
    """Raised when an exercise is skipped or answered more than once."""


class OutOfHeartsError(Exception):
    """Raised when the learner cannot begin a lesson without hearts."""


def _current_exercise(attempt: LessonAttempt) -> Exercise | None:
    answered_ids = {answer.exercise_id for answer in attempt.answers}
    return next(
        (
            exercise
            for exercise in attempt.lesson.exercises
            if exercise.id not in answered_ids
        ),
        None,
    )


def _to_attempt_response(attempt: LessonAttempt) -> LessonAttemptResponse:
    current_exercise = _current_exercise(attempt)
    return LessonAttemptResponse(
        id=attempt.id,
        lesson_id=attempt.lesson_id,
        status=attempt.status,
        hearts_remaining=attempt.hearts_remaining,
        answered_count=len(attempt.answers),
        exercise_count=len(attempt.lesson.exercises),
        current_exercise_id=(
            current_exercise.id if current_exercise is not None else None
        ),
    )


def start_or_resume_attempt(
    session: Session,
    learner: User,
    lesson_id: int,
) -> LessonAttemptResponse:
    lesson = get_accessible_lesson(session, learner, lesson_id)
    active_attempt = get_active_attempt(
        session,
        user_id=learner.id,
        lesson_id=lesson.id,
    )
    if active_attempt is not None:
        return _to_attempt_response(active_attempt)

    if learner.hearts <= 0:
        raise OutOfHeartsError

    attempt = LessonAttempt(
        user=learner,
        lesson=lesson,
        status=AttemptStatus.IN_PROGRESS,
        hearts_at_start=learner.hearts,
        hearts_remaining=learner.hearts,
        correct_count=0,
        wrong_count=0,
        xp_earned=0,
        started_at=datetime.now(UTC),
        completed_at=None,
    )
    session.add(attempt)
    session.commit()
    return _to_attempt_response(attempt)


def submit_answer(
    session: Session,
    learner: User,
    attempt_id: int,
    exercise_id: int,
    submitted_answer: SubmittedAnswer,
) -> AnswerFeedbackResponse:
    attempt = get_attempt_for_user(
        session,
        attempt_id=attempt_id,
        user_id=learner.id,
    )
    if attempt is None:
        raise AttemptNotFoundError
    if attempt.status != AttemptStatus.IN_PROGRESS:
        raise AttemptClosedError

    exercise = _current_exercise(attempt)
    if exercise is None or exercise.id != exercise_id:
        raise ExerciseOrderError

    is_correct = evaluate_answer(exercise, submitted_answer)
    answer = AttemptAnswer(
        attempt=attempt,
        exercise=exercise,
        submitted_answer=submitted_answer.model_dump(
            mode="json",
            exclude_none=True,
        ),
        is_correct=is_correct,
        feedback="Excellent!" if is_correct else "Not quite.",
    )
    session.add(answer)

    if is_correct:
        attempt.correct_count += 1
    else:
        attempt.wrong_count += 1
        learner.hearts = max(learner.hearts - 1, 0)
        attempt.hearts_remaining = learner.hearts

    answered_count = len(attempt.answers)
    completed_at = datetime.now(UTC)
    if not is_correct and learner.hearts == 0:
        attempt.status = AttemptStatus.FAILED
        attempt.completed_at = completed_at
    elif answered_count == len(attempt.lesson.exercises):
        complete_attempt(
            session,
            learner,
            attempt,
            completed_at=completed_at,
            activity_date=current_date_for_learner(learner),
        )

    session.commit()
    next_exercise = _current_exercise(attempt)
    return AnswerFeedbackResponse(
        attempt_id=attempt.id,
        exercise_id=exercise.id,
        is_correct=is_correct,
        feedback=answer.feedback or "",
        correct_answer=(
            None
            if is_correct or exercise.exercise_type == ExerciseType.MATCH_PAIRS
            else exercise.correct_answer
        ),
        explanation=exercise.explanation,
        status=attempt.status,
        hearts_remaining=attempt.hearts_remaining,
        answered_count=answered_count,
        exercise_count=len(attempt.lesson.exercises),
        next_exercise_id=(
            next_exercise.id
            if attempt.status == AttemptStatus.IN_PROGRESS
            and next_exercise is not None
            else None
        ),
        xp_earned=attempt.xp_earned,
        learner=get_learner_stats(session, learner),
    )


def refill_hearts(session: Session, learner: User) -> HeartsRefillResponse:
    learner.hearts = learner.max_hearts
    session.commit()
    return HeartsRefillResponse(
        message="Hearts refilled. You are ready to learn!",
        learner=get_learner_stats(session, learner),
    )
