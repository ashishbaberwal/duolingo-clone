"use client";

import { AtSign, Mail, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ApiError } from "@/lib/api/client";
import { useRegister } from "../auth.queries";
import styles from "../styles/auth.module.css";
import { PasswordField } from "./password-field";
import { TextField } from "./text-field";

const USERNAME_PATTERN = /^[a-z0-9](?:[a-z0-9._-]*[a-z0-9])?$/;

export function SignupForm() {
  const router = useRouter();
  const register = useRegister();
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setValidationError(null);

    if (password !== passwordConfirmation) {
      setValidationError("Passwords do not match.");
      return;
    }

    const hasRequiredStrength =
      /[a-z]/.test(password) && /[A-Z]/.test(password) && /\d/.test(password);
    if (!hasRequiredStrength) {
      setValidationError(
        "Password must include an uppercase letter, a lowercase letter, and a number.",
      );
      return;
    }

    const normalizedUsername = username.trim().toLowerCase();
    if (!USERNAME_PATTERN.test(normalizedUsername)) {
      setValidationError(
        "Username can use letters, numbers, dots, underscores, and hyphens, and must start and end with a letter or number.",
      );
      return;
    }

    register.mutate(
      {
        display_name: displayName.trim(),
        username: normalizedUsername,
        email: email.trim().toLowerCase(),
        password,
      },
      {
        onSuccess: () => {
          const params = new URLSearchParams({
            created: "true",
            username: normalizedUsername,
          });
          router.replace(`/login?${params.toString()}`);
        },
      },
    );
  }

  const requestError =
    register.error instanceof ApiError
      ? register.error.message
      : register.isError
        ? "We couldn't create your account. Please try again."
        : null;

  return (
    <form
      className={`${styles.loginForm} ${styles.signupForm}`}
      method="post"
      onSubmit={handleSubmit}
    >
      <div className={styles.formHeading}>
        <span>START YOUR OWN TRAIL</span>
        <h2>Create account</h2>
        <p>Your progress, XP, streak, and rank will belong only to you.</p>
      </div>

      <div className={styles.fieldGrid}>
        <TextField
          autoComplete="name"
          icon={UserRound}
          label="Display name"
          maxLength={100}
          minLength={2}
          name="displayName"
          onChange={setDisplayName}
          value={displayName}
        />
        <TextField
          autoComplete="username"
          icon={AtSign}
          label="Username"
          maxLength={30}
          minLength={3}
          name="username"
          onChange={setUsername}
          value={username}
        />
      </div>

      <TextField
        autoComplete="email"
        icon={Mail}
        label="Email"
        maxLength={255}
        name="email"
        onChange={setEmail}
        type="email"
        value={email}
      />

      <PasswordField
        autoComplete="new-password"
        label="Password"
        minLength={8}
        name="password"
        onChange={setPassword}
        value={password}
      />
      <PasswordField
        autoComplete="new-password"
        label="Confirm password"
        minLength={8}
        name="passwordConfirmation"
        onChange={setPasswordConfirmation}
        value={passwordConfirmation}
      />

      <p className={styles.passwordHint}>
        Use 8+ characters with uppercase, lowercase, and a number.
      </p>

      <div className={styles.formFeedback} aria-live="polite">
        {validationError ?? requestError}
      </div>

      <button
        className={styles.submitButton}
        disabled={register.isPending}
        type="submit"
      >
        {register.isPending ? <span className={styles.spinner} /> : null}
        {register.isPending ? "Creating your trail…" : "Create account"}
      </button>

      <p className={styles.authSwitch}>
        Already have an account? <Link href="/login">Sign in</Link>
      </p>
    </form>
  );
}
