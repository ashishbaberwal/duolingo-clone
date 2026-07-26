from collections import Counter
from unicodedata import category, normalize

from app.models import Exercise, ExerciseOption
from app.models.enums import ExerciseType, MatchSide
from app.schemas.attempt import SubmittedAnswer


class InvalidAnswerError(Exception):
    """Raised when an answer does not match the exercise's required shape."""


def _normalize_answer(value: str) -> str:
    normalized = normalize("NFKC", value).casefold()
    without_punctuation = "".join(
        " " if category(character).startswith("P") else character
        for character in normalized
    )
    return " ".join(without_punctuation.split())


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
