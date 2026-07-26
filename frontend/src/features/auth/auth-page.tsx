import { LoginBrandPanel } from "./components/login-brand-panel";
import { LoginForm } from "./components/login-form";
import styles from "./styles/auth.module.css";

export function AuthPage() {
  return (
    <main className={styles.authPage}>
      <div className={styles.authFrame}>
        <LoginBrandPanel />
        <section className={styles.formPanel}>
          <LoginForm />
          <p className={styles.assignmentLabel}>
            SCALER AI INTERNSHIP · FULL-STACK ASSIGNMENT
          </p>
        </section>
      </div>
    </main>
  );
}
