import { RotateCcw } from "lucide-react";
import { useState } from "react";
import type {
  LessonExercise,
  MatchPairSubmission,
  SubmittedAnswer,
} from "../../lesson.types";
import styles from "../../styles/exercises.module.css";

interface MatchPairsExerciseProps {
  exercise: LessonExercise;
  disabled: boolean;
  onChange: (answer: SubmittedAnswer | null) => void;
}

export function MatchPairsExercise({
  exercise,
  disabled,
  onChange,
}: MatchPairsExerciseProps) {
  const leftOptions = exercise.options.filter(
    (option) => option.match_side === "left",
  );
  const rightOptions = exercise.options.filter(
    (option) => option.match_side === "right",
  );
  const [selectedLeftId, setSelectedLeftId] = useState<number | null>(null);
  const [pairs, setPairs] = useState<MatchPairSubmission[]>([]);
  const pairedIds = new Set(
    pairs.flatMap((pair) => [pair.left_option_id, pair.right_option_id]),
  );

  function chooseLeft(optionId: number) {
    if (!disabled && !pairedIds.has(optionId)) {
      setSelectedLeftId(optionId);
    }
  }

  function chooseRight(optionId: number) {
    if (
      disabled ||
      selectedLeftId === null ||
      pairedIds.has(optionId)
    ) {
      return;
    }
    const nextPairs = [
      ...pairs,
      {
        left_option_id: selectedLeftId,
        right_option_id: optionId,
      },
    ];
    setPairs(nextPairs);
    setSelectedLeftId(null);
    onChange(
      nextPairs.length === leftOptions.length ? { pairs: nextPairs } : null,
    );
  }

  function resetPairs() {
    setPairs([]);
    setSelectedLeftId(null);
    onChange(null);
  }

  return (
    <div className={styles.matchArea}>
      <p className={styles.matchHint}>
        Pick an English word, then its Spanish match.
      </p>
      <div className={styles.matchGrid}>
        <div>
          {leftOptions.map((option) => (
            <button
              className={
                option.id === selectedLeftId
                  ? styles.matchSelected
                  : pairedIds.has(option.id)
                    ? styles.matchPaired
                    : ""
              }
              disabled={disabled || pairedIds.has(option.id)}
              key={option.id}
              onClick={() => chooseLeft(option.id)}
              type="button"
              aria-pressed={option.id === selectedLeftId}
            >
              {option.text}
            </button>
          ))}
        </div>
        <div>
          {rightOptions.map((option) => (
            <button
              className={
                pairedIds.has(option.id) ? styles.matchPaired : ""
              }
              disabled={disabled || pairedIds.has(option.id)}
              key={option.id}
              onClick={() => chooseRight(option.id)}
              type="button"
            >
              {option.text}
            </button>
          ))}
        </div>
      </div>
      <button
        className={styles.resetAnswer}
        disabled={disabled || pairs.length === 0}
        onClick={resetPairs}
        type="button"
      >
        <RotateCcw aria-hidden="true" />
        Reset matches
      </button>
    </div>
  );
}
