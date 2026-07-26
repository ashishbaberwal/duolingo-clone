import { Heart, X } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import styles from "../styles/lesson-shell.module.css";

interface LessonHeaderProps {
  answeredCount: number;
  exerciseCount: number;
  hearts: number;
}

export function LessonHeader({
  answeredCount,
  exerciseCount,
  hearts,
}: LessonHeaderProps) {
  const progress =
    exerciseCount === 0 ? 0 : (answeredCount / exerciseCount) * 100;

  return (
    <header className={styles.lessonHeader}>
      <Link href="/" aria-label="Leave lesson" className={styles.leaveLesson}>
        <X aria-hidden="true" />
      </Link>
      <div
        className={styles.progressTrack}
        role="progressbar"
        aria-label="Lesson progress"
        aria-valuemin={0}
        aria-valuemax={exerciseCount}
        aria-valuenow={answeredCount}
      >
        <span style={{ width: `${progress}%` }} />
      </div>
      <div className={styles.hearts} aria-label={`${hearts} hearts remaining`}>
        <Heart aria-hidden="true" fill="currentColor" />
        <strong>{hearts}</strong>
      </div>
      <ThemeToggle className={styles.lessonThemeToggle} />
    </header>
  );
}
