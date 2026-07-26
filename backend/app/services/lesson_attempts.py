from collections import Counter
from datetime import UTC, date, datetime
from unicodedata import category, normalize

from sqlalchemy.orm import Session

from app.models import (
    AttemptAnswer,
    DailyActivity,
    Exercise,
    ExerciseOption,
    Lesson,
    LessonAttempt,
    User,
    UserSkillProgress,
)
from app.models.enums import AttemptStatus, ExerciseType, MatchSide
from app.repositories.attempts import (
    get_active_attempt,
    get_attempt_for_user,
    get_daily_activity,
    get_skill_progress_row,
    has_completed_lesson,
)
from app.schemas.attempt import (
    AnswerFeedbackResponse,
    HeartsRefillResponse,
    LessonAttemptResponse,
    SubmittedAnswer,
)
from app.services.learning import get_accessible_lesson
from app.services.stats import (
    current_date_for_learner,
    get_learner_stats,
    record_daily_streak,
)


class AttemptNotFoundError(Exception):
    """Raised when an attempt does not belong to the authenticated learner."""


class AttemptClosedError(Exception):
    """Raised when an answer is submitted to a completed or failed attempt."""


class ExerciseOrderError(Exception):
    """Raised when an exercise is skipped or answered more than once."""


class InvalidAnswerError(Exception):
    """Raised when an answer does not match the exercise's required shape."""


class OutOfHeartsError(Exception):
    """Raised when the learner cannot begin a lesson without hearts."""


def _normalize_answer(value: str) -> str:
    normalized = normalize("NFKC", value).casefold()
    without_punctuation = "".join(
        " " if category(character).startswith("P") else character
        for character in normalized
    )
    return " ".join(without_punctuation.split())


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


def _require_value(answer: SubmittedAnswer) -> str:
    if answer.value is None or not answer.value.strip():
        raise InvalidAnswerError
    return answer.value


def _require_text(answer: SubmittedAnswer) -> str:
    if answer.text is None or not answer.text.strip():
        raise InvalidAnswerError
    return answer.text


def _evaluate_word_bank(
    exercise: Exercise,
    answer: SubmittedAnswer,
) -> bool:
    if answer.tokens is None or not answer.tokens:
        raise InvalidAnswerError

    available_tokens = Counter(option.value for option in exercise.options)
    submitted_tokens = Counter(answer.tokens)
    if submitted_tokens - available_tokens:
        raise InvalidAnswerError

    return _normalize_answer(" ".join(answer.tokens)) == _normalize_answer(
        exercise.correct_answer or ""
    )


def _evaluate_pairs(
    options: list[ExerciseOption],
    answer: SubmittedAnswer,
) -> bool:
    if answer.pairs is None or len(answer.pairs) * 2 != len(options):
        raise InvalidAnswerError

    options_by_id = {option.id: option for option in options}
    submitted_ids = [
        option_id
        for pair in answer.pairs
        for option_id in (pair.left_option_id, pair.right_option_id)
    ]
    if len(set(submitted_ids)) != len(submitted_ids):
        raise InvalidAnswerError
    if set(submitted_ids) != set(options_by_id):
        raise InvalidAnswerError

    is_correct = True
    for pair in answer.pairs:
        left = options_by_id[pair.left_option_id]
        right = options_by_id[pair.right_option_id]
        if left.match_side != MatchSide.LEFT or right.match_side != MatchSide.RIGHT:
            raise InvalidAnswerError
        if left.pair_key != right.pair_key:
            is_correct = False

    return is_correct


def evaluate_answer(exercise: Exercise, answer: SubmittedAnswer) -> bool:
    if exercise.exercise_type == ExerciseType.MULTIPLE_CHOICE:
        return _normalize_answer(_require_value(answer)) == _normalize_answer(
            exercise.correct_answer or ""
        )
    if exercise.exercise_type == ExerciseType.WORD_BANK:
        return _evaluate_word_bank(exercise, answer)
    if exercise.exercise_type == ExerciseType.MATCH_PAIRS:
        return _evaluate_pairs(exercise.options, answer)
    if exercise.exercise_type in {
        ExerciseType.FILL_BLANK,
        ExerciseType.TYPE_ANSWER,
    }:
        return _normalize_answer(_require_text(answer)) == _normalize_answer(
            exercise.correct_answer or ""
        )
    raise InvalidAnswerError


def _update_skill_progress(
    session: Session,
    learner: User,
    lesson: Lesson,
    completed_at: datetime,
) -> None:
    if has_completed_lesson(
        session,
        user_id=learner.id,
        lesson_id=lesson.id,
    ):
        return

    progress = get_skill_progress_row(
        session,
        user_id=learner.id,
        skill_id=lesson.skill_id,
    )
    if progress is None:
        progress = UserSkillProgress(
            user=learner,
            skill=lesson.skill,
            lessons_completed=0,
            crowns=0,
            is_unlocked=True,
            is_completed=False,
            completed_at=None,
        )
        session.add(progress)

    progress.lessons_completed = min(
        progress.lessons_completed + 1,
        len(lesson.skill.lessons),
    )
    if progress.lessons_completed == len(lesson.skill.lessons):
        progress.is_completed = True
        progress.is_unlocked = True
        progress.crowns += 1
        progress.completed_at = completed_at


def _record_lesson_activity(
    session: Session,
    learner: User,
    lesson: Lesson,
    activity_date: date,
) -> None:
    activity = get_daily_activity(
        session,
        user_id=learner.id,
        activity_date=activity_date,
    )
    if activity is None:
        activity = DailyActivity(
            user=learner,
            activity_date=activity_date,
            xp_earned=0,
            lessons_completed=0,
        )
        session.add(activity)

    activity.xp_earned += lesson.xp_reward
    activity.lessons_completed += 1
    learner.total_xp += lesson.xp_reward
    record_daily_streak(learner, activity_date)


def _complete_attempt(
    session: Session,
    learner: User,
    attempt: LessonAttempt,
    *,
    completed_at: datetime,
    activity_date: date,
) -> None:
    _update_skill_progress(session, learner, attempt.lesson, completed_at)
    _record_lesson_activity(
        session,
        learner,
        attempt.lesson,
        activity_date,
    )
    attempt.status = AttemptStatus.COMPLETED
    attempt.xp_earned = attempt.lesson.xp_reward
    attempt.completed_at = completed_at


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
        _complete_attempt(
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
