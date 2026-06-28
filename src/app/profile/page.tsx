import { requireUser } from "@/lib/auth";
import { AppHeader } from "../app-header";
import { ProfileForm } from "./profile-form";
import { PasswordForm } from "./password-form";
import { UserIcon, LockIcon } from "../icons";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await requireUser();
  const initial = (user.name || user.email).charAt(0).toUpperCase();

  return (
    <>
      <AppHeader user={user} />
      <main className="animate-fade-up mx-auto w-full max-w-2xl flex-1 px-4 py-12 sm:px-6">
        <header className="mb-8 flex items-center gap-4">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-2xl font-bold text-white shadow-md">
            {initial}
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-3xl font-bold tracking-tight">
              {user.name || "Profile"}
            </h1>
            <p className="mt-0.5 truncate text-sm text-gray-500 dark:text-gray-400">
              {user.email}
            </p>
          </div>
        </header>

        <section className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400">
              <UserIcon className="h-4 w-4" />
            </span>
            Your details
          </h2>
          <ProfileForm email={user.email} name={user.name} phone={user.phone} />
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400">
              <LockIcon className="h-4 w-4" />
            </span>
            Change password
          </h2>
          <PasswordForm />
        </section>
      </main>
    </>
  );
}
