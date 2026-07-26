import { useQuery } from "@tanstack/react-query";
import { apiGet } from "./client";
import type { LearningPathResponse } from "./types";

export const learningPathQueryKey = ["learning-path"] as const;

export function useLearningPath() {
  return useQuery({
    queryKey: learningPathQueryKey,
    queryFn: ({ signal }) =>
      apiGet<LearningPathResponse>("/api/v1/path", signal),
    staleTime: 30_000,
    retry: 1,
  });
}
