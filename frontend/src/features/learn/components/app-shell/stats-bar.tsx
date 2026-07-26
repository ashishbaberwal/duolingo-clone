import { Apple, Flame, Gem, Heart, Zap } from "lucide-react";
import type { LearnerStats } from "@/lib/api/types";
import styles from "../../styles/app-shell.module.css";
import { LogoMark } from "./logo-mark";

interface StatsBarProps {
  stats: LearnerStats;
}

export function StatsBar({ stats }: StatsBarProps) {
  const items = [
    { label: "Course", value: "ES", icon: Apple, tone: "flag" },
    {
      label: "Day streak",
      value: stats.current_streak,
      icon: Flame,
      tone: "streak",
    },
    { label: "Total XP", value: stats.total_xp, icon: Zap, tone: "xp" },
    { label: "Gems", value: stats.gems, icon: Gem, tone: "gems" },
    {
      label: "Hearts",
      value: `${stats.hearts}/${stats.max_hearts}`,
      icon: Heart,
      tone: "hearts",
    },
  ] as const;

  return (
    <header className={styles.statsBar}>
      <div className={styles.mobileBrand}>
        <LogoMark />
      </div>
      {items.map(({ label, value, icon: Icon, tone }) => (
        <div
          className={`${styles.statItem} ${styles[`stat_${tone}`]}`}
          key={label}
          aria-label={`${label}: ${value}`}
        >
          <Icon aria-hidden="true" fill="currentColor" strokeWidth={2.6} />
          <span>{value}</span>
        </div>
      ))}
    </header>
  );
}
