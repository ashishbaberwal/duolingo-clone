"use client";

import { useLearningPath } from "@/lib/api/queries";
import { AppShell } from "./app-shell/app-shell";
import { LearningPath } from "./learning-path/learning-path";
import { ErrorState } from "./page-states/error-state";
import { LoadingState } from "./page-states/loading-state";

export function LearningDashboard() {
  const pathQuery = useLearningPath();

  if (pathQuery.isPending) {
    return <LoadingState />;
  }

  if (pathQuery.isError) {
    return (
      <ErrorState
        message={pathQuery.error.message}
        onRetry={() => void pathQuery.refetch()}
      />
    );
  }

  return (
    <AppShell stats={pathQuery.data.learner}>
      <LearningPath units={pathQuery.data.units} />
    </AppShell>
  );
}
