/** Brand mark: a rounded gradient tile with an upward chart glyph. */
export function Logo({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-sm ${className}`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 24 24"
        className="h-[58%] w-[58%]"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 3v15a3 3 0 0 0 3 3h15" />
        <path d="m7 14 3.5-4 3 3L21 6" />
        <path d="M16 6h5v5" />
      </svg>
    </span>
  );
}
