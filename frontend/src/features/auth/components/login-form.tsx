"use client";

import { UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ApiError } from "@/lib/api/client";
import { useLogin } from "../auth.queries";
import styles from "../styles/auth.module.css";
import { PasswordField } from "./password-field";

interface LoginFormProps {
  accountCreated?: boolean;
  initialUsername?: string;
}

export function LoginForm({
  accountCreated = false,
  initialUsername = "",
}: LoginFormProps) {
  const router = useRouter();
  const login = useLogin();
  const [username, setUsername] = useState(initialUsername);
  const [password, setPassword] = useState("");

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
    <form className={styles.loginForm} method="post" onSubmit={handleSubmit}>
      <div className={styles.formHeading}>
        <span>YOUR LEARNING ACCOUNT</span>
        <h2>Welcome back</h2>
        <p>Sign in to continue from exactly where you stopped.</p>
      </div>

      {accountCreated ? (
        <div className={styles.successMessage} role="status">
          Account created. Sign in with your new username and password.
        </div>
      ) : null}

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

      <PasswordField
        autoComplete="current-password"
        label="Password"
        name="password"
        onChange={setPassword}
        value={password}
      />

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

      <p className={styles.authSwitch}>
        New to LingoTrail? <Link href="/signup">Create your account</Link>
      </p>
    </form>
  );
}
