"use client";

import {
  Apple,
  Flame,
  Gem,
  Heart,
  Home,
  MoreHorizontal,
  Search,
  Shield,
  ShoppingBag,
  Target,
  Trophy,
  UserRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import type { LearnerStats } from "@/lib/api/types";
import { PipMascot } from "./pip-mascot";
import styles from "./learn.module.css";

interface AppShellProps {
  stats: LearnerStats;
  children: ReactNode;
}

interface NavItem {
  label: string;
  icon: LucideIcon;
  active?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Learn", icon: Home, active: true },
  { label: "Leaderboards", icon: Trophy },
  { label: "Quests", icon: Target },
  { label: "Shop", icon: ShoppingBag },
  { label: "Profile", icon: UserRound },
  { label: "More", icon: MoreHorizontal },
];

function LogoMark() {
  return (
    <span className={styles.logoMark} aria-hidden="true">
      <span className={styles.logoEye} />
      <span className={styles.logoEye} />
      <span className={styles.logoBeak} />
    </span>
  );
}

function Sidebar() {
  return (
    <aside className={styles.sidebar}>
      <Link className={styles.brand} href="/" aria-label="LingoTrail home">
        <LogoMark />
        <span>lingotrail</span>
      </Link>
      <nav className={styles.sidebarNav} aria-label="Primary navigation">
        {NAV_ITEMS.map(({ label, icon: Icon, active }) => (
          <button
            className={`${styles.navItem} ${active ? styles.navItemActive : ""}`}
            key={label}
            type="button"
            aria-current={active ? "page" : undefined}
            aria-label={active ? label : `${label}, coming soon`}
          >
            <Icon aria-hidden="true" strokeWidth={2.8} />
            <span>{label}</span>
            {!active && <span className={styles.soonDot} />}
          </button>
        ))}
      </nav>
      <div className={styles.sidebarFooter}>
        <PipMascot className={styles.sidebarMascot} mood="focused" />
        <p>Small steps. Real progress.</p>
      </div>
    </aside>
  );
}

export function StatsBar({ stats }: { stats: LearnerStats }) {
  const items = [
    { label: "Course", value: "ES", icon: Apple, tone: "flag" },
    {
      label: "Day streak",
      value: stats.current_streak,
      icon: Flame,
      tone: "streak",
    },
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

function DailyGoalCard({ stats }: { stats: LearnerStats }) {
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

function LeagueCard({ totalXp }: { totalXp: number }) {
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

function CoachCard() {
  return (
    <section className={`${styles.sideCard} ${styles.coachCard}`}>
      <PipMascot className={styles.coachMascot} />
      <div>
        <span className={styles.cardEyebrow}>PIP SAYS</span>
        <h2>One lesson is enough to keep momentum alive.</h2>
      </div>
    </section>
  );
}

function RightRail({ stats }: { stats: LearnerStats }) {
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
      <p className={styles.legal}>
        ABOUT · BLOG · STORE · TERMS · PRIVACY
      </p>
    </aside>
  );
}

function MobileNavigation() {
  const items = NAV_ITEMS.slice(0, 5);
  return (
    <nav className={styles.mobileNav} aria-label="Mobile navigation">
      {items.map(({ label, icon: Icon, active }) => (
        <button
          key={label}
          type="button"
          className={active ? styles.mobileNavActive : ""}
          aria-current={active ? "page" : undefined}
          aria-label={active ? label : `${label}, coming soon`}
        >
          <Icon aria-hidden="true" strokeWidth={2.8} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}

export function AppShell({ stats, children }: AppShellProps) {
  return (
    <div className={styles.appShell}>
      <Sidebar />
      <div className={styles.centerColumn}>
        <StatsBar stats={stats} />
        <main className={styles.mainContent}>{children}</main>
      </div>
      <RightRail stats={stats} />
      <MobileNavigation />
    </div>
  );
}
