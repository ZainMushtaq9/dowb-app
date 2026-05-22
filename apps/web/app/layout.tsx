import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import { WebVitals } from "@/components/WebVitals";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://example.com"),
  title: {
    default: "TikTok Downloader - Fast Video and Profile Downloads",
    template: "%s | TikTok Downloader"
  },
  description: "Download public TikTok videos and public profile videos with fast sequential queue downloads, no login, and mobile-first performance.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/website-logo.png"
  },
  robots: { index: true, follow: true },
  openGraph: {
    title: "TikTok Downloader",
    description: "Fast public TikTok video and profile downloader.",
    type: "website"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#101214"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const adsenseClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <WebVitals />
        {adsenseClient ? (
          <Script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClient}`}
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
        ) : null}
        {children}
      </body>
    </html>
  );
}
