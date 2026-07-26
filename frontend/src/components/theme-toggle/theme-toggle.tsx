"use client";

import { Moon, Sun } from "lucide-react";
import styles from "./theme-toggle.module.css";
import { useTheme } from "./use-theme";

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export function ThemeToggle({
  className = "",
  showLabel = false,
}: ThemeToggleProps) {
  const { toggleTheme } = useTheme();

  return (
    <button
      aria-label="Toggle color theme"
      className={`${styles.toggle} ${className}`}
      onClick={toggleTheme}
      title="Toggle color theme"
      type="button"
    >
      <Sun aria-hidden="true" className={styles.sunIcon} />
      <Moon aria-hidden="true" className={styles.moonIcon} />
      {showLabel ? (
        <span className={styles.label}>
          <span className={styles.lightLabel}>Dark mode</span>
          <span className={styles.darkLabel}>Light mode</span>
        </span>
      ) : null}
    </button>
  );
}
