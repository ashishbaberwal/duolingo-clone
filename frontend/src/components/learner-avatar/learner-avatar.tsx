import styles from "./learner-avatar.module.css";

const AVATAR_EMOJI: Readonly<Record<string, string>> = {
  bear: "🐻",
  fox: "🦊",
  lion: "🦁",
  owl: "🦉",
  panda: "🐼",
};

interface LearnerAvatarProps {
  avatarKey: string;
  displayName: string;
  size?: "small" | "medium" | "large";
}

export function LearnerAvatar({
  avatarKey,
  displayName,
  size = "medium",
}: LearnerAvatarProps) {
  return (
    <span
      className={`${styles.avatar} ${styles[size]} ${styles[avatarKey] ?? ""}`}
      role="img"
      aria-label={`${displayName}'s ${avatarKey} avatar`}
    >
      {AVATAR_EMOJI[avatarKey] ?? displayName.slice(0, 1).toUpperCase()}
    </span>
  );
}
