"use client";

import { Eye, EyeOff, LockKeyhole, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ApiError } from "@/lib/api/client";
import { DEMO_CREDENTIALS } from "../auth.constants";
import { useLogin } from "../auth.queries";
import styles from "../styles/auth.module.css";

export function LoginForm() {
  const router = useRouter();
  const login = useLogin();
  const [username, setUsername] = useState<string>(DEMO_CREDENTIALS.username);
  const [password, setPassword] = useState<string>(DEMO_CREDENTIALS.password);
  const [showPassword, setShowPassword] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    login.mutate(
      { username, password },
      {
        onSuccess: () => {
          router.replace("/");
          router.refresh();
        },
      },
    );
  }

  const errorMessage =
    login.error instanceof ApiError
      ? login.error.message
      : login.isError
        ? "We couldn't sign you in. Please try again."
        : null;

  return (
    <form className={styles.loginForm} onSubmit={handleSubmit}>
      <div className={styles.formHeading}>
        <span>LOCAL LEARNER ACCESS</span>
        <h2>Welcome back</h2>
        <p>Sign in to continue Ava&apos;s Spanish course.</p>
      </div>

      <label className={styles.field}>
        <span>Username</span>
        <div className={styles.inputWrap}>
          <UserRound aria-hidden="true" />
          <input
            autoComplete="username"
            maxLength={50}
            name="username"
            onChange={(event) => setUsername(event.target.value)}
            required
            value={username}
          />
        </div>
      </label>

      <label className={styles.field}>
        <span>Password</span>
        <div className={styles.inputWrap}>
          <LockKeyhole aria-hidden="true" />
          <input
            autoComplete="current-password"
            maxLength={128}
            name="password"
            onChange={(event) => setPassword(event.target.value)}
            required
            type={showPassword ? "text" : "password"}
            value={password}
          />
          <button
            className={styles.passwordToggle}
            type="button"
            onClick={() => setShowPassword((visible) => !visible)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
          </button>
        </div>
      </label>

      <div className={styles.demoCredentials}>
        <span>DEMO CREDENTIALS</span>
        <code>{DEMO_CREDENTIALS.username}</code>
        <span className={styles.credentialDivider}>/</span>
        <code>{DEMO_CREDENTIALS.password}</code>
      </div>

      <div className={styles.formFeedback} aria-live="polite">
        {errorMessage}
      </div>

      <button
        className={styles.submitButton}
        type="submit"
        disabled={login.isPending}
      >
        {login.isPending ? <span className={styles.spinner} /> : null}
        {login.isPending ? "Opening your trail…" : "Continue learning"}
      </button>

      <p className={styles.localNote}>
        Local assignment account · Password is stored as an Argon2 hash
      </p>
    </form>
  );
}
