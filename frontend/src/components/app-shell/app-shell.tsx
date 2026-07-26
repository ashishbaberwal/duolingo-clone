"use client";

import { AnimatePresence } from "motion/react";
import { useEffect, useState, type ReactNode } from "react";
import type { LearnerStats } from "@/lib/api/types";
import styles from "./app-shell.module.css";
import { ComingSoonToast } from "./coming-soon-toast";
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
  const [comingSoonFeature, setComingSoonFeature] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (comingSoonFeature === null) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setComingSoonFeature(null);
    }, 4_000);
    return () => window.clearTimeout(timeoutId);
  }, [comingSoonFeature]);

  return (
    <div className={styles.appShell}>
      <Sidebar
        activeSection={activeSection}
        onPlaceholderSelect={setComingSoonFeature}
      />
      <div className={styles.centerColumn}>
        <StatsBar stats={stats} />
        <main className={styles.mainContent}>{children}</main>
      </div>
      <RightRail stats={stats} />
      <MobileNavigation
        activeSection={activeSection}
        onPlaceholderSelect={setComingSoonFeature}
      />
      <AnimatePresence>
        {comingSoonFeature && (
          <ComingSoonToast
            key={comingSoonFeature}
            feature={comingSoonFeature}
            onDismiss={() => setComingSoonFeature(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
