import { RefreshCw } from "lucide-react";
import styles from "./data-state.module.css";

interface DataLoadingProps {
  label: string;
}

export function DataLoading({ label }: DataLoadingProps) {
  return (
    <main className={styles.screen} aria-label={label}>
      <div className={styles.loadingCard}>
        <span />
        <span />
        <span />
        <strong>{label}</strong>
      </div>
    </main>
  );
}

interface DataErrorProps {
  message: string;
  onRetry: () => void;
}

export function DataError({ message, onRetry }: DataErrorProps) {
  return (
    <main className={styles.screen}>
      <section className={styles.errorCard}>
        <span>TRAIL DETOUR</span>
        <h1>That page did not load.</h1>
        <p>{message}</p>
        <button type="button" onClick={onRetry}>
          <RefreshCw aria-hidden="true" />
          Try again
        </button>
      </section>
    </main>
  );
}
