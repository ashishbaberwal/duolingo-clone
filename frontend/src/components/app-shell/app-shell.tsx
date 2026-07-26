"use client";

import type { ReactNode } from "react";
import type { LearnerStats } from "@/lib/api/types";
import styles from "./app-shell.module.css";
import { MobileNavigation } from "./mobile-navigation";
import type { AppSection } from "./navigation";
import { RightRail } from "./right-rail/right-rail";
import { Sidebar } from "./sidebar";
import { StatsBar } from "./stats-bar";

interface AppShellProps {
  stats: LearnerStats;
  children: ReactNode;
  activeSection?: AppSection;
}

export function AppShell({
  stats,
  children,
  activeSection = "learn",
}: AppShellProps) {
  return (
    <div className={styles.appShell}>
      <Sidebar activeSection={activeSection} />
      <div className={styles.centerColumn}>
        <StatsBar stats={stats} />
        <main className={styles.mainContent}>{children}</main>
      </div>
      <RightRail stats={stats} />
      <MobileNavigation activeSection={activeSection} />
    </div>
  );
}
