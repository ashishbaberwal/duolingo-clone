"use client";

import { AppShell } from "@/components/app-shell";
import { DataError, DataLoading } from "@/components/data-state";
import { useProfile } from "@/lib/api/queries";
import { AchievementGrid } from "./components/achievement-grid";
import { ProfileHero } from "./components/profile-hero";
import { ProgressOverview } from "./components/progress-overview";
import styles from "./styles/profile.module.css";

export function ProfilePage() {
  const profileQuery = useProfile();

  if (profileQuery.isPending) {
    return <DataLoading label="Loading your profile" />;
  }

  if (profileQuery.isError) {
    return (
      <DataError
        message={profileQuery.error.message}
        onRetry={() => void profileQuery.refetch()}
      />
    );
  }

  return (
    <AppShell stats={profileQuery.data.stats} activeSection="profile">
      <div className={styles.page}>
        <ProfileHero profile={profileQuery.data} />
        <ProgressOverview profile={profileQuery.data} />
        <AchievementGrid achievements={profileQuery.data.achievements} />
      </div>
    </AppShell>
  );
}
