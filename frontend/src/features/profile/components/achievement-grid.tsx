import {
  Flame,
  Footprints,
  LockKeyhole,
  Sparkles,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import type { Achievement } from "@/lib/api/types";
import styles from "../styles/profile.module.css";

const ACHIEVEMENT_ICONS: Readonly<Record<string, LucideIcon>> = {
  flame: Flame,
  footprints: Footprints,
  sparkles: Sparkles,
  trophy: Trophy,
};

interface AchievementGridProps {
  achievements: Achievement[];
}

export function AchievementGrid({ achievements }: AchievementGridProps) {
  return (
    <section aria-labelledby="achievements-heading">
      <div className={styles.sectionHeading}>
        <div>
          <span>MILESTONES</span>
          <h2 id="achievements-heading">Achievements</h2>
        </div>
        <strong>
          {achievements.length} badge{achievements.length === 1 ? "" : "s"} earned
        </strong>
      </div>

      {achievements.length > 0 ? (
        <div className={styles.achievementGrid}>
          {achievements.map((achievement) => {
            const Icon = ACHIEVEMENT_ICONS[achievement.icon] ?? Trophy;
            return (
              <article className={styles.achievementCard} key={achievement.code}>
                <span className={styles.achievementIcon}>
                  <Icon aria-hidden="true" />
                </span>
                <div>
                  <h3>{achievement.title}</h3>
                  <p>{achievement.description}</p>
                  <time dateTime={achievement.unlocked_at}>
                    Earned{" "}
                    {new Intl.DateTimeFormat("en", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      timeZone: "UTC",
                    }).format(new Date(achievement.unlocked_at))}
                  </time>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className={styles.emptyAchievements}>
          <LockKeyhole aria-hidden="true" />
          <div>
            <h3>Your first badge is close.</h3>
            <p>Complete a lesson to unlock a milestone.</p>
          </div>
        </div>
      )}
    </section>
  );
}
