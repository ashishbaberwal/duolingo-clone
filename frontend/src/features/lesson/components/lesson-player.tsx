"use client";

import { useState } from "react";
import { ApiError } from "@/lib/api/client";
import {
  useLessonAttempt,
  useRefillHearts,
  useSubmitAnswer,
} from "../lesson.queries";
import type {
  AnswerFeedback,
  LessonAttempt,
  LessonResponse,
  SubmittedAnswer,
} from "../lesson.types";
import styles from "../styles/lesson-shell.module.css";
import { ExerciseStage } from "./exercise-stage";
import { LessonActionBar } from "./lesson-action-bar";
import { LessonComplete } from "./lesson-complete";
import { LessonError } from "./lesson-error";
import { LessonHeader } from "./lesson-header";
import { LessonLoading } from "./lesson-loading";
import { OutOfHearts } from "./out-of-hearts";

interface LessonPlayerProps {
  lesson: LessonResponse;
}

export function LessonPlayer({ lesson }: LessonPlayerProps) {
  const attemptQuery = useLessonAttempt(lesson.id);
  const submitAnswer = useSubmitAnswer();
  const refillHearts = useRefillHearts();
  const [attemptProjection, setAttemptProjection] =
    useState<LessonAttempt | null>(null);
  const [draft, setDraft] = useState<SubmittedAnswer | null>(null);
  const [feedback, setFeedback] = useState<AnswerFeedback | null>(null);
  const [showOutcome, setShowOutcome] = useState(false);
  const attempt = attemptProjection ?? attemptQuery.data ?? null;
  const startError = attemptQuery.error;
  const isOutOfHearts =
    startError instanceof ApiError && startError.status === 409;

  function handleSubmit() {
    if (attempt === null || draft === null || feedback !== null) {
      return;
    }
    const exercise = lesson.exercises.find(
      (candidate) => candidate.id === attempt.current_exercise_id,
    );
    if (exercise === undefined) {
      return;
    }

    submitAnswer.mutate(
      {
        attemptId: attempt.id,
        exerciseId: exercise.id,
        answer: draft,
      },
      {
        onSuccess: (result) => {
          setFeedback(result);
          setAttemptProjection((current) =>
            current === null
              ? {
                  ...attempt,
                  status: result.status,
                  hearts_remaining: result.hearts_remaining,
                  answered_count: result.answered_count,
                }
              : {
                  ...current,
                  status: result.status,
                  hearts_remaining: result.hearts_remaining,
                  answered_count: result.answered_count,
                },
          );
        },
      },
    );
  }

  function handleContinue() {
    if (feedback === null || attempt === null) {
      return;
    }
    if (feedback.status === "completed" || feedback.status === "failed") {
      setShowOutcome(true);
      return;
    }

    setAttemptProjection({
      ...attempt,
      current_exercise_id: feedback.next_exercise_id,
    });
    setFeedback(null);
    setDraft(null);
  }

  function handleRefill() {
    refillHearts.mutate(undefined, {
      onSuccess: () => {
        setAttemptProjection(null);
        setDraft(null);
        setFeedback(null);
        setShowOutcome(false);
        void attemptQuery.refetch();
      },
    });
  }

  if (isOutOfHearts || (showOutcome && feedback?.status === "failed")) {
    return (
      <OutOfHearts
        isRefilling={refillHearts.isPending || attemptQuery.isFetching}
        message={
          refillHearts.error instanceof ApiError
            ? refillHearts.error.message
            : undefined
        }
        onRefill={handleRefill}
      />
    );
  }

  if (
    attemptQuery.isPending ||
    (attempt === null && attemptQuery.error === null)
  ) {
    return <LessonLoading />;
  }

  if (attemptQuery.isError || attempt === null) {
    return (
      <LessonError
        message={
          startError instanceof ApiError
            ? startError.message
            : "We couldn't start this lesson."
        }
        onRetry={() => void attemptQuery.refetch()}
      />
    );
  }

  if (showOutcome && feedback?.status === "completed") {
    return <LessonComplete feedback={feedback} lesson={lesson} />;
  }

  const exercise = lesson.exercises.find(
    (candidate) => candidate.id === attempt.current_exercise_id,
  );
  if (exercise === undefined) {
    return (
      <LessonError
        message="The next exercise could not be found."
        onRetry={() => void attemptQuery.refetch()}
      />
    );
  }

  return (
    <main className={styles.lessonScreen}>
      <LessonHeader
        answeredCount={attempt.answered_count}
        exerciseCount={attempt.exercise_count}
        hearts={attempt.hearts_remaining}
      />
      <div className={styles.lessonContext}>
        <span>{lesson.skill_title}</span>
        <strong>{lesson.title}</strong>
      </div>
      <ExerciseStage
        disabled={feedback !== null || submitAnswer.isPending}
        exercise={exercise}
        key={exercise.id}
        onChange={setDraft}
      />
      {submitAnswer.isError && feedback === null ? (
        <div className={styles.submissionError} role="alert">
          {submitAnswer.error instanceof ApiError
            ? submitAnswer.error.message
            : "Your answer couldn't be checked. Please try again."}
        </div>
      ) : null}
      <LessonActionBar
        canSubmit={draft !== null}
        feedback={feedback}
        isSubmitting={submitAnswer.isPending}
        onContinue={handleContinue}
        onSubmit={handleSubmit}
      />
    </main>
  );
}
