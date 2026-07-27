"use client";

import {
  type QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { apiGet, apiRequest } from "@/lib/api/client";
import {
  leaderboardQueryKey,
  learningPathQueryKey,
  profileQueryKey,
} from "@/lib/api/queries";
import type {
  LearnerStats,
  LearningPathResponse,
  ProfileResponse,
} from "@/lib/api/types";
import type {
  AnswerFeedback,
  HeartsRefillResponse,
  LessonAttempt,
  LessonResponse,
  SubmittedAnswer,
} from "./lesson.types";

export const lessonQueryKey = (lessonId: number) =>
  ["lesson", lessonId] as const;

export function useLesson(lessonId: number) {
  return useQuery({
    queryKey: lessonQueryKey(lessonId),
    queryFn: ({ signal }) =>
      apiGet<LessonResponse>(`/api/v1/lessons/${lessonId}`, signal),
    staleTime: 5 * 60_000,
    retry: 1,
  });
}

export function useLessonAttempt(lessonId: number) {
  return useQuery({
    queryKey: ["lesson-attempt", lessonId],
    queryFn: () =>
      apiRequest<LessonAttempt>(`/api/v1/lessons/${lessonId}/attempts`, {
        method: "POST",
      }),
    retry: false,
  });
}

interface SubmitAnswerVariables {
  attemptId: number;
  exerciseId: number;
  answer: SubmittedAnswer;
}

function updateCachedLearnerStats(
  queryClient: QueryClient,
  learner: LearnerStats,
) {
  queryClient.setQueryData<LearningPathResponse>(
    learningPathQueryKey,
    (current) => (current ? { ...current, learner } : current),
  );
  queryClient.setQueryData<ProfileResponse>(
    profileQueryKey,
    (current) => (current ? { ...current, stats: learner } : current),
  );
}

export function useSubmitAnswer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      attemptId,
      exerciseId,
      answer,
    }: SubmitAnswerVariables) =>
      apiRequest<AnswerFeedback>(
        `/api/v1/attempts/${attemptId}/answers`,
        {
          method: "POST",
          body: {
            exercise_id: exerciseId,
            answer,
          },
        },
      ),
    onSuccess: (result) => {
      updateCachedLearnerStats(queryClient, result.learner);
      if (result.status === "completed") {
        void queryClient.invalidateQueries({ queryKey: learningPathQueryKey });
        void queryClient.invalidateQueries({ queryKey: profileQueryKey });
        void queryClient.invalidateQueries({ queryKey: leaderboardQueryKey });
      }
    },
  });
}

export function useRefillHearts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      apiRequest<HeartsRefillResponse>("/api/v1/hearts/refill", {
        method: "POST",
      }),
    onSuccess: (result) => {
      updateCachedLearnerStats(queryClient, result.learner);
    },
  });
}
