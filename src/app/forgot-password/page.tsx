import Link from "next/link";
import { AuthShell } from "../auth/auth-shell";
import { linkClass } from "../auth/auth-ui";
import { ForgotForm } from "./forgot-form";

export const dynamic = "force-dynamic";

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Reset your password"
      footer={
        <Link className={linkClass} href="/login">
          Back to sign in
        </Link>
      }
    >
      <ForgotForm />
    </AuthShell>
  );
}
