import type {
  LessonExercise,
  SubmittedAnswer,
} from "../../lesson.types";
import styles from "../../styles/exercises.module.css";

interface TextAnswerExerciseProps {
  exercise: LessonExercise;
  disabled: boolean;
  onChange: (answer: SubmittedAnswer | null) => void;
}

export function TextAnswerExercise({
  exercise,
  disabled,
  onChange,
}: TextAnswerExerciseProps) {
  const isFillBlank = exercise.exercise_type === "fill_blank";

  return (
    <div className={styles.textAnswer}>
      {isFillBlank ? (
        <div className={styles.blankPrompt}>{exercise.prompt}</div>
      ) : null}
      <label>
        <span>{isFillBlank ? "Missing word" : "Your Spanish answer"}</span>
        <input
          autoComplete="off"
          disabled={disabled}
          maxLength={500}
          onChange={(event) => {
            const value = event.target.value;
            onChange(value.trim() ? { text: value } : null);
          }}
          placeholder={isFillBlank ? "Type the missing word" : "Type in Spanish"}
          spellCheck={false}
        />
      </label>
      <p>Capitalization and punctuation won&apos;t count against you.</p>
    </div>
  );
}
