"use client";

import { AppShell } from "@/components/app-shell";
import { DataError, DataLoading } from "@/components/data-state";
import { useLeaderboard, useProfile } from "@/lib/api/queries";
import { LeaderboardHero } from "./components/leaderboard-hero";
import { Podium } from "./components/podium";
import { RankingList } from "./components/ranking-list";
import styles from "./styles/leaderboard.module.css";

export function LeaderboardPage() {
  const profileQuery = useProfile();
  const leaderboardQuery = useLeaderboard();

  if (profileQuery.isPending || leaderboardQuery.isPending) {
    return <DataLoading label="Loading league standings" />;
  }

  if (profileQuery.isError || leaderboardQuery.isError) {
    const error = profileQuery.error ?? leaderboardQuery.error;
    return (
      <DataError
        message={error?.message ?? "The league standings are unavailable."}
        onRetry={() => {
          void profileQuery.refetch();
          void leaderboardQuery.refetch();
        }}
      />
    );
  }

  return (
    <AppShell stats={profileQuery.data.stats} activeSection="leaderboard">
      <div className={styles.page}>
        <LeaderboardHero
          currentRank={leaderboardQuery.data.current_learner_rank}
        />
        <Podium entries={leaderboardQuery.data.entries} />
        <RankingList entries={leaderboardQuery.data.entries} />
      </div>
    </AppShell>
  );
}
