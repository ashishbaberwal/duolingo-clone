import styles from "../styles/auth.module.css";

export function SessionLoading() {
  return (
    <main className={styles.sessionScreen} aria-label="Checking your session">
      <div className={styles.sessionPulse}>
        <span />
        <span />
      </div>
      <strong>Finding your place on the trail…</strong>
    </main>
  );
}
