"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { ApiError } from "@/lib/api/client";
import { useCurrentUser, useLogout } from "../auth.queries";
import { SessionError } from "./session-error";
import { SessionLoading } from "./session-loading";

interface AuthGuardProps {
  children: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const currentUser = useCurrentUser();
  const {
    mutate: logout,
    isPending: isLogoutPending,
    isSuccess: isLogoutComplete,
  } = useLogout();
  const isUnauthorized =
    currentUser.error instanceof ApiError && currentUser.error.status === 401;

  useEffect(() => {
    if (!isUnauthorized || isLogoutPending || isLogoutComplete) {
      return;
    }

    logout(undefined, {
      onSettled: () => {
        router.replace("/login");
        router.refresh();
      },
    });
  }, [
    isLogoutComplete,
    isLogoutPending,
    isUnauthorized,
    logout,
    router,
  ]);

  if (currentUser.isPending || isUnauthorized) {
    return <SessionLoading />;
  }

  if (currentUser.isError) {
    return <SessionError onRetry={() => void currentUser.refetch()} />;
  }

  return children;
}
