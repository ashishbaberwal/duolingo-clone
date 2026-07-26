import type { Metadata } from "next";
import { AuthGuard } from "@/features/auth";
import { LeaderboardPage } from "@/features/leaderboard";

export const metadata: Metadata = {
  title: "Leaderboard — LingoTrail",
  description: "Compare XP and climb the weekly LingoTrail league.",
};

export default function LeaderboardRoute() {
  return (
    <AuthGuard>
      <LeaderboardPage />
    </AuthGuard>
  );
}
