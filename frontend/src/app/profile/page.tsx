import type { Metadata } from "next";
import { AuthGuard } from "@/features/auth";
import { ProfilePage } from "@/features/profile";

export const metadata: Metadata = {
  title: "Profile — LingoTrail",
  description: "Review your language-learning progress and achievements.",
};

export default function ProfileRoute() {
  return (
    <AuthGuard>
      <ProfilePage />
    </AuthGuard>
  );
}
