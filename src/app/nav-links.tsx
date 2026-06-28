"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserRole } from "@/lib/user-types";

const USER_LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/transactions", label: "Transactions" },
  { href: "/profile", label: "Profile" },
];

const ADMIN_LINKS = [
  { href: "/admin", label: "Users" },
  { href: "/profile", label: "Profile" },
];

const base = "rounded-md px-2.5 py-1.5 text-sm font-medium transition";
const active = "bg-gray-900 text-white dark:bg-white dark:text-gray-900";
const inactive =
  "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100";

export function NavLinks({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const links = role === UserRole.Admin ? ADMIN_LINKS : USER_LINKS;

  return (
    <nav className="ml-1 flex items-center gap-1">
      {links.map(({ href, label }) => {
        const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={`${base} ${isActive ? active : inactive}`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
