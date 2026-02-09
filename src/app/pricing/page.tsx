"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Check,
  X,
  Zap,
  Crown,
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

const PRICING_PLANS = [
  {
    id: "free",
    name: "Free",
    description: "Try every tool — no credit card needed",
    icon: Zap,
    iconColor: "text-silver",
    iconBg: "bg-steel/20",
    monthlyPrice: 0,
    yearlyPrice: 0,
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
    yearlyPrice: 15,
    features: [
      { text: "Unlimited AI credits", included: true },
      { text: "Everything in Free", included: true },
      { text: "Voice practice with GPT-4o Realtime", included: true },
      { text: "Unlimited call analysis", included: true },
      { text: "PDF export reports", included: true },
      { text: "Custom practice personas", included: true },
      { text: "All AI models (GPT-4.1, Claude 4.5, Gemini, Kimi K2.5)", included: true },
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
    yearlyPrice: 39,
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
    yearlyPrice: null,
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
    a: "AI credits are used for each AI interaction -- practice sessions, objection handling, call analysis, and more. One credit equals one AI message or analysis. Free users get 5 credits per day, which resets daily. Pro and above get unlimited credits.",
  },
  {
    q: "How is this 10-50x cheaper than Gong or Chorus?",
    a: "Gong starts at $1,200/user/year and Chorus at $1,000/user/year, with mandatory annual contracts and minimum seat counts. Our Pro plan is $180/year -- giving you AI-powered coaching, voice practice, and call analysis at a fraction of the cost.",
  },
  {
    q: "Can I switch plans anytime?",
    a: "Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we prorate any billing differences. No lock-in contracts.",
  },
  {
    q: "What AI models are included?",
    a: "Free tier uses our optimized default model. Pro and above unlock all AI models including GPT-4.1, Claude 4.5, Gemini, and Kimi K2.5 -- so you can pick the best model for each task.",
  },
  {
    q: "Is there a free trial for paid plans?",
    a: "Yes! All paid plans include a 14-day free trial with full access to every feature. No credit card required to start.",
  },
  {
    q: "How does the Team plan work?",
    a: "The Team plan covers up to 5 users for $49/month. Each member gets their own account with shared resources like the objection library and call recordings. Managers get a dedicated analytics dashboard to track team progress.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept all major credit cards and PayPal. Enterprise customers can pay via wire transfer or invoice.",
  },
];

export default function PricingPage() {
  const [isYearly, setIsYearly] = useState(true);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleCheckout = async (planId: string, yearly: boolean) => {
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
        body: JSON.stringify({ planId, yearly }),
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
              <span className="text-xl font-bold text-platinum">AIwithDhruv</span>
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

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-12">
            <span
              className={cn(
                "text-lg",
                !isYearly ? "text-platinum font-medium" : "text-silver"
              )}
            >
              Monthly
            </span>
            <Switch
              checked={isYearly}
              onCheckedChange={setIsYearly}
              className="data-[state=checked]:bg-neonblue"
            />
            <span
              className={cn(
                "text-lg",
                isYearly ? "text-platinum font-medium" : "text-silver"
              )}
            >
              Yearly
            </span>
            {isYearly && (
              <Badge className="bg-automationgreen/20 text-automationgreen border-none animate-pulse">
                Save 20%
              </Badge>
            )}
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {PRICING_PLANS.map((plan) => {
              const Icon = plan.icon;
              const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
              const isEnterprise = plan.id === "enterprise";
              const isMailto = plan.ctaLink.startsWith("mailto:");

              return (
                <Card
                  key={plan.id}
                  className={cn(
                    "relative bg-onyx border-gunmetal transition-all duration-300 hover:border-steel hover:shadow-lg hover:shadow-neonblue/5",
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
                      {price !== null ? (
                        <div className="flex items-baseline gap-1">
                          <span className="text-4xl font-bold text-platinum">
                            ${price}
                          </span>
                          <span className="text-silver">/month</span>
                        </div>
                      ) : (
                        <div className="text-4xl font-bold text-platinum">
                          Custom
                        </div>
                      )}
                      {isYearly && price !== null && price > 0 && (
                        <p className="text-sm text-automationgreen mt-1">
                          Billed ${price * 12}/year
                        </p>
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
                        onClick={() => handleCheckout(plan.id, isYearly)}
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
                className="bg-onyx border border-gunmetal rounded-lg p-6"
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
            Join thousands of sales professionals already using AI Sales Coach
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
              <span className="text-silver">AIwithDhruv</span>
            </div>
            <p className="text-mist text-sm">
              &copy; 2026 AIwithDhruv. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
