import { useQuery } from "@tanstack/react-query";
import { apiGet } from "./client";
import type {
  LeaderboardResponse,
  LearningPathResponse,
  ProfileResponse,
} from "./types";

export const learningPathQueryKey = ["learning-path"] as const;
export const profileQueryKey = ["profile"] as const;
export const leaderboardQueryKey = ["leaderboard"] as const;

export function useLearningPath() {
  return useQuery({
    queryKey: learningPathQueryKey,
    queryFn: ({ signal }) =>
      apiGet<LearningPathResponse>("/api/v1/path", signal),
    staleTime: 30_000,
    retry: 1,
  });
}

export function useProfile() {
  return useQuery({
    queryKey: profileQueryKey,
    queryFn: ({ signal }) =>
      apiGet<ProfileResponse>("/api/v1/profile", signal),
    staleTime: 30_000,
    retry: 1,
  });
}

export function useLeaderboard() {
  return useQuery({
    queryKey: leaderboardQueryKey,
    queryFn: ({ signal }) =>
      apiGet<LeaderboardResponse>("/api/v1/leaderboard", signal),
    staleTime: 30_000,
    retry: 1,
  });
}
