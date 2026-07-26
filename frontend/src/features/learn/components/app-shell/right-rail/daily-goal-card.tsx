import { Target } from "lucide-react";
import type { LearnerStats } from "@/lib/api/types";
import styles from "../../../styles/app-shell.module.css";

interface DailyGoalCardProps {
  stats: LearnerStats;
}

export function DailyGoalCard({ stats }: DailyGoalCardProps) {
  const percentage = Math.min(
    100,
    Math.round((stats.today_xp / stats.daily_goal_xp) * 100),
  );

  return (
    <section className={styles.sideCard} aria-labelledby="daily-goal-title">
      <div className={styles.cardHeading}>
        <div>
          <span className={styles.cardEyebrow}>TODAY</span>
          <h2 id="daily-goal-title">Daily goal</h2>
        </div>
        <span className={styles.goalBadge}>{percentage}%</span>
      </div>
      <div className={styles.goalRow}>
        <div className={styles.targetIcon}>
          <Target aria-hidden="true" strokeWidth={2.8} />
        </div>
        <div className={styles.goalContent}>
          <strong>
            {stats.today_xp} / {stats.daily_goal_xp} XP
          </strong>
          <div
            className={styles.goalTrack}
            role="progressbar"
            aria-valuenow={stats.today_xp}
            aria-valuemin={0}
            aria-valuemax={stats.daily_goal_xp}
          >
            <span style={{ width: `${percentage}%` }} />
          </div>
        </div>
      </div>
    </section>
  );
}
