import { MessageCircleMore } from "lucide-react";
import { motion } from "motion/react";
import type {
  LessonExercise,
  SubmittedAnswer,
} from "../lesson.types";
import styles from "../styles/lesson-shell.module.css";
import { MatchPairsExercise } from "./exercises/match-pairs-exercise";
import { MultipleChoiceExercise } from "./exercises/multiple-choice-exercise";
import { TextAnswerExercise } from "./exercises/text-answer-exercise";
import { WordBankExercise } from "./exercises/word-bank-exercise";

interface ExerciseStageProps {
  exercise: LessonExercise;
  disabled: boolean;
  onChange: (answer: SubmittedAnswer | null) => void;
}

export function ExerciseStage({
  exercise,
  disabled,
  onChange,
}: ExerciseStageProps) {
  return (
    <motion.section
      className={styles.exerciseStage}
      key={exercise.id}
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 26 }}
    >
      <div className={styles.exerciseCopy}>
        <span>{exercise.instruction}</span>
        <h1>{exercise.prompt}</h1>
      </div>

      {exercise.exercise_type === "multiple_choice" ? (
        <MultipleChoiceExercise
          disabled={disabled}
          exercise={exercise}
          onChange={onChange}
        />
      ) : null}
      {exercise.exercise_type === "word_bank" ? (
        <WordBankExercise
          disabled={disabled}
          exercise={exercise}
          onChange={onChange}
        />
      ) : null}
      {exercise.exercise_type === "match_pairs" ? (
        <MatchPairsExercise
          disabled={disabled}
          exercise={exercise}
          onChange={onChange}
        />
      ) : null}
      {exercise.exercise_type === "fill_blank" ||
      exercise.exercise_type === "type_answer" ? (
        <TextAnswerExercise
          disabled={disabled}
          exercise={exercise}
          onChange={onChange}
        />
      ) : null}

      <div className={styles.coachNote}>
        <MessageCircleMore aria-hidden="true" />
        <span>Take your time. Every answer moves the trail forward.</span>
      </div>
    </motion.section>
  );
}
