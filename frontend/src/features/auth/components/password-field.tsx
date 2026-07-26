"use client";

import { Eye, EyeOff, LockKeyhole } from "lucide-react";
import { useState } from "react";
import styles from "../styles/auth.module.css";

interface PasswordFieldProps {
  autoComplete: "current-password" | "new-password";
  label: string;
  minLength?: number;
  name: string;
  onChange: (value: string) => void;
  value: string;
}

export function PasswordField({
  autoComplete,
  label,
  minLength = 1,
  name,
  onChange,
  value,
}: PasswordFieldProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <label className={styles.field}>
      <span>{label}</span>
      <div className={styles.inputWrap}>
        <LockKeyhole aria-hidden="true" />
        <input
          autoComplete={autoComplete}
          maxLength={128}
          minLength={minLength}
          name={name}
          onChange={(event) => onChange(event.target.value)}
          required
          type={isVisible ? "text" : "password"}
          value={value}
        />
        <button
          aria-label={isVisible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          className={styles.passwordToggle}
          onClick={() => setIsVisible((visible) => !visible)}
          type="button"
        >
          {isVisible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
        </button>
      </div>
    </label>
  );
}
