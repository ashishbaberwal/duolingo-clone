import type { LucideIcon } from "lucide-react";
import styles from "../styles/auth.module.css";

interface TextFieldProps {
  autoComplete: string;
  icon: LucideIcon;
  label: string;
  maxLength: number;
  minLength?: number;
  name: string;
  onChange: (value: string) => void;
  type?: "email" | "text";
  value: string;
}

export function TextField({
  autoComplete,
  icon: Icon,
  label,
  maxLength,
  minLength,
  name,
  onChange,
  type = "text",
  value,
}: TextFieldProps) {
  return (
    <label className={styles.field}>
      <span>{label}</span>
      <div className={styles.inputWrap}>
        <Icon aria-hidden="true" />
        <input
          autoComplete={autoComplete}
          maxLength={maxLength}
          minLength={minLength}
          name={name}
          onChange={(event) => onChange(event.target.value)}
          required
          type={type}
          value={value}
        />
      </div>
    </label>
  );
}
