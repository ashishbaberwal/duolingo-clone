import { motion } from "motion/react";
import { Clock3, X } from "lucide-react";
import styles from "./app-shell.module.css";

interface ComingSoonToastProps {
  feature: string;
  onDismiss: () => void;
}

export function ComingSoonToast({
  feature,
  onDismiss,
}: ComingSoonToastProps) {
  return (
    <motion.aside
      className={styles.comingSoonToast}
      role="status"
      aria-live="polite"
      initial={{ opacity: 0, y: 18, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 12, scale: 0.97 }}
    >
      <span className={styles.toastIcon}>
        <Clock3 aria-hidden="true" />
      </span>
      <div>
        <strong>{feature} is coming soon.</strong>
        <p>We&apos;re still building this part of the trail.</p>
      </div>
      <button type="button" onClick={onDismiss} aria-label="Dismiss notification">
        <X aria-hidden="true" />
      </button>
    </motion.aside>
  );
}
