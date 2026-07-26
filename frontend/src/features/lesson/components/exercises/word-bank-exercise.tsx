import { RotateCcw } from "lucide-react";
import { useState } from "react";
import type {
  LessonExercise,
  SubmittedAnswer,
} from "../../lesson.types";
import styles from "../../styles/exercises.module.css";

interface WordBankExerciseProps {
  exercise: LessonExercise;
  disabled: boolean;
  onChange: (answer: SubmittedAnswer | null) => void;
}

export function WordBankExercise({
  exercise,
  disabled,
  onChange,
}: WordBankExerciseProps) {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  function update(nextIds: number[]) {
    setSelectedIds(nextIds);
    const tokens = nextIds.map(
      (optionId) =>
        exercise.options.find((option) => option.id === optionId)?.value ?? "",
    );
    onChange(tokens.length > 0 ? { tokens } : null);
  }

  function addToken(optionId: number) {
    if (disabled || selectedIds.includes(optionId)) {
      return;
    }
    update([...selectedIds, optionId]);
  }

  function removeToken(optionId: number) {
    if (disabled) {
      return;
    }
    update(selectedIds.filter((selectedId) => selectedId !== optionId));
  }

  return (
    <div className={styles.wordBank}>
      <div className={styles.sentenceBuilder} aria-label="Your sentence">
        {selectedIds.length === 0 ? (
          <span className={styles.sentenceHint}>Tap words to build your answer</span>
        ) : (
          selectedIds.map((optionId) => {
            const option = exercise.options.find(
              (candidate) => candidate.id === optionId,
            );
            return option ? (
              <button
                disabled={disabled}
                key={option.id}
                onClick={() => removeToken(option.id)}
                type="button"
              >
                {option.text}
              </button>
            ) : null;
          })
        )}
      </div>
      <div className={styles.tokenTray}>
        {exercise.options.map((option) => (
          <button
            disabled={disabled || selectedIds.includes(option.id)}
            key={option.id}
            onClick={() => addToken(option.id)}
            type="button"
          >
            {option.text}
          </button>
        ))}
      </div>
      <button
        className={styles.resetAnswer}
        disabled={disabled || selectedIds.length === 0}
        onClick={() => update([])}
        type="button"
      >
        <RotateCcw aria-hidden="true" />
        Reset words
      </button>
    </div>
  );
}
