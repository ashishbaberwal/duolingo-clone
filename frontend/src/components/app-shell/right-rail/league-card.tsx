import { Shield } from "lucide-react";
import styles from "../app-shell.module.css";

interface LeagueCardProps {
  totalXp: number;
}

export function LeagueCard({ totalXp }: LeagueCardProps) {
  return (
    <section className={`${styles.sideCard} ${styles.leagueCard}`}>
      <div className={styles.leagueShield}>
        <Shield aria-hidden="true" fill="currentColor" strokeWidth={2.5} />
        <span>5</span>
      </div>
      <div>
        <span className={styles.cardEyebrow}>BRONZE LEAGUE</span>
        <h2>Keep climbing</h2>
        <p>{totalXp} XP earned so far</p>
      </div>
    </section>
  );
}
