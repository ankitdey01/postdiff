import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { SITE_DESCRIPTION, SITE_ORIGIN } from "./site";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

/** Display/body face: Movatif Light, self-hosted (licensed files in app/fonts). */
const movatifLight = localFont({
  src: [
    { path: "./fonts/movatif-light.woff2" },
    { path: "./fonts/movatif-light.woff" },
  ],
  variable: "--font-movatif",
  weight: "300",
  display: "swap",
  fallback: ["Geist", "ui-sans-serif", "system-ui", "sans-serif"],
});

const SITE_TITLE = "Postdiff | Git commit-to-post generator for developers";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_ORIGIN),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  icons: {
    icon: [
      { url: "/logo.webp", type: "image/webp" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: "/logo.webp",
  },
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    type: "website",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Postdiff — turn finished work into posts that sound like you",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/og.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable} ${movatifLight.variable}`}>
      <body className="bg-black font-sans text-white">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[70] focus:bg-lime focus:px-4 focus:py-2 focus:font-mono focus:text-xs focus:uppercase focus:tracking-widest focus:text-ink"
        >
          Skip to content
        </a>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
