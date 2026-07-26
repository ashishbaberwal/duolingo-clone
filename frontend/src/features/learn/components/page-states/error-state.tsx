import { RefreshCw, WifiOff } from "lucide-react";
import { motion } from "motion/react";
import styles from "../../styles/learn-page.module.css";
import { PipMascot } from "../pip-mascot";

interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <main className={styles.errorScreen}>
      <motion.div
        className={styles.errorCard}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className={styles.errorMascotWrap}>
          <PipMascot className={styles.errorMascot} mood="focused" />
          <WifiOff aria-hidden="true" />
        </div>
        <span>TRAIL PAUSED</span>
        <h1>We couldn&apos;t load your course.</h1>
        <p>{message}</p>
        <button type="button" onClick={onRetry}>
          <RefreshCw aria-hidden="true" />
          Try again
        </button>
      </motion.div>
    </main>
  );
}
