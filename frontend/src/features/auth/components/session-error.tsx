import { RefreshCw, WifiOff } from "lucide-react";
import styles from "../styles/auth.module.css";

interface SessionErrorProps {
  onRetry: () => void;
}

export function SessionError({ onRetry }: SessionErrorProps) {
  return (
    <main className={styles.sessionScreen}>
      <div className={styles.sessionErrorCard}>
        <WifiOff aria-hidden="true" />
        <h1>We couldn&apos;t verify your session.</h1>
        <p>Check that the API is running, then try once more.</p>
        <button type="button" onClick={onRetry}>
          <RefreshCw aria-hidden="true" />
          Try again
        </button>
      </div>
    </main>
  );
}
