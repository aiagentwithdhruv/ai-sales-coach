"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MobileNav } from "@/components/ui/mobile-nav";
import {
  Check,
  X,
  Zap,
  Rocket,
  Building2,
  Sparkles,
  ArrowRight,
  Crown,
  Loader2,
  Phone,
  Brain,
  BarChart3,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { getSupabaseClient } from "@/lib/supabase/client";

type BillingInterval = "monthly" | "quarterly" | "yearly";

const BILLING_OPTIONS: { id: BillingInterval; label: string; discount: number; badge: string | null }[] = [
  { id: "monthly", label: "Monthly", discount: 0, badge: null },
  { id: "quarterly", label: "Quarterly", discount: 10, badge: "Save 10%" },
  { id: "yearly", label: "Yearly", discount: 20, badge: "Save 20%" },
];

const PRICING_PLANS = [
  {
    id: "starter",
    name: "Starter",
    description: "For individual reps getting started with AI coaching",
    icon: Zap,
    iconColor: "text-neonblue",
    iconBg: "bg-neonblue/20",
    monthlyPrice: 79,
    perUser: true,
    features: [
      { text: "AI sales practice (text + voice)", included: true },
      { text: "50 AI coaching sessions/month", included: true },
      { text: "CRM with pipeline management", included: true },
      { text: "Up to 500 contacts", included: true },
      { text: "Deal tracking & forecasting", included: true },
      { text: "5 AI models (GPT-5 Mini, Haiku, Gemini)", included: true },
      { text: "Basic call analysis", included: true },
      { text: "Email follow-up suggestions", included: true },
      { text: "Session history & analytics", included: true },
      { text: "Community support", included: true },
      { text: "Voice practice with GPT-4o Realtime", included: false },
      { text: "AI outbound calling", included: false },
      { text: "Premium AI models", included: false },
    ],
    cta: "Start 14-Day Trial",
    ctaLink: "/signup?plan=starter",
    popular: false,
  },
  {
    id: "professional",
    name: "Professional",
    description: "Full-featured platform for serious sales teams",
    icon: Rocket,
    iconColor: "text-neonblue",
    iconBg: "bg-neonblue/20",
    monthlyPrice: 149,
    perUser: true,
    features: [
      { text: "Everything in Starter", included: true },
      { text: "Unlimited AI coaching sessions", included: true },
      { text: "Voice practice with GPT-4o Realtime", included: true },
      { text: "Unlimited contacts & pipeline", included: true },
      { text: "AI contact enrichment", included: true },
      { text: "All 25+ AI models (GPT-5.2, Claude Opus, Sonnet)", included: true },
      { text: "Advanced call analysis & scoring", included: true },
      { text: "Custom practice personas", included: true },
      { text: "PDF export reports", included: true },
      { text: "Webhook integrations (n8n, Zapier)", included: true },
      { text: "Advanced analytics & forecasting", included: true },
      { text: "Priority support", included: true },
    ],
    cta: "Start 14-Day Trial",
    ctaLink: "/signup?plan=professional",
    popular: true,
  },
  {
    id: "business",
    name: "Business",
    description: "For sales organizations that need AI calling & team tools",
    icon: Crown,
    iconColor: "text-warningamber",
    iconBg: "bg-warningamber/20",
    monthlyPrice: 249,
    perUser: true,
    features: [
      { text: "Everything in Professional", included: true },
      { text: "AI outbound calling (campaigns)", included: true },
      { text: "AI Agent Builder", included: true },
      { text: "Call recordings & transcriptions", included: true },
      { text: "Team management & dashboards", included: true },
      { text: "Manager analytics & leaderboards", included: true },
      { text: "Shared objection library", included: true },
      { text: "Automated follow-up sequences", included: true },
      { text: "API access", included: true },
      { text: "Slack integration", included: true },
      { text: "Dedicated success manager", included: true },
      { text: "Onboarding & training", included: true },
    ],
    cta: "Start 14-Day Trial",
    ctaLink: "/signup?plan=business",
    popular: false,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "Custom solutions for large sales organizations",
    icon: Building2,
    iconColor: "text-automationgreen",
    iconBg: "bg-automationgreen/20",
    monthlyPrice: null,
    perUser: false,
    features: [
      { text: "Everything in Business", included: true },
      { text: "Unlimited users", included: true },
      { text: "Custom AI model training", included: true },
      { text: "CRM integration (HubSpot/Salesforce)", included: true },
      { text: "SSO/SAML authentication", included: true },
      { text: "Custom SLA & uptime guarantee", included: true },
      { text: "White-label option", included: true },
      { text: "On-premise deployment", included: true },
      { text: "Dedicated account team", included: true },
      { text: "Custom reporting & BI integration", included: true },
      { text: "Volume discounts", included: true },
      { text: "Annual contract flexibility", included: true },
    ],
    cta: "Contact Sales",
    ctaLink: "mailto:aiwithdhruv@gmail.com?subject=QuotaHit Enterprise Inquiry",
    popular: false,
  },
];

const COMPARISON_ITEMS = [
  { label: "Gong.io", price: "$108-250/user/mo", note: "Plus $5K-50K platform fee" },
  { label: "Salesloft", price: "$140-220/user/mo", note: "Annual contract required" },
  { label: "Orum", price: "$250/user/mo", note: "3-seat minimum" },
  { label: "Nooks", price: "$200-417/user/mo", note: "Annual contract required" },
  { label: "Outreach", price: "$100-400/user/mo", note: "Plus setup fees" },
];

const FAQ_ITEMS = [
  {
    q: "How does per-user pricing work?",
    a: "Each user (sales rep, manager, or admin) needs their own seat. Pricing is per user per month. Volume discounts are available for teams of 10+ on annual plans. Contact us for custom pricing.",
  },
  {
    q: "How does QuotaHit compare to Gong, Salesloft, or Outreach?",
    a: "QuotaHit combines AI coaching, CRM, pipeline management, and AI calling in a single platform. Gong starts at $108/user/mo (plus $5K-50K platform fees), Salesloft at $140/user/mo, and Outreach at $100-400/user/mo. Our Professional plan at $149/user/mo gives you coaching + CRM + AI models — replacing 2-3 separate tools.",
  },
  {
    q: "What AI models are included?",
    a: "Starter includes 5 efficient models (GPT-5 Mini, Claude Haiku 4.5, Gemini Flash, etc.). Professional and above unlock all 25+ models including premium options like GPT-5.2, GPT-5.1, Claude Opus 4.5, Claude Sonnet 4.5, and o3 — the most capable AI models available.",
  },
  {
    q: "Is there a free trial?",
    a: "Yes, all paid plans include a 14-day free trial with full access to every feature. No credit card required to start. Cancel anytime during the trial.",
  },
  {
    q: "Can I switch plans anytime?",
    a: "Absolutely. Upgrade, downgrade, or switch billing intervals at any time. Changes take effect immediately, and we prorate any differences. No lock-in contracts.",
  },
  {
    q: "What's included in AI outbound calling?",
    a: "The Business plan includes AI-powered outbound calling campaigns. Create AI agents with custom scripts, voices, and objectives. The AI handles cold calls, qualifies leads, books meetings, and logs everything to your CRM automatically. Telephony costs (Twilio) are billed separately at ~$0.04/min.",
  },
  {
    q: "Do you offer volume discounts?",
    a: "Yes. Teams of 10+ on annual plans receive volume discounts. Enterprise customers get custom pricing based on team size and requirements. Contact sales for a quote.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept all major credit cards. Enterprise customers can pay via wire transfer, ACH, or invoice with NET-30 terms.",
  },
];

function getDiscountedPrice(monthlyPrice: number, interval: BillingInterval): number {
  const option = BILLING_OPTIONS.find((o) => o.id === interval)!;
  return Math.round((monthlyPrice * (100 - option.discount)) / 100 * 100) / 100;
}

function getBillingTotal(monthlyPrice: number, interval: BillingInterval): number {
  const perMonth = getDiscountedPrice(monthlyPrice, interval);
  switch (interval) {
    case "monthly":
      return perMonth;
    case "quarterly":
      return Math.round(perMonth * 3 * 100) / 100;
    case "yearly":
      return Math.round(perMonth * 12 * 100) / 100;
  }
}

function getSavingsPerYear(monthlyPrice: number, interval: BillingInterval): number {
  const fullYear = monthlyPrice * 12;
  const discountedYear = getDiscountedPrice(monthlyPrice, interval) * 12;
  return Math.round((fullYear - discountedYear) * 100) / 100;
}

export default function PricingPage() {
  const [billingInterval, setBillingInterval] = useState<BillingInterval>("yearly");
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleCheckout = async (planId: string) => {
    if (planId === "enterprise") return;

    setLoadingPlan(planId);
    try {
      const supabase = getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        window.location.href = `/login?redirect=/pricing&plan=${planId}`;
        return;
      }

      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ planId, interval: billingInterval }),
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Failed to start checkout. Please try again.");
      }
    } catch {
      alert("Something went wrong. Please try again.");
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-obsidian">
      {/* Header */}
      <header className="border-b border-gunmetal bg-graphite/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neonblue to-electricblue flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-platinum">
                Quota<span className="text-neonblue">Hit</span>
              </span>
            </Link>
            <div className="flex items-center gap-3">
              <Link href="/login" className="hidden sm:block">
                <Button variant="ghost" className="text-silver hover:text-platinum">
                  Sign In
                </Button>
              </Link>
              <Link href="/signup">
                <Button className="bg-neonblue hover:bg-electricblue text-sm px-4">
                  Get Started
                </Button>
              </Link>
              <MobileNav
                links={[
                  { href: "/", label: "Home" },
                  { href: "/features", label: "Features" },
                  { href: "/pricing", label: "Pricing" },
                  { href: "/login", label: "Login" },
                  { href: "/signup", label: "Sign Up" },
                ]}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge className="bg-neonblue/20 text-neonblue border-none mb-4">
            Transparent per-seat pricing
          </Badge>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-platinum mb-4">
            One platform. Every tool you need.
          </h1>
          <p className="text-xl text-silver max-w-3xl mx-auto mb-4">
            AI coaching, CRM, pipeline management, and outbound calling — all in one place.
            Replace 3-4 tools and save thousands per rep.
          </p>
          <p className="text-lg text-mist max-w-2xl mx-auto mb-10">
            All plans include a 14-day free trial. No credit card required.
          </p>

          {/* Billing Interval Selector */}
          <div className="inline-flex items-center bg-onyx border border-gunmetal rounded-xl p-1.5 mb-12">
            {BILLING_OPTIONS.map((option) => (
              <button
                key={option.id}
                onClick={() => setBillingInterval(option.id)}
                className={cn(
                  "relative px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                  billingInterval === option.id
                    ? "bg-neonblue text-white shadow-lg shadow-neonblue/30"
                    : "text-silver hover:text-platinum"
                )}
              >
                {option.label}
                {option.badge && billingInterval === option.id && (
                  <span className="absolute -top-2.5 -right-2 bg-automationgreen text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap">
                    {option.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
            {PRICING_PLANS.map((plan) => {
              const Icon = plan.icon;
              const isMailto = plan.ctaLink.startsWith("mailto:");

              const effectivePrice = plan.monthlyPrice !== null && plan.monthlyPrice > 0
                ? getDiscountedPrice(plan.monthlyPrice, billingInterval)
                : plan.monthlyPrice;

              const billingTotal = plan.monthlyPrice !== null && plan.monthlyPrice > 0
                ? getBillingTotal(plan.monthlyPrice, billingInterval)
                : null;

              const yearlySavings = plan.monthlyPrice !== null && plan.monthlyPrice > 0
                ? getSavingsPerYear(plan.monthlyPrice, billingInterval)
                : 0;

              const showStrikethrough = billingInterval !== "monthly" && plan.monthlyPrice !== null && plan.monthlyPrice > 0;

              return (
                <Card
                  key={plan.id}
                  className={cn(
                    "relative bg-onyx border-gunmetal transition-all duration-300 hover:border-steel hover:shadow-lg hover:shadow-neonblue/5 flex flex-col",
                    plan.popular ? "glow-card-visible border-neonblue ring-2 ring-neonblue/20 lg:scale-[1.03]" : "glow-card"
                  )}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                      <Badge className="bg-neonblue text-white border-none shadow-lg shadow-neonblue/30">
                        Most Popular
                      </Badge>
                    </div>
                  )}

                  <CardHeader className="pb-4">
                    <div
                      className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center mb-4",
                        plan.iconBg
                      )}
                    >
                      <Icon className={cn("w-6 h-6", plan.iconColor)} />
                    </div>
                    <CardTitle className="text-xl font-bold text-platinum">
                      {plan.name}
                    </CardTitle>
                    <p className="text-sm text-mist min-h-[2.5rem]">{plan.description}</p>
                  </CardHeader>

                  <CardContent className="space-y-6 flex flex-col flex-1">
                    {/* Pricing */}
                    <div className="min-h-[5rem]">
                      {effectivePrice !== null ? (
                        <div>
                          <div className="flex items-baseline gap-2">
                            {showStrikethrough && (
                              <span className="text-xl text-mist line-through font-medium">
                                ${plan.monthlyPrice}
                              </span>
                            )}
                            <span className="text-4xl font-bold text-platinum">
                              ${effectivePrice % 1 === 0 ? effectivePrice : effectivePrice.toFixed(2)}
                            </span>
                            <span className="text-silver">/user/mo</span>
                          </div>
                          {billingInterval === "quarterly" && billingTotal !== null && (
                            <p className="text-sm text-neonblue mt-1 font-medium">
                              Billed ${billingTotal.toFixed(2)}/user quarterly
                            </p>
                          )}
                          {billingInterval === "yearly" && billingTotal !== null && (
                            <p className="text-sm text-neonblue mt-1 font-medium">
                              Billed ${billingTotal.toFixed(2)}/user/year
                            </p>
                          )}
                          {yearlySavings > 0 && (
                            <p className="text-xs text-automationgreen mt-1 font-semibold">
                              Save ${yearlySavings.toFixed(0)}/user/year
                            </p>
                          )}
                        </div>
                      ) : (
                        <div>
                          <span className="text-4xl font-bold text-platinum">Custom</span>
                          <p className="text-sm text-mist mt-1">
                            Tailored to your organization
                          </p>
                        </div>
                      )}
                    </div>

                    {/* CTA Button */}
                    {isMailto ? (
                      <a href={plan.ctaLink}>
                        <Button
                          className="w-full bg-automationgreen hover:bg-automationgreen/90"
                        >
                          {plan.cta}
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </a>
                    ) : (
                      <Button
                        onClick={() => handleCheckout(plan.id)}
                        disabled={loadingPlan === plan.id}
                        className={cn(
                          "w-full",
                          plan.popular
                            ? "bg-neonblue hover:bg-electricblue"
                            : "bg-steel hover:bg-gunmetal"
                        )}
                      >
                        {loadingPlan === plan.id ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          <>
                            {plan.cta}
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </>
                        )}
                      </Button>
                    )}

                    {/* Features List */}
                    <ul className="space-y-3 flex-1">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          {feature.included ? (
                            <Check className="w-4 h-4 text-automationgreen flex-shrink-0 mt-0.5" />
                          ) : (
                            <X className="w-4 h-4 text-mist/50 flex-shrink-0 mt-0.5" />
                          )}
                          <span
                            className={cn(
                              "text-sm",
                              feature.included ? "text-silver" : "text-mist/50"
                            )}
                          >
                            {feature.text}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Savings comparison banner */}
          {billingInterval !== "monthly" && (
            <div className="mt-8 bg-gradient-to-r from-automationgreen/10 via-automationgreen/5 to-automationgreen/10 border border-automationgreen/20 rounded-xl p-6 text-center">
              <p className="text-lg font-semibold text-platinum">
                {billingInterval === "quarterly"
                  ? "Quarterly billing saves 10% — that's $178/user/year on Professional!"
                  : "Annual billing saves 20% — that's $358/user/year on Professional!"}
              </p>
              <p className="text-sm text-silver mt-1">
                {billingInterval === "quarterly"
                  ? "Pay every 3 months at a lower rate. Switch to yearly anytime for even more savings."
                  : "Best value. Lock in the lowest price for a full year. Cancel anytime."}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* What's Included Section */}
      <section className="py-20 border-t border-gunmetal">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-platinum mb-3">
              Everything you need to close more deals
            </h2>
            <p className="text-lg text-silver">
              Built-in tools that replace your entire sales tech stack
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-onyx border border-gunmetal rounded-xl p-6 text-center">
              <div className="w-12 h-12 rounded-xl bg-neonblue/20 flex items-center justify-center mx-auto mb-4">
                <Brain className="w-6 h-6 text-neonblue" />
              </div>
              <h3 className="text-lg font-semibold text-platinum mb-2">AI Sales Coaching</h3>
              <p className="text-sm text-silver">
                Practice with AI personas, get real-time feedback, objection handling, and voice roleplay with GPT-4o.
              </p>
            </div>
            <div className="bg-onyx border border-gunmetal rounded-xl p-6 text-center">
              <div className="w-12 h-12 rounded-xl bg-warningamber/20 flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-6 h-6 text-warningamber" />
              </div>
              <h3 className="text-lg font-semibold text-platinum mb-2">CRM & Pipeline</h3>
              <p className="text-sm text-silver">
                Full CRM with drag-and-drop pipeline, contact enrichment, deal forecasting, and webhook integrations.
              </p>
            </div>
            <div className="bg-onyx border border-gunmetal rounded-xl p-6 text-center">
              <div className="w-12 h-12 rounded-xl bg-automationgreen/20 flex items-center justify-center mx-auto mb-4">
                <Phone className="w-6 h-6 text-automationgreen" />
              </div>
              <h3 className="text-lg font-semibold text-platinum mb-2">AI Outbound Calling</h3>
              <p className="text-sm text-silver">
                Build AI agents that make outbound calls, qualify leads, book meetings, and log everything to your CRM.
              </p>
            </div>
            <div className="bg-onyx border border-gunmetal rounded-xl p-6 text-center">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-platinum mb-2">25+ AI Models</h3>
              <p className="text-sm text-silver">
                Access GPT-5.2, Claude Opus 4.5, Gemini 3, Llama 4, and more. Pick the best model for each task.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Competitor Comparison */}
      <section className="py-20 border-t border-gunmetal">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-platinum mb-3">
              How we compare
            </h2>
            <p className="text-lg text-silver">
              QuotaHit combines coaching, CRM, and calling — replacing multiple tools at a fraction of the cost
            </p>
          </div>

          <div className="bg-onyx border border-gunmetal rounded-xl overflow-hidden">
            {/* QuotaHit row (highlighted) */}
            <div className="flex items-center justify-between p-4 bg-neonblue/10 border-b border-neonblue/30">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neonblue to-electricblue flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <span className="font-semibold text-platinum">QuotaHit Professional</span>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-neonblue">$149/user/mo</span>
                <p className="text-xs text-silver">Coaching + CRM + AI models included</p>
              </div>
            </div>

            {/* Competitor rows */}
            {COMPARISON_ITEMS.map((item, idx) => (
              <div
                key={idx}
                className={cn(
                  "flex items-center justify-between p-4",
                  idx < COMPARISON_ITEMS.length - 1 && "border-b border-gunmetal"
                )}
              >
                <span className="text-silver">{item.label}</span>
                <div className="text-right">
                  <span className="text-sm font-medium text-mist">{item.price}</span>
                  <p className="text-xs text-mist/60">{item.note}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="text-center text-xs text-mist mt-4">
            Competitor pricing sourced from public data and industry reports (2026). Actual pricing may vary.
          </p>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 border-t border-gunmetal">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-platinum text-center mb-12">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {FAQ_ITEMS.map((faq, idx) => (
              <div
                key={idx}
                className="bg-onyx border border-gunmetal rounded-lg p-6"
              >
                <h3 className="text-lg font-semibold text-platinum mb-2">
                  {faq.q}
                </h3>
                <p className="text-sm text-silver leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-neonblue/10 via-electricblue/5 to-neonblue/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-platinum mb-4">
            Ready to hit quota every month?
          </h2>
          <p className="text-xl text-silver mb-8 max-w-2xl mx-auto">
            Join sales teams using QuotaHit to coach reps, manage pipeline, and close deals faster with AI.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup?plan=professional">
              <Button
                size="lg"
                className="bg-neonblue hover:bg-electricblue text-lg px-8"
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <a href="mailto:aiwithdhruv@gmail.com?subject=QuotaHit Demo Request">
              <Button
                size="lg"
                variant="outline"
                className="border-steel text-silver hover:text-platinum text-lg px-8"
              >
                Schedule Demo
              </Button>
            </a>
          </div>
          <p className="text-sm text-mist mt-6">
            14-day free trial. No credit card required. Cancel anytime.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gunmetal py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-gradient-to-br from-neonblue to-electricblue flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-silver">QuotaHit</span>
            </div>
            <p className="text-mist text-sm">
              &copy; 2026 QuotaHit. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
