import { Check, Flame, Sparkles } from "lucide-react";
import { PipMascot } from "@/components/brand/pip-mascot";
import styles from "../styles/auth.module.css";

const BENEFITS = [
  "Your course path waits for you",
  "Progress stays tied to your learner",
  "One lesson keeps the streak alive",
] as const;

export function LoginBrandPanel() {
  return (
    <section className={styles.brandPanel} aria-label="Welcome to LingoTrail">
      <div className={styles.brandWordmark}>
        <span className={styles.brandMark} aria-hidden="true">
          <span />
          <span />
        </span>
        <span>lingotrail</span>
      </div>

      <div className={styles.brandMessage}>
        <span className={styles.eyebrow}>
          <Sparkles aria-hidden="true" />
          YOUR NEXT STEP IS READY
        </span>
        <h1>Come back to your trail.</h1>
        <p>
          Tiny lessons, visible progress, and a cheerful coach who remembers
          where you stopped.
        </p>
        <ul>
          {BENEFITS.map((benefit) => (
            <li key={benefit}>
              <span>
                <Check aria-hidden="true" />
              </span>
              {benefit}
            </li>
          ))}
        </ul>
      </div>

      <div className={styles.mascotScene} aria-hidden="true">
        <div className={styles.streakBubble}>
          <Flame fill="currentColor" />
          <strong>1</strong>
          <span>day streak</span>
        </div>
        <div className={styles.mascotGlow} />
        <PipMascot className={styles.loginMascot} />
        <div className={styles.trailDots}>
          {Array.from({ length: 8 }, (_, index) => (
            <span key={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
