import type { ReactNode } from "react";

type IconProps = { className?: string };

function Svg({ className = "h-5 w-5", children }: IconProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      // shrink-0 keeps icons from being squeezed in tight flex rows on mobile.
      className={`shrink-0 ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export const WalletIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M19 7V5a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4" />
    <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
    <path d="M18 12a2 2 0 0 0 0 4h3v-4Z" />
  </Svg>
);

export const RefreshIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M21 12a9 9 0 1 1-2.64-6.36" />
    <path d="M21 3v5h-5" />
  </Svg>
);

export const BanknoteIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="2" y="6" width="20" height="12" rx="2" />
    <circle cx="12" cy="12" r="2.5" />
    <path d="M6 12h.01M18 12h.01" />
  </Svg>
);

export const TrendingUpIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M22 7 13.5 15.5 8.5 10.5 2 17" />
    <path d="M16 7h6v6" />
  </Svg>
);

export const TrendingDownIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M22 17 13.5 8.5 8.5 13.5 2 7" />
    <path d="M16 17h6v-6" />
  </Svg>
);

export const PlusIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5 12h14M12 5v14" />
  </Svg>
);

export const ReceiptIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1Z" />
    <path d="M8 7h8M8 11h8M8 15h5" />
  </Svg>
);

export const LockIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </Svg>
);

export const UserIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21a8 8 0 0 1 16 0" />
  </Svg>
);

export const CoinsIcon = (p: IconProps) => (
  <Svg {...p}>
    <ellipse cx="12" cy="6" rx="7" ry="3" />
    <path d="M5 6v6c0 1.66 3.13 3 7 3s7-1.34 7-3V6" />
    <path d="M5 12v6c0 1.66 3.13 3 7 3s7-1.34 7-3v-6" />
  </Svg>
);

export const BarChartIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 3v18h18" />
    <path d="M7 16v-5M12 16V8M17 16v-3" />
  </Svg>
);

/** Friendly, colorful empty-state illustration. */
export function EmptyPortfolioArt({ className }: IconProps) {
  return (
    <svg viewBox="0 0 220 150" className={className} fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="emptyBar" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#818cf8" />
          <stop offset="1" stopColor="#a78bfa" />
        </linearGradient>
      </defs>
      <rect x="18" y="20" width="184" height="110" rx="14" className="fill-gray-100 dark:fill-gray-800" />
      <line
        x1="36"
        y1="108"
        x2="184"
        y2="108"
        className="stroke-gray-300 dark:stroke-gray-600"
        strokeWidth="2"
        strokeDasharray="4 5"
      />
      <rect x="50" y="80" width="18" height="28" rx="4" fill="url(#emptyBar)" opacity="0.45" />
      <rect x="84" y="60" width="18" height="48" rx="4" fill="url(#emptyBar)" opacity="0.65" />
      <rect x="118" y="70" width="18" height="38" rx="4" fill="url(#emptyBar)" opacity="0.55" />
      <rect x="152" y="46" width="18" height="62" rx="4" fill="url(#emptyBar)" />
      <circle cx="170" cy="42" r="16" className="fill-indigo-500" />
      <path d="M170 35v14M163 42h14" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
