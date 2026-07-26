import { AchievementIcon } from "@/components/achievements/achievement-icon";
import type { UnlockedAchievement } from "../lesson.types";
import styles from "../styles/outcomes.module.css";

interface AchievementUnlocksProps {
  achievements: UnlockedAchievement[];
}

export function AchievementUnlocks({
  achievements,
}: AchievementUnlocksProps) {
  if (achievements.length === 0) {
    return null;
  }

  return (
    <section
      className={styles.achievementUnlocks}
      aria-labelledby="achievement-unlocks-heading"
    >
      <span>NEW MILESTONE{achievements.length === 1 ? "" : "S"}</span>
      <h2 id="achievement-unlocks-heading">
        {achievements.length === 1
          ? "Achievement unlocked!"
          : "Achievements unlocked!"}
      </h2>
      <div>
        {achievements.map((achievement) => (
          <article
            className={styles.achievementUnlock}
            key={achievement.code}
          >
            <i>
              <AchievementIcon icon={achievement.icon} />
            </i>
            <div>
              <strong>{achievement.title}</strong>
              <p>{achievement.description}</p>
              <small>+{achievement.xp_reward} bonus XP</small>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
