import { LockKeyhole } from "lucide-react";
import { AchievementIcon } from "@/components/achievements/achievement-icon";
import type { Achievement } from "@/lib/api/types";
import styles from "../styles/profile.module.css";

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
            return (
              <article className={styles.achievementCard} key={achievement.code}>
                <span className={styles.achievementIcon}>
                  <AchievementIcon icon={achievement.icon} />
                </span>
                <div>
                  <h3>{achievement.title}</h3>
                  <p>{achievement.description}</p>
                  <div className={styles.achievementMeta}>
                    <time dateTime={achievement.unlocked_at}>
                      Earned{" "}
                      {new Intl.DateTimeFormat("en", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        timeZone: "UTC",
                      }).format(new Date(achievement.unlocked_at))}
                    </time>
                    <span>+{achievement.xp_reward} XP</span>
                  </div>
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
