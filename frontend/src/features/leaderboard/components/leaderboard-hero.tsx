import { ArrowUp, ShieldCheck } from "lucide-react";
import styles from "../styles/leaderboard.module.css";

interface LeaderboardHeroProps {
  currentRank: number;
}

export function LeaderboardHero({ currentRank }: LeaderboardHeroProps) {
  return (
    <header className={styles.hero}>
      <div className={styles.shield}>
        <ShieldCheck aria-hidden="true" fill="currentColor" />
        <span>5</span>
      </div>
      <div>
        <span>BRONZE LEAGUE</span>
        <h1>Weekly leaderboard</h1>
        <p>Earn XP from lessons and climb past your fellow explorers.</p>
      </div>
      <div className={styles.rankCallout}>
        <ArrowUp aria-hidden="true" />
        <span>Your rank</span>
        <strong>#{currentRank}</strong>
      </div>
    </header>
  );
}
