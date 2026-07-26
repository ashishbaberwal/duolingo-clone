import type { LearnerStats } from "@/lib/api/types";

export type ExerciseType =
  | "multiple_choice"
  | "word_bank"
  | "match_pairs"
  | "fill_blank"
  | "type_answer";

export type AttemptStatus =
  | "in_progress"
  | "completed"
  | "failed"
  | "abandoned";

export interface ExerciseOption {
  id: number;
  text: string;
  value: string;
  position: number;
  match_side: "left" | "right" | null;
}

export interface LessonExercise {
  id: number;
  exercise_type: ExerciseType;
  instruction: string;
  prompt: string;
  position: number;
  options: ExerciseOption[];
}

export interface LessonResponse {
  id: number;
  skill_id: number;
  skill_title: string;
  title: string;
  position: number;
  xp_reward: number;
  exercise_count: number;
  exercises: LessonExercise[];
}

export interface MatchPairSubmission {
  left_option_id: number;
  right_option_id: number;
}

export type SubmittedAnswer =
  | { value: string }
  | { text: string }
  | { tokens: string[] }
  | { pairs: MatchPairSubmission[] };

export interface LessonAttempt {
  id: number;
  lesson_id: number;
  status: AttemptStatus;
  hearts_remaining: number;
  answered_count: number;
  exercise_count: number;
  current_exercise_id: number | null;
}

export interface AnswerFeedback {
  attempt_id: number;
  exercise_id: number;
  is_correct: boolean;
  feedback: string;
  correct_answer: string | null;
  explanation: string | null;
  status: AttemptStatus;
  hearts_remaining: number;
  answered_count: number;
  exercise_count: number;
  next_exercise_id: number | null;
  xp_earned: number;
  learner: LearnerStats;
}

export interface HeartsRefillResponse {
  message: string;
  learner: LearnerStats;
}
