import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

// The original page loaded these two families from Google Fonts. We self-host
// the exact variable woff2 files that were bundled with the source page and
// expose them as CSS variables so the components can reference them.
const bricolage = localFont({
  src: "./fonts/BricolageGrotesque.woff2",
  variable: "--font-bricolage",
  weight: "200 800",
  display: "swap",
});

const instrument = localFont({
  src: "./fonts/InstrumentSans.woff2",
  variable: "--font-instrument",
  weight: "400 700",
  display: "swap",
});

export const metadata: Metadata = {
  title: "P Whytes — Botanical Wellness Shots",
  description:
    "Premium botanical wellness shots made from plant-based ingredients — clean labels, every batch third-party tested, shipped from our Plantation, Florida facility.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${bricolage.variable} ${instrument.variable}`}>
        {children}
      </body>
    </html>
  );
}
