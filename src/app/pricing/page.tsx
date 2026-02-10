"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Check,
  X,
  Zap,
  Rocket,
  Building2,
  Sparkles,
  ArrowRight,
  Users,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { getSupabaseClient } from "@/lib/supabase/client";

type BillingInterval = "monthly" | "quarterly" | "yearly";

const BILLING_OPTIONS: { id: BillingInterval; label: string; discount: number; badge: string | null }[] = [
  { id: "monthly", label: "Monthly", discount: 0, badge: null },
  { id: "quarterly", label: "Quarterly", discount: 10, badge: "Save 10%" },
  { id: "yearly", label: "Yearly", discount: 30, badge: "Save 30%" },
];

const PRICING_PLANS = [
  {
    id: "free",
    name: "Free",
    description: "Try every tool — no credit card needed",
    icon: Zap,
    iconColor: "text-silver",
    iconBg: "bg-steel/20",
    monthlyPrice: 0,
    features: [
      { text: "5 AI credits/day (enough to try everything)", included: true },
      { text: "All 12 sales tools", included: true },
      { text: "Text-only practice", included: true },
      { text: "Basic objection coaching", included: true },
      { text: "Session history (last 20)", included: true },
      { text: "Community support", included: true },
      { text: "Voice practice", included: false },
      { text: "Unlimited call analysis", included: false },
      { text: "PDF exports", included: false },
      { text: "Custom personas", included: false },
    ],
    cta: "Get Started Free",
    ctaLink: "/signup",
    popular: false,
  },
  {
    id: "pro",
    name: "Pro",
    description: "For individual sales professionals",
    icon: Rocket,
    iconColor: "text-neonblue",
    iconBg: "bg-neonblue/20",
    monthlyPrice: 19,
    features: [
      { text: "Unlimited AI credits", included: true },
      { text: "Everything in Free", included: true },
      { text: "Voice practice with GPT-4o Realtime", included: true },
      { text: "Unlimited call analysis", included: true },
      { text: "PDF export reports", included: true },
      { text: "Custom practice personas", included: true },
      { text: "All AI models (GPT-4o, Claude 4.6, Gemini, Kimi K2.5)", included: true },
      { text: "Priority support", included: true },
    ],
    cta: "Start Pro Trial",
    ctaLink: "/signup?plan=pro",
    popular: true,
  },
  {
    id: "team",
    name: "Team",
    description: "For sales teams up to 5 members",
    icon: Users,
    iconColor: "text-warningamber",
    iconBg: "bg-warningamber/20",
    monthlyPrice: 49,
    features: [
      { text: "Everything in Pro", included: true },
      { text: "Up to 5 team members", included: true },
      { text: "Team progress dashboard", included: true },
      { text: "Shared objection library", included: true },
      { text: "Shared call recordings", included: true },
      { text: "Manager analytics", included: true },
      { text: "Slack integration", included: true },
      { text: "Priority chat support", included: true },
    ],
    cta: "Start Team Trial",
    ctaLink: "/signup?plan=team",
    popular: false,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "For large sales organizations",
    icon: Building2,
    iconColor: "text-automationgreen",
    iconBg: "bg-automationgreen/20",
    monthlyPrice: null,
    features: [
      { text: "Everything in Team", included: true },
      { text: "Unlimited users", included: true },
      { text: "Custom AI model training", included: true },
      { text: "CRM integration (HubSpot/Salesforce)", included: true },
      { text: "SSO/SAML authentication", included: true },
      { text: "Dedicated success manager", included: true },
      { text: "Custom SLA", included: true },
      { text: "On-premise option", included: true },
    ],
    cta: "Contact Sales",
    ctaLink: "mailto:aiwithdhruv@gmail.com",
    popular: false,
  },
];

const FAQ_ITEMS = [
  {
    q: "What are AI credits?",
    a: "AI credits are used for each AI interaction — practice sessions, objection handling, call analysis, and more. One credit equals one AI message or analysis. Free users get 5 credits per day, which resets daily. Pro and above get unlimited credits.",
  },
  {
    q: "How is this 10-50x cheaper than Gong or Chorus?",
    a: "Gong starts at $1,200/user/year and Chorus at $1,000/user/year, with mandatory annual contracts and minimum seat counts. Our Pro plan is $160/year — giving you AI-powered coaching, voice practice, and call analysis at a fraction of the cost.",
  },
  {
    q: "Can I switch plans or billing intervals anytime?",
    a: "Yes! You can upgrade, downgrade, or switch between monthly, quarterly, and yearly billing at any time. Changes take effect immediately, and we prorate any billing differences. No lock-in contracts.",
  },
  {
    q: "What AI models are included?",
    a: "Free tier uses our optimized default model. Pro and above unlock all AI models including GPT-4o, Claude 4.6, Gemini, and Kimi K2.5 — so you can pick the best model for each task.",
  },
  {
    q: "Is there a free trial for paid plans?",
    a: "Yes! All paid plans include a 14-day free trial with full access to every feature. No credit card required to start.",
  },
  {
    q: "How does the Team plan work?",
    a: "The Team plan covers up to 5 users for $49/month (or less with quarterly/yearly billing). Each member gets their own account with shared resources like the objection library and call recordings. Managers get a dedicated analytics dashboard to track team progress.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept all major credit cards and PayPal. Enterprise customers can pay via wire transfer or invoice.",
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
    if (planId === "free" || planId === "enterprise") return;

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
            <div className="flex items-center gap-4">
              <Link href="/login">
                <Button variant="ghost" className="text-silver hover:text-platinum">
                  Sign In
                </Button>
              </Link>
              <Link href="/signup">
                <Button className="bg-neonblue hover:bg-electricblue">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge className="bg-neonblue/20 text-neonblue border-none mb-4">
            Simple, transparent pricing
          </Badge>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-platinum mb-4">
            Choose your plan
          </h1>
          <p className="text-lg sm:text-xl font-medium text-warningamber mb-6">
            10-50x cheaper than Gong, Dialpad, or Chorus
          </p>
          <p className="text-xl text-silver max-w-2xl mx-auto mb-10">
            Start free and scale as you grow. All paid plans include a 14-day trial.
            No credit card required.
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
      <section className="pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {PRICING_PLANS.map((plan) => {
              const Icon = plan.icon;
              const isEnterprise = plan.id === "enterprise";
              const isMailto = plan.ctaLink.startsWith("mailto:");
              const isFree = plan.monthlyPrice === 0 || plan.monthlyPrice === null;

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
                    "glow-card relative bg-onyx border-gunmetal transition-all duration-300 hover:border-steel hover:shadow-lg hover:shadow-neonblue/5",
                    plan.popular && "border-neonblue ring-2 ring-neonblue/20"
                  )}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
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
                    <p className="text-sm text-mist">{plan.description}</p>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    {/* Pricing */}
                    <div>
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
                            <span className="text-silver">/mo</span>
                          </div>
                          {billingInterval === "quarterly" && billingTotal !== null && (
                            <p className="text-sm text-neonblue mt-1 font-medium">
                              Billed ${billingTotal.toFixed(2)} every 3 months
                            </p>
                          )}
                          {billingInterval === "yearly" && billingTotal !== null && (
                            <p className="text-sm text-neonblue mt-1 font-medium">
                              Billed ${billingTotal.toFixed(2)}/year
                            </p>
                          )}
                          {yearlySavings > 0 && (
                            <p className="text-xs text-automationgreen mt-1 font-semibold">
                              You save ${yearlySavings.toFixed(2)}/year
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="text-4xl font-bold text-platinum">
                          Custom
                        </div>
                      )}
                      {plan.id === "team" && (
                        <p className="text-xs text-mist mt-1">
                          For up to 5 users
                        </p>
                      )}
                    </div>

                    {/* CTA Button */}
                    {isMailto ? (
                      <a href={plan.ctaLink}>
                        <Button
                          className={cn(
                            "w-full",
                            "bg-automationgreen hover:bg-automationgreen/90"
                          )}
                        >
                          {plan.cta}
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </a>
                    ) : plan.id === "pro" || plan.id === "team" ? (
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
                    ) : (
                      <Link href={plan.ctaLink}>
                        <Button
                          className={cn(
                            "w-full",
                            "bg-steel hover:bg-gunmetal"
                          )}
                        >
                          {plan.cta}
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </Link>
                    )}

                    {/* Features List */}
                    <ul className="space-y-3">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          {feature.included ? (
                            <Check className="w-5 h-5 text-automationgreen flex-shrink-0 mt-0.5" />
                          ) : (
                            <X className="w-5 h-5 text-mist flex-shrink-0 mt-0.5" />
                          )}
                          <span
                            className={cn(
                              "text-sm",
                              feature.included ? "text-silver" : "text-mist"
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
                  ? "Quarterly billing saves you 10% — that's $22.80/year on Pro!"
                  : "Yearly billing saves you 30% — that's $68.40/year on Pro!"}
              </p>
              <p className="text-sm text-silver mt-1">
                {billingInterval === "quarterly"
                  ? "Pay every 3 months at a lower rate. Switch to yearly anytime for even more savings."
                  : "Best value! Lock in the lowest price for a full year. Cancel anytime."}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 border-t border-gunmetal">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-platinum text-center mb-12">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {FAQ_ITEMS.map((faq, idx) => (
              <div
                key={idx}
                className="glow-card bg-onyx border border-gunmetal rounded-lg p-6"
              >
                <h3 className="text-lg font-semibold text-platinum mb-2">
                  {faq.q}
                </h3>
                <p className="text-silver">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-neonblue/10 via-electricblue/5 to-neonblue/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-platinum mb-6">
            Ready to close more deals?
          </h2>
          <p className="text-xl text-silver mb-8">
            Join thousands of sales professionals already using QuotaHit
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup">
              <Button
                size="lg"
                className="bg-neonblue hover:bg-electricblue text-lg px-8"
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <a href="mailto:aiwithdhruv@gmail.com">
              <Button
                size="lg"
                variant="outline"
                className="border-steel text-silver hover:text-platinum text-lg px-8"
              >
                Schedule Demo
              </Button>
            </a>
          </div>
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
