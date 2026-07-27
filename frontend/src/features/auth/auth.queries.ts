"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiRequest, type ApiError } from "@/lib/api/client";
import {
  leaderboardQueryKey,
  learningPathQueryKey,
  profileQueryKey,
} from "@/lib/api/queries";
import type {
  AuthenticatedUser,
  LoginCredentials,
  LogoutResponse,
  RegisteredUser,
  RegistrationDetails,
} from "./auth.types";

export const currentUserQueryKey = ["current-user"] as const;

export function useCurrentUser() {
  return useQuery({
    queryKey: currentUserQueryKey,
    queryFn: ({ signal }) =>
      apiGet<AuthenticatedUser>("/api/v1/auth/me", signal),
    staleTime: 60_000,
    retry: (failureCount, error: ApiError) =>
      error.status !== 401 && failureCount < 1,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: LoginCredentials) =>
      apiRequest<AuthenticatedUser>("/api/v1/auth/login", {
        method: "POST",
        body: credentials,
    }),
    onSuccess: (user) => {
      queryClient.removeQueries({ queryKey: learningPathQueryKey });
      queryClient.removeQueries({ queryKey: profileQueryKey });
      queryClient.removeQueries({ queryKey: leaderboardQueryKey });
      queryClient.setQueryData(currentUserQueryKey, user);
    },
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: (details: RegistrationDetails) =>
      apiRequest<RegisteredUser>("/api/v1/auth/register", {
        method: "POST",
        body: details,
      }),
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      apiRequest<LogoutResponse>("/api/v1/auth/logout", { method: "POST" }),
    onSettled: () => {
      queryClient.removeQueries({ queryKey: currentUserQueryKey });
      queryClient.removeQueries({ queryKey: learningPathQueryKey });
      queryClient.removeQueries({ queryKey: profileQueryKey });
      queryClient.removeQueries({ queryKey: leaderboardQueryKey });
    },
  });
}
