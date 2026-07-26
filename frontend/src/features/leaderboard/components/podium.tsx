import { Crown } from "lucide-react";
import { LearnerAvatar } from "@/components/learner-avatar";
import type { LeaderboardEntry } from "@/lib/api/types";
import styles from "../styles/leaderboard.module.css";

interface PodiumProps {
  entries: LeaderboardEntry[];
}

const DISPLAY_ORDER = [2, 1, 3] as const;

export function Podium({ entries }: PodiumProps) {
  const topEntries = DISPLAY_ORDER.map((rank) =>
    entries.find((entry) => entry.rank === rank),
  ).filter((entry): entry is LeaderboardEntry => entry !== undefined);

  return (
    <section className={styles.podium} aria-label="Top three learners">
      {topEntries.map((entry) => (
        <article
          className={`${styles.podiumPlace} ${styles[`place${entry.rank}`]} ${
            entry.is_current_learner ? styles.currentLearner : ""
          }`}
          key={entry.username}
        >
          {entry.rank === 1 && <Crown aria-hidden="true" />}
          <LearnerAvatar
            avatarKey={entry.avatar_key}
            displayName={entry.display_name}
            size={entry.rank === 1 ? "large" : "medium"}
          />
          <strong>{entry.display_name}</strong>
          <span className={styles.podiumXp}>
            {entry.total_xp.toLocaleString()} XP
          </span>
          <div aria-label={`Rank ${entry.rank}`}>{entry.rank}</div>
        </article>
      ))}
    </section>
  );
}
