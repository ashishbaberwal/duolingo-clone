import { PipMascot } from "@/components/brand/pip-mascot";
import styles from "../app-shell.module.css";

export function CoachCard() {
  return (
    <section className={`${styles.sideCard} ${styles.coachCard}`}>
      <PipMascot className={styles.coachMascot} />
      <div>
        <span className={styles.cardEyebrow}>PIP SAYS</span>
        <h2>One lesson is enough to keep momentum alive.</h2>
      </div>
    </section>
  );
}
