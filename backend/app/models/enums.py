from enum import StrEnum


class ExerciseType(StrEnum):
    MULTIPLE_CHOICE = "multiple_choice"
    WORD_BANK = "word_bank"
    MATCH_PAIRS = "match_pairs"
    FILL_BLANK = "fill_blank"
    TYPE_ANSWER = "type_answer"


class MatchSide(StrEnum):
    LEFT = "left"
    RIGHT = "right"


class AttemptStatus(StrEnum):
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    ABANDONED = "abandoned"
