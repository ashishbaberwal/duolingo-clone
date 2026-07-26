import { ArrowLeft, RefreshCw } from "lucide-react";
import Link from "next/link";
import styles from "../styles/lesson-shell.module.css";

interface LessonErrorProps {
  message: string;
  onRetry: () => void;
}

export function LessonError({ message, onRetry }: LessonErrorProps) {
  return (
    <main className={styles.lessonState}>
      <div className={styles.errorMark}>!</div>
      <h1>This trail step needs another try.</h1>
      <p>{message}</p>
      <div className={styles.errorActions}>
        <button onClick={onRetry} type="button">
          <RefreshCw aria-hidden="true" />
          Try again
        </button>
        <Link href="/">
          <ArrowLeft aria-hidden="true" />
          Back to path
        </Link>
      </div>
    </main>
  );
}
