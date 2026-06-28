import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Absolute base for OG/Twitter image URLs. Uses the Vercel production domain
// when deployed; override with NEXT_PUBLIC_SITE_URL for a custom domain.
// VERCEL_PROJECT_PRODUCTION_URL is a bare host (no scheme), so we add https://
// when one is missing — otherwise `new URL()` below would throw in production.
const rawSiteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.VERCEL_PROJECT_PRODUCTION_URL ??
  "http://localhost:3000";
const siteUrl = /^https?:\/\//.test(rawSiteUrl) ? rawSiteUrl : `https://${rawSiteUrl}`;

const title = "Stocks Manager";
const description =
  "Track your PSX portfolio — live prices, profit / loss and dividends in one clean dashboard.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: title,
    template: `%s · ${title}`,
  },
  description,
  applicationName: title,
  keywords: ["PSX", "Pakistan Stock Exchange", "stocks", "portfolio", "investments", "dividends"],
  authors: [{ name: "Waqas Ahmad" }],
  openGraph: {
    type: "website",
    siteName: title,
    title,
    description,
    url: siteUrl,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      {/* suppressHydrationWarning: browser extensions (e.g. ColorZilla's
          `cz-shortcut-listen`, locator devtools' `data-locator-*`) inject
          attributes into <head>/<body> before hydration. It only suppresses
          this element's own attribute diffs, not its children. */}
      <head suppressHydrationWarning>
        {/* Set the theme before first paint to avoid a flash of the wrong
            color scheme. Falls back to the OS preference when unset. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.classList.toggle('dark',d);}catch(e){}})();`,
          }}
        />
      </head>
      <body suppressHydrationWarning className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}
