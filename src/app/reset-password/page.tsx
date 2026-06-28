import Link from "next/link";
import { AuthShell } from "../auth/auth-shell";
import { errorBoxClass, linkClass } from "../auth/auth-ui";
import { ResetForm } from "./reset-form";

export const dynamic = "force-dynamic";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <AuthShell
      title="Set a new password"
      footer={
        <Link className={linkClass} href="/login">
          Back to sign in
        </Link>
      }
    >
      {token ? (
        <ResetForm token={token} />
      ) : (
        <p className={errorBoxClass}>
          This reset link is missing its token. Request a new one from the
          forgot-password page.
        </p>
      )}
    </AuthShell>
  );
}
