import type { ReactNode } from "react";
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
          {children}
          <p className={styles.assignmentLabel}>
            SCALER AI INTERNSHIP · FULL-STACK ASSIGNMENT
          </p>
        </section>
      </div>
    </main>
  );
}
