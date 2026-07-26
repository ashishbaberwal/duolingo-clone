import styles from "../../../styles/app-shell.module.css";
import { PipMascot } from "../../pip-mascot";

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
