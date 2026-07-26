"use client";

import { useLesson } from "./lesson.queries";
import { LessonError } from "./components/lesson-error";
import { LessonLoading } from "./components/lesson-loading";
import { LessonPlayer } from "./components/lesson-player";

interface LessonPageProps {
  lessonId: number;
}

export function LessonPage({ lessonId }: LessonPageProps) {
  const lessonQuery = useLesson(lessonId);

  if (lessonQuery.isPending) {
    return <LessonLoading />;
  }

  if (lessonQuery.isError) {
    return (
      <LessonError
        message={lessonQuery.error.message}
        onRetry={() => void lessonQuery.refetch()}
      />
    );
  }

  return <LessonPlayer lesson={lessonQuery.data} />;
}
