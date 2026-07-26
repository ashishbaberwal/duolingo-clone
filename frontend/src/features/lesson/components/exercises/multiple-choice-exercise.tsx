import { Check } from "lucide-react";
import { useState } from "react";
import type {
  LessonExercise,
  SubmittedAnswer,
} from "../../lesson.types";
import styles from "../../styles/exercises.module.css";

interface MultipleChoiceExerciseProps {
  exercise: LessonExercise;
  disabled: boolean;
  onChange: (answer: SubmittedAnswer | null) => void;
}

export function MultipleChoiceExercise({
  exercise,
  disabled,
  onChange,
}: MultipleChoiceExerciseProps) {
  const [selectedId, setSelectedId] = useState<number | null>(null);

  function selectOption(optionId: number, value: string) {
    if (disabled) {
      return;
    }
    setSelectedId(optionId);
    onChange({ value });
  }

  return (
    <div className={styles.choiceGrid}>
      {exercise.options.map((option, index) => {
        const selected = option.id === selectedId;
        return (
          <button
            className={`${styles.choiceCard} ${
              selected ? styles.choiceSelected : ""
            }`}
            disabled={disabled}
            key={option.id}
            onClick={() => selectOption(option.id, option.value)}
            type="button"
            aria-pressed={selected}
          >
            <span className={styles.choiceKey}>{index + 1}</span>
            <strong>{option.text}</strong>
            {selected ? <Check aria-hidden="true" /> : null}
          </button>
        );
      })}
    </div>
  );
}
