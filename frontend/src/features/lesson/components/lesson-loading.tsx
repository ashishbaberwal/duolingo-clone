import styles from "../styles/lesson-shell.module.css";

export function LessonLoading() {
  return (
    <main className={styles.lessonState} aria-label="Loading lesson">
      <div className={styles.loadingTrail}>
        <span />
        <span />
        <span />
      </div>
      <strong>Preparing your lesson…</strong>
      <p>Gathering five quick challenges for your next trail step.</p>
    </main>
  );
}
