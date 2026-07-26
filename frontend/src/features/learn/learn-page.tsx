import { AuthGuard } from "@/features/auth";
import { LearningDashboard } from "./components/learning-dashboard";

export function LearnPage() {
  return (
    <AuthGuard>
      <LearningDashboard />
    </AuthGuard>
  );
}
