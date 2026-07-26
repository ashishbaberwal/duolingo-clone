import { Heart, Home, RotateCcw } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import styles from "../styles/outcomes.module.css";

interface OutOfHeartsProps {
  isRefilling: boolean;
  message?: string;
  onRefill: () => void;
}

export function OutOfHearts({
  isRefilling,
  message,
  onRefill,
}: OutOfHeartsProps) {
  return (
    <main className={styles.outcomeScreen}>
      <motion.section
        className={styles.heartsCard}
        initial={{ opacity: 0, y: 24, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
      >
        <div className={styles.brokenHeart}>
          <Heart aria-hidden="true" fill="currentColor" />
          <span>0</span>
        </div>
        <span className={styles.eyebrow}>PAUSE. REFILL. RETURN.</span>
        <h1>You&apos;re out of hearts</h1>
        <p>
          {message ??
            "Mistakes are part of learning. Refill your hearts and try this lesson again."}
        </p>
        <button disabled={isRefilling} onClick={onRefill} type="button">
          <RotateCcw aria-hidden="true" />
          {isRefilling ? "Refilling…" : "Refill hearts and retry"}
        </button>
        <Link href="/">
          <Home aria-hidden="true" />
          Return to learning path
        </Link>
      </motion.section>
    </main>
  );
}
