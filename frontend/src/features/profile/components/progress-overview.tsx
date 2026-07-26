import { BookOpenCheck, Flame, Medal, Zap } from "lucide-react";
import type { ProfileResponse } from "@/lib/api/types";
import styles from "../styles/profile.module.css";

interface ProgressOverviewProps {
  profile: ProfileResponse;
}

export function ProgressOverview({ profile }: ProgressOverviewProps) {
  const goalPercentage = Math.min(
    100,
    Math.round((profile.stats.today_xp / profile.stats.daily_goal_xp) * 100),
  );
  const stats = [
    {
      label: "Total XP",
      value: profile.stats.total_xp.toLocaleString(),
      icon: Zap,
      tone: "xp",
    },
    {
      label: "Longest streak",
      value: `${profile.longest_streak} ${
        profile.longest_streak === 1 ? "day" : "days"
      }`,
      icon: Flame,
      tone: "streak",
    },
    {
      label: "Lessons done",
      value: profile.lessons_completed,
      icon: BookOpenCheck,
      tone: "lessons",
    },
    {
      label: "Skills mastered",
      value: profile.skills_completed,
      icon: Medal,
      tone: "skills",
    },
  ] as const;

  return (
    <section aria-labelledby="progress-heading">
      <div className={styles.sectionHeading}>
        <div>
          <span>YOUR NUMBERS</span>
          <h2 id="progress-heading">Progress overview</h2>
        </div>
        <strong>{profile.stats.current_streak} day active streak</strong>
      </div>

      <div className={styles.statGrid}>
        {stats.map(({ label, value, icon: Icon, tone }) => (
          <article className={styles.statCard} key={label}>
            <span className={`${styles.statIcon} ${styles[tone]}`}>
              <Icon aria-hidden="true" fill="currentColor" />
            </span>
            <div>
              <strong>{value}</strong>
              <span>{label}</span>
            </div>
          </article>
        ))}
      </div>

      <article className={styles.goalCard}>
        <div className={styles.goalCopy}>
          <span>TODAY&apos;S GOAL</span>
          <h3>
            {profile.stats.today_xp} of {profile.stats.daily_goal_xp} XP
          </h3>
          <p>
            {goalPercentage >= 100
              ? "Daily goal complete. Your streak is safe!"
              : "One lesson at a time—keep the trail moving."}
          </p>
        </div>
        <div
          className={styles.goalRing}
          style={{ "--goal-progress": `${goalPercentage * 3.6}deg` } as React.CSSProperties}
          aria-label={`Daily goal ${goalPercentage}% complete`}
        >
          <span>{goalPercentage}%</span>
        </div>
      </article>
    </section>
  );
}
