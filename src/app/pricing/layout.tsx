import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing — Autonomous AI Sales Department | QuotaHit",
  description:
    "Hire an AI sales team for less than one SDR. 7 AI agents handle lead gen, qualification, outreach, calling, closing, and onboarding. Starting at $297/mo. 14-day free trial.",
  keywords: [
    "AI sales team pricing", "AI SDR pricing", "autonomous sales agents",
    "AI sales department cost", "QuotaHit pricing", "AI cold calling pricing",
    "sales automation pricing", "AI lead generation cost",
  ],
  alternates: {
    canonical: "https://www.quotahit.com/pricing",
  },
  openGraph: {
    title: "QuotaHit Pricing — 7 AI Sales Agents from $297/mo",
    description: "Replace your SDR team with 7 AI agents. Find, qualify, reach, call, close, and onboard customers autonomously. 14-day free trial.",
    url: "https://www.quotahit.com/pricing",
  },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
