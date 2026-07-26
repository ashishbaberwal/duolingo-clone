"use client";

import { useLearningPath } from "@/lib/api/queries";
import { AppShell } from "./components/app-shell/app-shell";
import { LearningPath } from "./components/learning-path/learning-path";
import { ErrorState } from "./components/page-states/error-state";
import { LoadingState } from "./components/page-states/loading-state";

export function LearnPage() {
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
