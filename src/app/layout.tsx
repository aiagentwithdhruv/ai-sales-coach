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
    default: "QuotaHit — Your AI Sales Department | Find. Qualify. Close. Automatically.",
    template: "%s — QuotaHit",
  },
  description: "Your autonomous AI Sales Department. 7 AI agents that find leads, qualify prospects, reach out on every channel, follow up, close deals, and collect payment — while you sleep. Replaces 5-7 sales tools at a fraction of the cost.",
  keywords: [
    "AI SDR", "AI sales agent", "autonomous sales", "AI lead qualification", "AI sales department",
    "AI cold calling", "AI outreach", "sales automation AI", "AI BDR", "lead scoring AI",
    "11x alternative", "Artisan alternative", "AI sales platform", "QuotaHit",
    "voice-first CRM", "AI sales tools", "MCP sales", "AI follow up",
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
    title: "QuotaHit — Your AI Sales Department",
    description: "7 AI agents that find leads, qualify, reach out, follow up, close deals, and collect payment. Your sales team that works while you sleep.",
    url: siteUrl,
    siteName: "QuotaHit",
    type: "website",
    locale: "en_US",
    images: [{ url: `${siteUrl}/opengraph-image`, width: 1200, height: 630, alt: "QuotaHit — Your AI Sales Department" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "QuotaHit — Your AI Sales Department",
    description: "7 AI agents that find leads, qualify, reach out, follow up, close deals, and collect payment. Works while you sleep.",
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
