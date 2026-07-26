"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLogout } from "../auth.queries";

interface LogoutButtonProps {
  className?: string;
}

export function LogoutButton({ className }: LogoutButtonProps) {
  const router = useRouter();
  const logout = useLogout();

  function handleLogout() {
    logout.mutate(undefined, {
      onSettled: () => {
        router.replace("/login");
        router.refresh();
      },
    });
  }

  return (
    <button
      className={className}
      disabled={logout.isPending}
      onClick={handleLogout}
      type="button"
      aria-label="Sign out"
    >
      <LogOut aria-hidden="true" />
      <span>{logout.isPending ? "Signing out" : "Sign out"}</span>
    </button>
  );
}
