import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { UserRole } from "@/lib/user-types";
import { AuthShell } from "../auth/auth-shell";
import { linkClass, noticeBoxClass } from "../auth/auth-ui";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ pending?: string; reset?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect(user.role === UserRole.Admin ? "/admin" : "/");

  const sp = await searchParams;

  return (
    <AuthShell
      title="Sign in"
      footer={
        <>
          <Link className={linkClass} href="/forgot-password">
            Forgot password?
          </Link>
          <span className="px-2">·</span>
          <Link className={linkClass} href="/signup">
            Create an account
          </Link>
        </>
      }
    >
      {sp.pending && (
        <p className={`mb-4 ${noticeBoxClass}`}>
          Account created. An admin must approve it before you can sign in.
        </p>
      )}
      {sp.reset && (
        <p className={`mb-4 ${noticeBoxClass}`}>
          Password updated. You can sign in with your new password.
        </p>
      )}
      <LoginForm />
    </AuthShell>
  );
}
