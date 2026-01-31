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
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

const PRICING_PLANS = [
  {
    id: "free",
    name: "Free",
    description: "Perfect for trying out AI Sales Coach",
    icon: Zap,
    iconColor: "text-silver",
    iconBg: "bg-steel/20",
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: [
      { text: "50 AI credits/month", included: true },
      { text: "Basic objection handling", included: true },
      { text: "1 practice persona", included: true },
      { text: "Text-only practice", included: true },
      { text: "Community support", included: true },
      { text: "Voice practice", included: false },
      { text: "Call analysis", included: false },
      { text: "Playbook RAG", included: false },
      { text: "Team analytics", included: false },
    ],
    cta: "Get Started Free",
    popular: false,
  },
  {
    id: "pro",
    name: "Pro",
    description: "For individual sales professionals",
    icon: Rocket,
    iconColor: "text-neonblue",
    iconBg: "bg-neonblue/20",
    monthlyPrice: 29,
    yearlyPrice: 23, // ~20% off
    features: [
      { text: "500 AI credits/month", included: true },
      { text: "Advanced objection handling", included: true },
      { text: "All 4 practice personas", included: true },
      { text: "Voice practice mode", included: true },
      { text: "Call analysis (5/month)", included: true },
      { text: "Basic playbook RAG", included: true },
      { text: "Priority email support", included: true },
      { text: "Team analytics", included: false },
      { text: "Custom personas", included: false },
    ],
    cta: "Start Pro Trial",
    popular: true,
  },
  {
    id: "pro-plus",
    name: "Pro+",
    description: "For power users and small teams",
    icon: Crown,
    iconColor: "text-warningamber",
    iconBg: "bg-warningamber/20",
    monthlyPrice: 79,
    yearlyPrice: 63, // ~20% off
    features: [
      { text: "2,000 AI credits/month", included: true },
      { text: "Everything in Pro", included: true },
      { text: "Unlimited call analysis", included: true },
      { text: "Full playbook RAG", included: true },
      { text: "Custom practice personas", included: true },
      { text: "Deal review AI", included: true },
      { text: "Team analytics (up to 5)", included: true },
      { text: "Slack integration", included: true },
      { text: "Priority chat support", included: true },
    ],
    cta: "Upgrade to Pro+",
    popular: false,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "For large sales organizations",
    icon: Building2,
    iconColor: "text-automationgreen",
    iconBg: "bg-automationgreen/20",
    monthlyPrice: null, // Custom pricing
    yearlyPrice: null,
    features: [
      { text: "Unlimited AI credits", included: true },
      { text: "Everything in Pro+", included: true },
      { text: "Unlimited team members", included: true },
      { text: "Custom AI model training", included: true },
      { text: "CRM integrations", included: true },
      { text: "SSO/SAML authentication", included: true },
      { text: "Dedicated success manager", included: true },
      { text: "Custom SLA", included: true },
      { text: "On-premise option", included: true },
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

export default function PricingPage() {
  const [isYearly, setIsYearly] = useState(true);

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
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-platinum mb-6">
            Choose your plan
          </h1>
          <p className="text-xl text-silver max-w-2xl mx-auto mb-10">
            Start free and scale as you grow. All plans include a 14-day trial.
            No credit card required for free tier.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-12">
            <span className={cn("text-lg", !isYearly ? "text-platinum font-medium" : "text-silver")}>
              Monthly
            </span>
            <Switch
              checked={isYearly}
              onCheckedChange={setIsYearly}
              className="data-[state=checked]:bg-neonblue"
            />
            <span className={cn("text-lg", isYearly ? "text-platinum font-medium" : "text-silver")}>
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
                    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-4", plan.iconBg)}>
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
                    </div>

                    {/* CTA Button */}
                    <Button
                      className={cn(
                        "w-full",
                        plan.popular
                          ? "bg-neonblue hover:bg-electricblue"
                          : plan.id === "enterprise"
                          ? "bg-automationgreen hover:bg-automationgreen/90"
                          : "bg-steel hover:bg-gunmetal"
                      )}
                    >
                      {plan.cta}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>

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
            {[
              {
                q: "What are AI credits?",
                a: "AI credits are used for each AI interaction - practice sessions, objection handling, call analysis, etc. One credit = one AI message or analysis.",
              },
              {
                q: "Can I switch plans anytime?",
                a: "Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate any billing differences.",
              },
              {
                q: "Do unused credits roll over?",
                a: "Pro and Pro+ plans include credit rollover for up to 2 months. Free tier credits reset monthly.",
              },
              {
                q: "Is there a free trial for paid plans?",
                a: "Yes! All paid plans include a 14-day free trial with full access to all features. No credit card required to start.",
              },
              {
                q: "What payment methods do you accept?",
                a: "We accept all major credit cards, PayPal, and wire transfer for Enterprise plans.",
              },
            ].map((faq, idx) => (
              <div key={idx} className="bg-onyx border border-gunmetal rounded-lg p-6">
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
            Join 10,000+ sales professionals already using AI Sales Coach
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup">
              <Button size="lg" className="bg-neonblue hover:bg-electricblue text-lg px-8">
                Start Free Trial
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="border-steel text-silver hover:text-platinum text-lg px-8">
              Schedule Demo
            </Button>
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
              © 2026 AIwithDhruv. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
