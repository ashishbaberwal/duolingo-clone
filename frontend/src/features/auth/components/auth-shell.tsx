import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { LoginBrandPanel } from "./login-brand-panel";
import styles from "../styles/auth.module.css";

interface AuthShellProps {
  children: ReactNode;
}

export function AuthShell({ children }: AuthShellProps) {
  return (
    <main className={styles.authPage}>
      <div className={styles.authFrame}>
        <LoginBrandPanel />
        <section className={styles.formPanel}>
          <ThemeToggle className={styles.authThemeToggle} />
          {children}
          <p className={styles.assignmentLabel}>
            SCALER AI INTERNSHIP · FULL-STACK ASSIGNMENT
          </p>
        </section>
      </div>
    </main>
  );
}
