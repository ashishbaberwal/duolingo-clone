"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { currentUserQueryKey } from "@/features/auth/auth.queries";
import { apiGet, apiRequest } from "@/lib/api/client";
import { learningPathQueryKey } from "@/lib/api/queries";
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
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: learningPathQueryKey });
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
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: learningPathQueryKey });
      void queryClient.invalidateQueries({ queryKey: currentUserQueryKey });
    },
  });
}
