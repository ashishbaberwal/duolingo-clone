import { Sparkles } from "lucide-react";
import { LearnerAvatar } from "@/components/learner-avatar";
import type { LeaderboardEntry } from "@/lib/api/types";
import styles from "../styles/leaderboard.module.css";

interface RankingListProps {
  entries: LeaderboardEntry[];
}

export function RankingList({ entries }: RankingListProps) {
  const remainingEntries = entries.filter((entry) => entry.rank > 3);

  return (
    <section aria-labelledby="ranking-heading">
      <div className={styles.sectionHeading}>
        <div>
          <span>KEEP CLIMBING</span>
          <h2 id="ranking-heading">League standings</h2>
        </div>
        <p>Updated from total earned XP</p>
      </div>

      <ol className={styles.rankingList} start={4}>
        {remainingEntries.map((entry) => (
          <li
            className={entry.is_current_learner ? styles.currentRow : ""}
            key={entry.username}
          >
            <span className={styles.rankNumber}>{entry.rank}</span>
            <LearnerAvatar
              avatarKey={entry.avatar_key}
              displayName={entry.display_name}
              size="small"
            />
            <div className={styles.learnerName}>
              <strong>
                {entry.display_name}
                {entry.is_current_learner && <span>YOU</span>}
              </strong>
              <small>@{entry.username}</small>
            </div>
            <strong className={styles.xp}>
              {entry.is_current_learner && <Sparkles aria-hidden="true" />}
              {entry.total_xp.toLocaleString()} XP
            </strong>
          </li>
        ))}
      </ol>
    </section>
  );
}
