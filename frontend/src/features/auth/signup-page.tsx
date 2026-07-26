import { AuthShell } from "./components/auth-shell";
import { SignupForm } from "./components/signup-form";

export function SignupPage() {
  return (
    <AuthShell>
      <SignupForm />
    </AuthShell>
  );
}
