import { Logo } from "../logo";

function TickerChip({
  name,
  change,
  up,
  delay,
}: {
  name: string;
  change: string;
  up?: boolean;
  delay: string;
}) {
  return (
    <span
      className="animate-fade-up inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium text-white backdrop-blur"
      style={{ animationDelay: delay }}
    >
      {name}
      <span className={up ? "text-emerald-300" : "text-rose-300"}>
        {up ? "▲" : "▼"} {change}
      </span>
    </span>
  );
}

/** Branded marketing panel for the auth screens (left side on desktop). */
export function AuthHero() {
  return (
    <div className="relative flex h-full flex-col justify-between overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-10 text-white">
      {/* Floating glow accents */}
      <div className="animate-float pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-indigo-500/25 blur-3xl" />
      <div
        className="animate-float pointer-events-none absolute -bottom-28 -left-16 h-80 w-80 rounded-full bg-violet-500/20 blur-3xl"
        style={{ animationDelay: "-3s" }}
      />

      {/* Brand */}
      <div className="animate-fade-up relative flex items-center gap-2.5">
        <Logo />
        <span className="text-lg font-semibold tracking-tight">Stocks Manager</span>
      </div>

      {/* Glass chart card */}
      <div
        className="animate-fade-up relative my-8"
        style={{ animationDelay: "0.15s" }}
      >
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur-md">
          <div className="mb-1 flex items-baseline justify-between">
            <div>
              <p className="text-xs text-indigo-200/70">Portfolio value</p>
              <p className="text-2xl font-bold tracking-tight">Rs 106,685.86</p>
            </div>
            <span className="rounded-full bg-emerald-400/15 px-2 py-1 text-xs font-semibold text-emerald-300">
              ▲ 8.2%
            </span>
          </div>

          <svg viewBox="0 0 320 130" className="mt-3 w-full" role="img" aria-label="Upward stock trend chart">
            <defs>
              <linearGradient id="heroArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#34d399" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
              </linearGradient>
            </defs>
            {/* gridlines */}
            {[28, 58, 88].map((y) => (
              <line key={y} x1="0" y1={y} x2="320" y2={y} stroke="#ffffff" strokeOpacity="0.07" strokeWidth="1" />
            ))}
            {/* area fill */}
            <path
              d="M8 110 L40 96 L72 104 L104 74 L136 82 L168 54 L200 62 L232 38 L264 46 L296 22 L312 14 L312 122 L8 122 Z"
              fill="url(#heroArea)"
              className="animate-fade-in"
              style={{ animationDelay: "1.4s" }}
            />
            {/* trend line */}
            <path
              d="M8 110 L40 96 L72 104 L104 74 L136 82 L168 54 L200 62 L232 38 L264 46 L296 22 L312 14"
              fill="none"
              stroke="#34d399"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="animate-draw"
            />
            <circle cx="312" cy="14" r="4" fill="#34d399" className="animate-fade-in" style={{ animationDelay: "2.2s" }} />
          </svg>

          <div className="mt-4 flex flex-wrap gap-2">
            <TickerChip name="LUCK" change="2.4%" up delay="0.5s" />
            <TickerChip name="OGDC" change="1.1%" up delay="0.65s" />
            <TickerChip name="MARI" change="0.6%" delay="0.8s" />
            <TickerChip name="ENGRO" change="1.9%" up delay="0.95s" />
          </div>
        </div>
      </div>

      {/* Headline */}
      <div className="animate-fade-up relative" style={{ animationDelay: "0.3s" }}>
        <h2 className="text-3xl font-bold leading-tight">
          Track every trade.
          <br />
          See your gains.
        </h2>
        <p className="mt-3 max-w-sm text-sm text-indigo-100/80">
          Buys, sells, dividends and live profit &amp; loss — your whole
          portfolio in one elegant dashboard.
        </p>
      </div>
    </div>
  );
}
