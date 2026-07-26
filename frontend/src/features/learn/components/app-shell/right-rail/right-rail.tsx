import { Search } from "lucide-react";
import type { LearnerStats } from "@/lib/api/types";
import styles from "../../../styles/app-shell.module.css";
import { CoachCard } from "./coach-card";
import { DailyGoalCard } from "./daily-goal-card";
import { LeagueCard } from "./league-card";

interface RightRailProps {
  stats: LearnerStats;
}

export function RightRail({ stats }: RightRailProps) {
  return (
    <aside className={styles.rightRail} aria-label="Learning summary">
      <div className={styles.railUtility}>
        <button type="button" aria-label="Search, coming soon">
          <Search aria-hidden="true" />
        </button>
        <span>Course dashboard</span>
      </div>
      <DailyGoalCard stats={stats} />
      <LeagueCard totalXp={stats.total_xp} />
      <CoachCard />
      <p className={styles.legal}>ABOUT · BLOG · STORE · TERMS · PRIVACY</p>
    </aside>
  );
}
