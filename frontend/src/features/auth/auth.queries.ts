"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiRequest, type ApiError } from "@/lib/api/client";
import { learningPathQueryKey } from "@/lib/api/queries";
import type {
  AuthenticatedUser,
  LoginCredentials,
  LogoutResponse,
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
      queryClient.setQueryData(currentUserQueryKey, user);
      void queryClient.invalidateQueries({ queryKey: learningPathQueryKey });
    },
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
    },
  });
}
