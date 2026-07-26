"use client";

import type { ReactNode } from "react";
import type { LearnerStats } from "@/lib/api/types";
import styles from "../../styles/app-shell.module.css";
import { MobileNavigation } from "./mobile-navigation";
import { RightRail } from "./right-rail/right-rail";
import { Sidebar } from "./sidebar";
import { StatsBar } from "./stats-bar";

interface AppShellProps {
  stats: LearnerStats;
  children: ReactNode;
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
