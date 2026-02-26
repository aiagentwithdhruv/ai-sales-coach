"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MobileNav } from "@/components/ui/mobile-nav";
import {
  Check,
  Sparkles,
  ArrowRight,
  Phone,
  Users,
  Zap,
  Crown,
  ChevronDown,
  ChevronUp,
  Bot,
  Search,
  FileSearch,
  MessageSquare,
  PhoneCall,
  FileText,
  UserCheck,
  Mail,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  TIERS,
  ALL_TIER_SLUGS,
  AGENT_DESCRIPTIONS,
  BILLING_DISCOUNTS,
  TRIAL_DURATION_DAYS,
  getDiscountedPrice,
  getYearlySavings,
  type TierSlug,
  type BillingInterval,
} from "@/lib/pricing";
import { SalesAgentWidget } from "@/components/agent/SalesAgentWidget";

// ─── Tier visual config ──────────────────────────────────────────────────────

const TIER_STYLE: Record<TierSlug, {
  icon: typeof Users;
  gradient: string;
  border: string;
  glow: string;
  badge?: string;
}> = {
  starter: {
    icon: Zap,
    gradient: "from-blue-500/20 to-cyan-500/10",
    border: "border-gunmetal/60",
    glow: "",
  },
  growth: {
    icon: Users,
    gradient: "from-neonblue/20 to-electricblue/10",
    border: "border-neonblue ring-1 ring-neonblue/20",
    glow: "shadow-lg shadow-neonblue/10",
    badge: "Most Popular",
  },
  enterprise: {
    icon: Crown,
    gradient: "from-purple-500/20 to-violet-500/10",
    border: "border-gunmetal/60",
    glow: "",
  },
};

// ─── Agent Icons ─────────────────────────────────────────────────────────────

const AGENT_ICONS: Record<string, typeof Bot> = {
  Scout: Search,
  Researcher: FileSearch,
  Qualifier: UserCheck,
  Outreach: MessageSquare,
  Caller: PhoneCall,
  Closer: FileText,
  Ops: Mail,
};

// ─── Billing Options ─────────────────────────────────────────────────────────

const BILLING_OPTIONS: { id: BillingInterval; label: string; badge: string | null }[] = [
  { id: "monthly", label: "Monthly", badge: null },
  { id: "quarterly", label: "Quarterly", badge: BILLING_DISCOUNTS.quarterly.badge },
  { id: "yearly", label: "Yearly", badge: BILLING_DISCOUNTS.yearly.badge },
];

// ─── Competitor Comparison ───────────────────────────────────────────────────

const COMPARISON_ITEMS = [
  { label: "Hiring 1 SDR", price: "$5,000+/mo", note: "Salary + benefits + training" },
  { label: "11x.ai (AI SDR)", price: "$800-1,500/mo", note: "Prospecting only" },
  { label: "Artisan (AI BDR)", price: "$2,000+/mo", note: "Outreach only" },
  { label: "Apollo + Outreach + Gong", price: "$500-1,000+/mo", note: "3 separate tools" },
  { label: "Clay (Enrichment)", price: "$149-800/mo", note: "Data enrichment only" },
];

// ─── FAQ ─────────────────────────────────────────────────────────────────────

const FAQ_ITEMS = [
  {
    q: "What are the 7 AI agents?",
    a: "Scout finds leads, Researcher enriches them, Qualifier scores them with BANT+ conversations, Outreach runs multi-channel sequences, Caller makes autonomous phone calls, Closer generates proposals and collects payments, and Ops handles post-sale onboarding. Each agent works autonomously or in coordination.",
  },
  {
    q: "What's the difference between Starter and Growth?",
    a: "Starter gives you 3 agents (Scout, Researcher, Qualifier) — great for lead discovery and scoring. Growth unlocks all 7 agents including Outreach, Caller, Closer, and Ops — giving you a fully automated pipeline from lead to closed deal.",
  },
  {
    q: "What is BYOAPI?",
    a: "Bring Your Own API Keys. You connect your own OpenAI, Anthropic, or Google AI keys in settings. We handle all infrastructure and orchestration — you pay AI providers directly at their rates. Zero markup from us.",
  },
  {
    q: "How does QuotaHit replace hiring SDRs?",
    a: "A single SDR costs $5,000+/month in salary, benefits, and training — and works 8 hours a day. QuotaHit's 7 AI agents work 24/7, handle every channel, and get smarter over time with self-improving templates. Starting at $297/month, it's 10-17x cheaper.",
  },
  {
    q: "Can I start with Starter and upgrade later?",
    a: "Absolutely. Start with Starter to build your lead pipeline, then upgrade to Growth when you're ready to automate outreach and calling. Upgrades are instant with no data loss.",
  },
  {
    q: `What happens after the ${TRIAL_DURATION_DAYS}-day trial?`,
    a: `After your ${TRIAL_DURATION_DAYS}-day free trial, you choose a plan. No automatic charges — you pick the tier that fits. If you don't subscribe, you'll move to a limited free tier. You keep all your data.`,
  },
  {
    q: "Do you offer annual discounts?",
    a: `Yes. Quarterly billing saves 10%, and annual billing saves 20%. For example, Growth drops from $697/mo to $558/mo on an annual plan — that's over $1,600 saved per year.`,
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. No lock-in contracts. Cancel anytime and retain access until the end of your billing period.",
  },
];

// ─── Page Component ──────────────────────────────────────────────────────────

export default function PricingPage() {
  const [billingInterval, setBillingInterval] = useState<BillingInterval>("monthly");
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-obsidian">
      {/* FAQ Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: FAQ_ITEMS.map((faq) => ({
              "@type": "Question",
              name: faq.q,
              acceptedAnswer: { "@type": "Answer", text: faq.a },
            })),
          }),
        }}
      />

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
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/" className="text-sm text-silver hover:text-platinum transition-colors">Home</Link>
              <Link href="/features" className="text-sm text-silver hover:text-platinum transition-colors">Features</Link>
              <Link href="/pricing" className="text-sm text-neonblue font-medium">Pricing</Link>
              <Link href="/blog" className="text-sm text-silver hover:text-platinum transition-colors">Blog</Link>
              <Link href="/login" className="text-sm text-silver hover:text-platinum transition-colors">Login</Link>
            </nav>
            <div className="flex items-center gap-2">
              <a
                href="https://wa.me/919827853940?text=Hi%20Dhruv%2C%20I%27m%20interested%20in%20QuotaHit"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden lg:flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/30 transition-all text-sm font-medium"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                WhatsApp
              </a>
              <a
                href="tel:+919827853940"
                className="hidden lg:flex items-center gap-1.5 px-3 py-2 rounded-lg bg-neonblue/10 border border-neonblue/20 text-neonblue hover:bg-neonblue/20 hover:border-neonblue/30 transition-all text-sm font-medium"
              >
                <Phone className="h-3.5 w-3.5" />
                Call
              </a>
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
                  { href: "/blog", label: "Blog" },
                  { href: "/login", label: "Login" },
                  { href: "/signup", label: "Sign Up" },
                ]}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-16 sm:pt-20 pb-10 sm:pb-14">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge className="bg-neonblue/10 text-neonblue border border-neonblue/20 mb-5 text-xs tracking-wide uppercase">
            Simple, transparent pricing
          </Badge>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-platinum mb-4 tracking-tight leading-tight">
            Hire an AI Sales Team<br className="hidden sm:block" /> for less than one SDR
          </h1>
          <p className="text-lg sm:text-xl text-silver max-w-2xl mx-auto mb-3">
            7 AI agents that find, qualify, reach, call, close, and onboard your customers.
            Starting at <span className="text-platinum font-semibold">$297/month</span>.
          </p>
          <p className="text-sm text-mist max-w-xl mx-auto mb-10">
            {TRIAL_DURATION_DAYS}-day free trial. No credit card required. Cancel anytime.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center bg-onyx/80 border border-gunmetal rounded-lg p-1">
            {BILLING_OPTIONS.map((option) => (
              <button
                key={option.id}
                onClick={() => setBillingInterval(option.id)}
                className={cn(
                  "relative px-4 py-2 rounded-md text-sm font-medium transition-all duration-200",
                  billingInterval === option.id
                    ? "bg-neonblue text-white shadow-md shadow-neonblue/20"
                    : "text-silver hover:text-platinum"
                )}
              >
                {option.label}
                {option.badge && billingInterval === option.id && (
                  <span className="absolute -top-2.5 -right-2 bg-automationgreen text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap">
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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-5">
            {ALL_TIER_SLUGS.map((slug) => {
              const tier = TIERS[slug];
              const style = TIER_STYLE[slug];
              const Icon = style.icon;
              const discounted = getDiscountedPrice(tier.monthlyPrice, billingInterval);
              const showDiscount = billingInterval !== "monthly";

              return (
                <Card
                  key={slug}
                  className={cn(
                    "relative bg-onyx/90 flex flex-col transition-all duration-200",
                    style.border,
                    style.glow,
                    tier.popular && "lg:-mt-4 lg:mb-0 lg:pb-4"
                  )}
                >
                  {/* Popular badge */}
                  {style.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                      <Badge className="bg-neonblue text-white border-none shadow-lg shadow-neonblue/30 text-xs px-3 py-1">
                        {style.badge}
                      </Badge>
                    </div>
                  )}

                  <CardContent className="p-6 sm:p-8 flex flex-col flex-1">
                    {/* Tier header */}
                    <div className="mb-6">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br", style.gradient)}>
                          <Icon className="w-5 h-5 text-platinum" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-platinum">{tier.name}</h3>
                        </div>
                      </div>
                      <p className="text-sm text-mist leading-relaxed">{tier.tagline}</p>
                    </div>

                    {/* Price */}
                    <div className="mb-6">
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold text-platinum">
                          ${discounted % 1 === 0 ? discounted : discounted.toFixed(0)}
                        </span>
                        <span className="text-silver">/mo</span>
                      </div>
                      {showDiscount && (
                        <div className="mt-1 space-y-0.5">
                          <p className="text-xs text-mist">
                            <span className="line-through">${tier.monthlyPrice}/mo</span>
                          </p>
                          <p className="text-xs text-automationgreen font-medium">
                            Save ${getYearlySavings(tier.monthlyPrice, billingInterval).toFixed(0)}/year
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Agents */}
                    <div className="mb-5">
                      <p className="text-xs text-mist uppercase tracking-wider font-medium mb-2">
                        {tier.agentCount} AI Agent{tier.agentCount > 1 ? "s" : ""} Included
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {tier.agents.map((agent) => {
                          const AgentIcon = AGENT_ICONS[agent] || Bot;
                          return (
                            <div
                              key={agent}
                              className="flex items-center gap-1.5 bg-graphite/60 border border-gunmetal/50 rounded-md px-2 py-1"
                              title={AGENT_DESCRIPTIONS[agent]}
                            >
                              <AgentIcon className="w-3 h-3 text-neonblue" />
                              <span className="text-[11px] text-silver font-medium">{agent}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Features */}
                    <ul className="space-y-2.5 flex-1 mb-6">
                      {tier.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-automationgreen flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-silver leading-snug">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA */}
                    {slug === "enterprise" ? (
                      <a href="mailto:aiwithdhruv@gmail.com?subject=QuotaHit Enterprise Inquiry">
                        <Button
                          className="w-full border-steel text-silver hover:text-platinum hover:bg-graphite"
                          variant="outline"
                          size="lg"
                        >
                          {tier.cta}
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </a>
                    ) : (
                      <Link href="/signup">
                        <Button
                          className={cn(
                            "w-full",
                            tier.popular
                              ? "bg-neonblue hover:bg-electricblue"
                              : "bg-graphite hover:bg-gunmetal border border-gunmetal text-platinum"
                          )}
                          size="lg"
                        >
                          {tier.cta}
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </Link>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* ROI Comparison */}
      <section className="py-20 border-t border-gunmetal">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-platinum mb-3">
              10x cheaper than hiring. 10x more productive.
            </h2>
            <p className="text-lg text-silver max-w-2xl mx-auto">
              One SDR costs $5,000+/month and works 8 hours. QuotaHit runs 24/7, handles every channel, and never needs training.
            </p>
          </div>

          <div className="bg-onyx border border-gunmetal rounded-xl overflow-hidden">
            {/* QuotaHit row */}
            <div className="flex items-center justify-between p-5 bg-neonblue/10 border-b border-neonblue/30">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-neonblue to-electricblue flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <span className="font-semibold text-platinum">QuotaHit Growth</span>
                  <p className="text-xs text-silver">7 AI agents, every channel</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xl font-bold text-neonblue">$697/mo</span>
              </div>
            </div>

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
            Competitor pricing sourced from public data (2026). Actual pricing may vary.
          </p>
        </div>
      </section>

      {/* Agent Breakdown */}
      <section className="py-20 border-t border-gunmetal">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-platinum mb-3">
              7 AI agents. One platform.
            </h2>
            <p className="text-lg text-silver">
              Each agent handles a specific stage of your sales process autonomously.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(AGENT_DESCRIPTIONS).map(([name, desc]) => {
              const AgentIcon = AGENT_ICONS[name] || Bot;
              const isStarterAgent = TIERS.starter.agents.includes(name);
              return (
                <div
                  key={name}
                  className="bg-onyx border border-gunmetal rounded-xl p-5 group hover:border-gunmetal/80 transition-colors"
                >
                  <div className="flex items-center gap-2.5 mb-2.5">
                    <div className="w-8 h-8 rounded-lg bg-neonblue/15 flex items-center justify-center">
                      <AgentIcon className="w-4 h-4 text-neonblue" />
                    </div>
                    <h3 className="text-base font-semibold text-platinum">{name}</h3>
                  </div>
                  <p className="text-sm text-silver leading-relaxed mb-2">{desc}</p>
                  <span className={cn(
                    "text-[10px] font-medium uppercase tracking-wider",
                    isStarterAgent ? "text-automationgreen" : "text-mist"
                  )}>
                    {isStarterAgent ? "All plans" : "Growth & Enterprise"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* BYOAPI Section */}
      <section className="py-20 border-t border-gunmetal">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-onyx border border-gunmetal rounded-2xl p-8 sm:p-10">
            <div className="flex flex-col sm:flex-row items-start gap-6">
              <div className="w-14 h-14 rounded-2xl bg-warningamber/15 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-7 h-7 text-warningamber" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-platinum mb-2">
                  Bring Your Own API Keys
                </h2>
                <p className="text-silver mb-4">
                  You provide AI keys (OpenAI, Anthropic, Google). We handle all the infrastructure, orchestration, and agent management.
                </p>
                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center gap-2 text-sm text-silver">
                    <Check className="w-4 h-4 text-automationgreen" />
                    Zero markup on AI usage
                  </div>
                  <div className="flex items-center gap-2 text-sm text-silver">
                    <Check className="w-4 h-4 text-automationgreen" />
                    Your keys, your accounts
                  </div>
                  <div className="flex items-center gap-2 text-sm text-silver">
                    <Check className="w-4 h-4 text-automationgreen" />
                    Full cost transparency
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 border-t border-gunmetal">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-platinum text-center mb-12">
            Frequently Asked Questions
          </h2>
          <div className="space-y-3">
            {FAQ_ITEMS.map((faq, idx) => (
              <div
                key={idx}
                className="bg-onyx border border-gunmetal rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between p-5 text-left"
                >
                  <h3 className="text-lg font-semibold text-platinum pr-4">{faq.q}</h3>
                  {expandedFaq === idx ? (
                    <ChevronUp className="w-5 h-5 text-mist flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-mist flex-shrink-0" />
                  )}
                </button>
                {expandedFaq === idx && (
                  <div className="px-5 pb-5 -mt-1">
                    <p className="text-sm text-silver leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-neonblue/10 via-electricblue/5 to-neonblue/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-platinum mb-4">
            Ready to replace your SDR team?
          </h2>
          <p className="text-xl text-silver mb-8 max-w-2xl mx-auto">
            7 AI agents. Every channel. From lead to payment. Set up in 5 minutes.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup">
              <Button size="lg" className="bg-neonblue hover:bg-electricblue text-lg px-8">
                Start {TRIAL_DURATION_DAYS}-Day Free Trial
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <a href="mailto:aiwithdhruv@gmail.com?subject=QuotaHit Demo Request">
              <Button size="lg" variant="outline" className="border-steel text-silver hover:text-platinum text-lg px-8">
                Talk to Founder
              </Button>
            </a>
          </div>
          <p className="text-sm text-mist mt-6">
            No credit card required. Cancel anytime.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gunmetal py-10 bg-obsidian">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-gradient-to-br from-neonblue to-electricblue flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-silver font-semibold">QuotaHit</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-6">
              <Link href="/" className="text-sm text-mist hover:text-silver transition-colors">Home</Link>
              <Link href="/features" className="text-sm text-mist hover:text-silver transition-colors">AI Agents</Link>
              <Link href="/blog" className="text-sm text-mist hover:text-silver transition-colors">Blog</Link>
              <Link href="/login" className="text-sm text-mist hover:text-silver transition-colors">Login</Link>
            </div>
          </div>
          <div className="border-t border-gunmetal/50" />
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center justify-center gap-5">
              <a href="tel:+919827853940" className="flex items-center gap-1.5 text-sm text-silver hover:text-neonblue transition-colors">
                <Phone className="w-3.5 h-3.5 text-neonblue" />
                +91 98278 53940
              </a>
              <a href="mailto:aiwithdhruv@gmail.com" className="flex items-center gap-1.5 text-sm text-silver hover:text-neonblue transition-colors">
                <Mail className="w-3.5 h-3.5 text-neonblue" />
                aiwithdhruv@gmail.com
              </a>
            </div>
            <div className="flex items-center gap-4">
              <a href="https://youtube.com/@aiwithdhruv" target="_blank" rel="noopener noreferrer" className="text-mist hover:text-red-400 transition-colors" title="YouTube">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
              </a>
              <a href="https://instagram.com/aiwithdhruv" target="_blank" rel="noopener noreferrer" className="text-mist hover:text-pink-400 transition-colors" title="Instagram">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
              </a>
              <a href="https://linkedin.com/in/aiwithdhruv" target="_blank" rel="noopener noreferrer" className="text-mist hover:text-blue-400 transition-colors" title="LinkedIn">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              </a>
              <a href="https://x.com/aiwithdhruv" target="_blank" rel="noopener noreferrer" className="text-mist hover:text-white transition-colors" title="X (Twitter)">
                <svg className="w-4.5 h-4.5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
            </div>
            <p className="text-mist text-sm">&copy; 2026 QuotaHit. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Sales Agent Widget */}
      <SalesAgentWidget pageContext="pricing" />
    </div>
  );
}
