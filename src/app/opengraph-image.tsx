import { ImageResponse } from "next/og";

// Branded social-share card (shown when the URL is pasted into Slack, WhatsApp,
// X, LinkedIn, iMessage, etc.). Mirrors the app's logo + gradient identity so
// shares carry our branding instead of a generic/Vercel default.
export const alt = "Stocks Manager — track your PSX portfolio";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "90px",
          background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
          color: "#ffffff",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "30px" }}>
          {/* White logo tile with the chart glyph from icon.svg */}
          <div
            style={{
              display: "flex",
              width: 128,
              height: 128,
              borderRadius: 32,
              background: "#ffffff",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg
              width="76"
              height="76"
              viewBox="0 0 32 32"
              fill="none"
              stroke="#6366f1"
              strokeWidth="2.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 21 12 15 17 18 26 9" />
              <path d="M20 9 26 9 26 15" />
            </svg>
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 38,
              fontWeight: 600,
              letterSpacing: "0.12em",
              opacity: 0.85,
            }}
          >
            PSX PORTFOLIO
          </div>
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 56,
            fontSize: 104,
            fontWeight: 800,
            letterSpacing: "-0.02em",
          }}
        >
          Stocks Manager
        </div>

        <div style={{ display: "flex", marginTop: 24, fontSize: 42, opacity: 0.92 }}>
          Live prices, profit / loss &amp; dividends — all in one dashboard.
        </div>
      </div>
    ),
    { ...size },
  );
}
