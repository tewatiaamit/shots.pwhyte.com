import type { Metadata } from "next";
import localFont from "next/font/local";
import Script from "next/script";
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
      <head>
        {/* Google tag (gtag.js) — Google Ads AW-18305531844 & GA4 G-KV6E3NR0HN */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=AW-18305531844"
          strategy="afterInteractive"
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'AW-18305531844');
            gtag('config', 'G-KV6E3NR0HN');
          `}
        </Script>
        {/* Microsoft Clarity */}
        <Script id="clarity-init" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "xloba09jvx");
          `}
        </Script>
      </head>
      <body className={`${bricolage.variable} ${instrument.variable}`}>
        {children}
      </body>
    </html>
  );
}
