// Shared Tailwind class strings for the auth forms. Plain module (no server
// imports) so it can be used from Client Components.

export const inputClass =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:focus:border-indigo-400 dark:focus:ring-indigo-400/30";

export const labelClass =
  "mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400";

export const buttonClass =
  "inline-flex w-full items-center justify-center rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:from-indigo-500 hover:to-violet-500 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:focus:ring-offset-gray-950";

export const linkClass =
  "font-medium text-indigo-600 underline-offset-2 transition hover:text-indigo-500 hover:underline dark:text-indigo-400";

export const errorBoxClass =
  "rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/50 dark:text-red-300";

export const noticeBoxClass =
  "rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700 dark:border-green-900/50 dark:bg-green-950/50 dark:text-green-300";
