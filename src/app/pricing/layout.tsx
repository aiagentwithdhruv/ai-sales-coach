import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing — AI Sales Coach Modules | QuotaHit",
  description:
    "Simple module-based pricing for AI sales coaching. Start free, pick individual modules (coaching, CRM, calling, follow-ups, analytics) or get the all-in-one bundle. BYOAPI — no markup on AI usage.",
  keywords: [
    "AI sales coach pricing", "sales coaching software cost", "Gong alternative pricing",
    "cheap sales training tool", "BYOAPI sales tool", "sales AI pricing",
  ],
  alternates: {
    canonical: "https://www.quotahit.com/pricing",
  },
  openGraph: {
    title: "QuotaHit Pricing — AI Sales Coaching Modules",
    description: "Start free. Pick modules you need. BYOAPI — no markup on AI usage. 10-50x cheaper than Gong.",
    url: "https://www.quotahit.com/pricing",
  },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
