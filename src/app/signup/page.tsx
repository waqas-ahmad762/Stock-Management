import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { UserRole } from "@/lib/user-types";
import { AuthShell } from "../auth/auth-shell";
import { linkClass } from "../auth/auth-ui";
import { SignupForm } from "./signup-form";

export const dynamic = "force-dynamic";

export default async function SignupPage() {
  const user = await getCurrentUser();
  if (user) redirect(user.role === UserRole.Admin ? "/admin" : "/");

  return (
    <AuthShell
      title="Create account"
      footer={
        <>
          Already have an account?{" "}
          <Link className={linkClass} href="/login">
            Sign in
          </Link>
        </>
      }
    >
      <SignupForm />
    </AuthShell>
  );
}
