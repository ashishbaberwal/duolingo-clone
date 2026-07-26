from pydantic import Field, model_validator

from app.models.enums import AttemptStatus
from app.schemas.common import ApiModel, LearnerStats


class MatchPairSubmission(ApiModel):
    left_option_id: int = Field(gt=0)
    right_option_id: int = Field(gt=0)


class SubmittedAnswer(ApiModel):
    value: str | None = Field(default=None, max_length=255)
    text: str | None = Field(default=None, max_length=500)
    tokens: list[str] | None = Field(default=None, max_length=30)
    pairs: list[MatchPairSubmission] | None = Field(default=None, max_length=20)

    @model_validator(mode="after")
    def require_one_answer_shape(self) -> "SubmittedAnswer":
        provided = sum(
            answer is not None
            for answer in (self.value, self.text, self.tokens, self.pairs)
        )
        if provided != 1:
            raise ValueError(
                "Provide exactly one of value, text, tokens, or pairs."
            )
        return self


class AnswerSubmissionRequest(ApiModel):
    exercise_id: int = Field(gt=0)
    answer: SubmittedAnswer


class LessonAttemptResponse(ApiModel):
    id: int
    lesson_id: int
    status: AttemptStatus
    hearts_remaining: int
    answered_count: int
    exercise_count: int
    current_exercise_id: int | None


class AnswerFeedbackResponse(ApiModel):
    attempt_id: int
    exercise_id: int
    is_correct: bool
    feedback: str
    correct_answer: str | None
    explanation: str | None
    status: AttemptStatus
    hearts_remaining: int
    answered_count: int
    exercise_count: int
    next_exercise_id: int | None
    xp_earned: int
    learner: LearnerStats


class HeartsRefillResponse(ApiModel):
    message: str
    learner: LearnerStats
