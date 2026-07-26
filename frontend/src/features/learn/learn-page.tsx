"use client";

import { motion } from "motion/react";
import { RefreshCw, WifiOff } from "lucide-react";
import { useLearningPath } from "@/lib/api/queries";
import { AppShell } from "./app-shell";
import { LearningPath } from "./learning-path";
import { PipMascot } from "./pip-mascot";
import styles from "./learn.module.css";

function LoadingState() {
  return (
    <div className={styles.loadingScreen} aria-label="Loading learning path">
      <div className={styles.loadingBrand}>
        <span />
        <strong>lingotrail</strong>
      </div>
      <div className={styles.loadingLayout}>
        <div className={styles.loadingSidebar} />
        <div className={styles.loadingPath}>
          <div className={styles.loadingBanner} />
          {[0, 1, 2].map((item) => (
            <div className={styles.loadingNode} key={item} />
          ))}
        </div>
        <div className={styles.loadingRail} />
      </div>
    </div>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <main className={styles.errorScreen}>
      <motion.div
        className={styles.errorCard}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className={styles.errorMascotWrap}>
          <PipMascot className={styles.errorMascot} mood="focused" />
          <WifiOff aria-hidden="true" />
        </div>
        <span>TRAIL PAUSED</span>
        <h1>We couldn&apos;t load your course.</h1>
        <p>{message}</p>
        <button type="button" onClick={onRetry}>
          <RefreshCw aria-hidden="true" />
          Try again
        </button>
      </motion.div>
    </main>
  );
}

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
