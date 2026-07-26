import { CheckCircle2, XCircle } from "lucide-react";
import type { AnswerFeedback } from "../lesson.types";
import styles from "../styles/lesson-shell.module.css";

interface LessonActionBarProps {
  canSubmit: boolean;
  feedback: AnswerFeedback | null;
  isSubmitting: boolean;
  onContinue: () => void;
  onSubmit: () => void;
}

export function LessonActionBar({
  canSubmit,
  feedback,
  isSubmitting,
  onContinue,
  onSubmit,
}: LessonActionBarProps) {
  if (feedback === null) {
    return (
      <footer className={styles.actionBar}>
        <div className={styles.actionBarInner}>
          <span className={styles.keyboardHint}>Select an answer to continue</span>
          <button
            className={styles.checkButton}
            disabled={!canSubmit || isSubmitting}
            onClick={onSubmit}
            type="button"
          >
            {isSubmitting ? "Checking…" : "Check"}
          </button>
        </div>
      </footer>
    );
  }

  const isComplete = feedback.status === "completed";
  const isFailed = feedback.status === "failed";
  return (
    <footer
      className={`${styles.feedbackBar} ${
        feedback.is_correct ? styles.feedbackCorrect : styles.feedbackWrong
      }`}
      aria-live="polite"
    >
      <div className={styles.feedbackInner}>
        <div className={styles.feedbackIcon}>
          {feedback.is_correct ? (
            <CheckCircle2 aria-hidden="true" />
          ) : (
            <XCircle aria-hidden="true" />
          )}
        </div>
        <div className={styles.feedbackCopy}>
          <strong>{feedback.feedback}</strong>
          {feedback.correct_answer ? (
            <span>Correct answer: {feedback.correct_answer}</span>
          ) : null}
          {feedback.explanation ? <p>{feedback.explanation}</p> : null}
        </div>
        <button onClick={onContinue} type="button">
          {isComplete
            ? "View results"
            : isFailed
              ? "See options"
              : "Continue"}
        </button>
      </div>
    </footer>
  );
}
