import type { Metadata } from "next";
import Script from "next/script";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { CursorGlow } from "@/components/ui/cursor-glow";
import { FeedbackWidget } from "@/components/feedback/FeedbackWidget";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.quotahit.com";

export const metadata: Metadata = {
  title: {
    default: "QuotaHit — AI Sales Coach | Practice. Coach. Close.",
    template: "%s — QuotaHit",
  },
  description: "Your AI Sales Coach. Practice pitches with real-time voice, get instant objection coaching, and analyze calls — all powered by GPT-4o, Claude 4.6 & Kimi K2.5. 10-50x cheaper than Gong.",
  keywords: [
    "AI sales coach", "sales training AI", "AI sales practice", "objection handling AI",
    "sales call analysis", "AI roleplay sales", "sales coaching software", "sales pitch practice",
    "AI cold call practice", "sales objection coach", "Gong alternative", "QuotaHit",
    "sales rep training", "voice sales practice", "AI sales tools",
  ],
  metadataBase: new URL(siteUrl),
  verification: {
    google: "Kv0oGUXvwgTGbYfPPdE6Ry_kwsdHjImBJyHuFBWFnPc",
  },
  manifest: "/site.webmanifest",
  alternates: {
    canonical: siteUrl,
    types: {
      "application/rss+xml": `${siteUrl}/feed`,
    },
  },
  openGraph: {
    title: "QuotaHit — AI Sales Coach",
    description: "Practice pitches with real-time voice, get instant objection coaching, and analyze calls. 10-50x cheaper than Gong.",
    url: siteUrl,
    siteName: "QuotaHit",
    type: "website",
    locale: "en_US",
    images: [{ url: `${siteUrl}/opengraph-image`, width: 1200, height: 630, alt: "QuotaHit — AI Sales Coach" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "QuotaHit — AI Sales Coach",
    description: "Practice pitches with real-time voice, get instant objection coaching, and analyze calls. 10-50x cheaper than Gong.",
    site: "@aiwithdhruv",
    creator: "@aiwithdhruv",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" style={{ colorScheme: "dark" }} suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased bg-obsidian text-platinum min-h-screen`}
        suppressHydrationWarning
      >
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-T83FQXK3RZ"
          strategy="afterInteractive"
        />
        <Script id="ga4-init" strategy="afterInteractive">
          {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-T83FQXK3RZ');`}
        </Script>
        <AuthProvider>
          <CursorGlow />
          {children}
          <FeedbackWidget />
        </AuthProvider>
      </body>
    </html>
  );
}
