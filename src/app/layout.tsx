import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { CursorGlow } from "@/components/ui/cursor-glow";

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

export const metadata: Metadata = {
  title: "QuotaHit — AI Sales Coach | Practice. Coach. Close.",
  description: "Your AI Sales Coach. Practice pitches with real-time voice, get instant objection coaching, and analyze calls — all powered by GPT-4o, Claude 4.6 & Kimi K2.5. 10-50x cheaper than Gong.",
  keywords: ["AI Sales Coach", "Sales Training", "Sales Practice", "Objection Handling", "Call Analysis", "QuotaHit"],
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
        <AuthProvider>
          <CursorGlow />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
