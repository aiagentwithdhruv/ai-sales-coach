"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MobileNav } from "@/components/ui/mobile-nav";
import {
  Check,
  Sparkles,
  ArrowRight,
  Loader2,
  PhoneCall,
  Brain,
  BarChart3,
  Mail,
  TrendingUp,
  Gift,
  Key,
  Package,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { getSupabaseClient } from "@/lib/supabase/client";
import {
  MODULES,
  ALL_MODULE_SLUGS,
  BUNDLE,
  BILLING_DISCOUNTS,
  getDiscountedPrice,
  getBillingTotal,
  getYearlySavings,
  calculateModulesPrice,
  isBundleCheaper,
  type ModuleSlug,
  type BillingInterval,
  FREE_LIMITS,
  TRIAL_DURATION_DAYS,
} from "@/lib/pricing";

// ─── Icon Map ─────────────────────────────────────────────────────────────────

const MODULE_ICONS: Record<ModuleSlug, typeof Brain> = {
  coaching: Brain,
  crm: BarChart3,
  calling: PhoneCall,
  followups: Mail,
  analytics: TrendingUp,
};

const MODULE_COLORS: Record<ModuleSlug, { text: string; bg: string; glow: string; border: string; shadow: string }> = {
  coaching: { text: "text-neonblue", bg: "bg-neonblue/20", glow: "rgba(0,153,255,0.15)", border: "rgba(0,153,255,0.4)", shadow: "0 0 30px rgba(0,153,255,0.08)" },
  crm: { text: "text-warningamber", bg: "bg-warningamber/20", glow: "rgba(255,170,0,0.12)", border: "rgba(255,170,0,0.35)", shadow: "0 0 30px rgba(255,170,0,0.06)" },
  calling: { text: "text-automationgreen", bg: "bg-automationgreen/20", glow: "rgba(0,230,118,0.12)", border: "rgba(0,230,118,0.35)", shadow: "0 0 30px rgba(0,230,118,0.06)" },
  followups: { text: "text-purple-400", bg: "bg-purple-500/20", glow: "rgba(168,85,247,0.12)", border: "rgba(168,85,247,0.35)", shadow: "0 0 30px rgba(168,85,247,0.06)" },
  analytics: { text: "text-cyan-400", bg: "bg-cyan-500/20", glow: "rgba(34,211,238,0.12)", border: "rgba(34,211,238,0.35)", shadow: "0 0 30px rgba(34,211,238,0.06)" },
};

// ─── Billing Options ──────────────────────────────────────────────────────────

const BILLING_OPTIONS: { id: BillingInterval; label: string; badge: string | null }[] = [
  { id: "monthly", label: "Monthly", badge: null },
  { id: "quarterly", label: "Quarterly", badge: BILLING_DISCOUNTS.quarterly.badge },
  { id: "yearly", label: "Yearly", badge: BILLING_DISCOUNTS.yearly.badge },
];

// ─── Free Tier Display ────────────────────────────────────────────────────────

const FREE_TIER_ITEMS = [
  { label: "AI coaching sessions", limit: FREE_LIMITS.coaching_sessions, unit: "/month" },
  { label: "Contacts", limit: FREE_LIMITS.contacts_created, unit: " total" },
  { label: "AI calls", limit: FREE_LIMITS.ai_calls_made, unit: "/month" },
  { label: "Follow-ups sent", limit: FREE_LIMITS.followups_sent, unit: "/month" },
  { label: "Analyses run", limit: FREE_LIMITS.analyses_run, unit: "/month" },
];

// ─── Competitor Comparison ────────────────────────────────────────────────────

const COMPARISON_ITEMS = [
  { label: "Gong.io", price: "$108-250/user/mo", note: "Plus $5K-50K platform fee" },
  { label: "Salesloft", price: "$140-220/user/mo", note: "Annual contract required" },
  { label: "Orum", price: "$250/user/mo", note: "3-seat minimum" },
  { label: "Nooks", price: "$200-417/user/mo", note: "Annual contract required" },
  { label: "Outreach", price: "$100-400/user/mo", note: "Plus setup fees" },
];

// ─── FAQ ──────────────────────────────────────────────────────────────────────

const FAQ_ITEMS = [
  {
    q: "What are modules?",
    a: "Modules are individual feature packages you can mix and match. Instead of paying for an all-or-nothing plan, pick only the tools you need -- AI Coaching, CRM, Calling, Follow-Ups, or Analytics -- and pay for each separately. Or grab the All-in-One Bundle for the best price.",
  },
  {
    q: "What's included in the free tier?",
    a: `The free tier gives you access to every module with usage limits: ${FREE_LIMITS.coaching_sessions} coaching sessions/month, ${FREE_LIMITS.contacts_created} contacts, ${FREE_LIMITS.ai_calls_made} AI calls/month, ${FREE_LIMITS.followups_sent} follow-ups/month, and ${FREE_LIMITS.analyses_run} analyses/month. It's free forever with no credit card required.`,
  },
  {
    q: "What is BYOAPI?",
    a: "BYOAPI stands for Bring Your Own API Keys. You provide your own AI provider keys (OpenAI, Anthropic, etc.) and connect them in settings. We handle all the infrastructure, orchestration, and tooling -- but you pay the AI providers directly at their rates. No markup from us.",
  },
  {
    q: "Do I need all modules?",
    a: "Not at all. Each module works independently. You can start with just AI Coaching and add CRM or Calling later. If you want three or more modules, the All-in-One Bundle is usually cheaper.",
  },
  {
    q: "Can I switch between module and bundle?",
    a: "Yes. You can switch from individual modules to the bundle (or vice versa) at any time. Changes take effect immediately and any billing differences are prorated.",
  },
  {
    q: `What happens after the ${TRIAL_DURATION_DAYS}-day trial?`,
    a: `After your ${TRIAL_DURATION_DAYS}-day trial ends, you'll automatically move to the free tier with usage limits. No charge unless you subscribe to a paid module or bundle. You keep all your data.`,
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept all major credit cards via Stripe. Enterprise customers can pay via wire transfer, ACH, or invoice with NET-30 terms.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Absolutely. No lock-in contracts. Cancel your subscription anytime and you'll retain access until the end of your current billing period. You can always come back to the free tier.",
  },
];

// ─── Page Component ───────────────────────────────────────────────────────────

export default function PricingPage() {
  const [billingInterval, setBillingInterval] = useState<BillingInterval>("monthly");
  const [selectedModules, setSelectedModules] = useState<ModuleSlug[]>([]);
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  // ─── Module selection helpers ──────────────────────────────────────────────

  const toggleModule = (slug: ModuleSlug) => {
    setSelectedModules((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  const isModuleSelected = (slug: ModuleSlug) => selectedModules.includes(slug);

  // ─── Price calculations ────────────────────────────────────────────────────

  const selectedTotal = selectedModules.length > 0
    ? calculateModulesPrice(selectedModules, billingInterval)
    : 0;

  const bundleDiscounted = getDiscountedPrice(BUNDLE.monthlyPrice, billingInterval);
  const bundleSuggested = selectedModules.length >= 3 && isBundleCheaper(selectedModules);
  const bundleSavingsVsSelected = bundleSuggested
    ? Math.round(selectedTotal - bundleDiscounted)
    : 0;

  // ─── Checkout handler ─────────────────────────────────────────────────────

  const handleCheckout = async (type: "modules" | "bundle") => {
    setLoadingCheckout(true);
    try {
      const supabase = getSupabaseClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        window.location.href = "/login?redirect=/pricing";
        return;
      }

      const body =
        type === "bundle"
          ? { bundle: true, interval: billingInterval }
          : { modules: selectedModules, interval: billingInterval };

      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(body),
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
      setLoadingCheckout(false);
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────

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
            Module-based pricing
          </Badge>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-platinum mb-4">
            Simple, module-based pricing
          </h1>
          <p className="text-xl text-silver max-w-3xl mx-auto mb-4">
            Pick what you need. Bring your own AI keys. No hidden costs.
          </p>
          <p className="text-lg text-mist max-w-2xl mx-auto mb-10">
            {TRIAL_DURATION_DAYS}-day trial with full access. No credit card required.
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

      {/* Free Tier Card */}
      <section className="pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="bg-onyx border-gunmetal glow-card">
            <CardContent className="p-6 sm:p-8">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-automationgreen/20 flex items-center justify-center">
                      <Gift className="w-5 h-5 text-automationgreen" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-platinum">Free Forever</h2>
                      <p className="text-sm text-silver">
                        Access every module with usage limits
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-4">
                    {FREE_TIER_ITEMS.map((item) => (
                      <div
                        key={item.label}
                        className="bg-graphite/50 border border-gunmetal rounded-lg p-3 text-center"
                      >
                        <p className="text-xl font-bold text-platinum">
                          {item.limit}
                        </p>
                        <p className="text-xs text-mist mt-0.5">
                          {item.label}
                          {item.unit}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 inline-flex items-center gap-2 bg-neonblue/10 border border-neonblue/20 rounded-lg px-3 py-1.5">
                    <Sparkles className="w-4 h-4 text-neonblue" />
                    <span className="text-sm text-neonblue font-medium">
                      {TRIAL_DURATION_DAYS}-day trial with full access to all paid features
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-center lg:items-end gap-3">
                  <div className="text-center lg:text-right">
                    <span className="text-4xl font-bold text-platinum">$0</span>
                    <span className="text-silver ml-1">/mo</span>
                  </div>
                  <Link href="/signup">
                    <Button className="bg-automationgreen hover:bg-automationgreen/90 px-8">
                      Get Started Free
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Module Cards */}
      <section className="pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-platinum mb-2">
              Pick your modules
            </h2>
            <p className="text-silver">
              Select individual modules or grab the bundle below
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
            {ALL_MODULE_SLUGS.map((slug) => {
              const mod = MODULES[slug];
              const Icon = MODULE_ICONS[slug];
              const colors = MODULE_COLORS[slug];
              const selected = isModuleSelected(slug);
              const discounted = getDiscountedPrice(mod.monthlyPrice, billingInterval);
              const showStrikethrough = billingInterval !== "monthly";

              return (
                <Card
                  key={slug}
                  onClick={() => toggleModule(slug)}
                  className={cn(
                    "relative bg-onyx border transition-all duration-300 cursor-pointer flex flex-col group/card",
                    selected
                      ? "border-neonblue ring-2 ring-neonblue/20 shadow-lg shadow-neonblue/10"
                      : "border-gunmetal hover:border-transparent"
                  )}
                  style={{
                    "--module-glow": colors.glow,
                    "--module-border": colors.border,
                    boxShadow: selected ? undefined : colors.shadow,
                    backgroundImage: selected ? undefined : `radial-gradient(ellipse at 50% 0%, ${colors.glow}, transparent 70%)`,
                  } as React.CSSProperties}
                >
                  {/* Top glow line */}
                  {!selected && (
                    <div
                      className="absolute top-0 left-0 right-0 h-[1px] opacity-60"
                      style={{ background: `linear-gradient(90deg, transparent, ${colors.border}, transparent)` }}
                    />
                  )}

                  {/* Selection indicator */}
                  <div
                    className={cn(
                      "absolute top-3 right-3 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all",
                      selected
                        ? "bg-neonblue border-neonblue"
                        : "border-steel bg-transparent"
                    )}
                  >
                    {selected && <Check className="w-4 h-4 text-white" />}
                  </div>

                  <CardHeader className="pb-3 pr-10">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center mb-3",
                        colors.bg
                      )}
                    >
                      <Icon className={cn("w-5 h-5", colors.text)} />
                    </div>
                    <CardTitle className="text-lg font-bold text-platinum">
                      {mod.name}
                    </CardTitle>
                    <p className="text-xs text-mist">{mod.description}</p>
                  </CardHeader>

                  <CardContent className="space-y-4 flex flex-col flex-1">
                    {/* Pricing */}
                    <div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-3xl font-bold text-platinum">
                          ${discounted % 1 === 0 ? discounted : discounted.toFixed(2)}
                        </span>
                        <span className="text-sm text-silver">/mo</span>
                      </div>
                      {showStrikethrough && (
                        <p className="text-sm text-mist mt-0.5">
                          <span className="line-through">${mod.monthlyPrice}/mo</span>
                        </p>
                      )}
                      <p className="text-xs text-mist/60 mt-0.5">
                        Was <span className="line-through">${mod.marketPrice}/mo</span>{" "}
                        elsewhere
                      </p>
                    </div>

                    {/* Features */}
                    <ul className="space-y-2 flex-1">
                      {mod.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-automationgreen flex-shrink-0 mt-0.5" />
                          <span className="text-xs text-silver">{feature}</span>
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

      {/* Bundle Card */}
      <section className="pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="relative bg-onyx border-2 border-neonblue glow-card-visible ring-2 ring-neonblue/20">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
              <Badge className="bg-neonblue text-white border-none shadow-lg shadow-neonblue/30 text-sm px-3 py-1">
                Best Value
              </Badge>
            </div>

            <CardContent className="p-6 sm:p-8">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8">
                {/* Left: info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-neonblue/20 flex items-center justify-center">
                      <Package className="w-5 h-5 text-neonblue" />
                    </div>
                    <h2 className="text-2xl font-bold text-platinum">
                      {BUNDLE.name}
                    </h2>
                  </div>
                  <p className="text-silver mb-6">{BUNDLE.description}</p>

                  {/* All features grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-1.5">
                    {ALL_MODULE_SLUGS.map((slug) => {
                      const mod = MODULES[slug];
                      const Icon = MODULE_ICONS[slug];
                      const colors = MODULE_COLORS[slug];
                      return (
                        <div key={slug}>
                          <div className="flex items-center gap-2 mt-3 mb-1.5">
                            <Icon className={cn("w-4 h-4", colors.text)} />
                            <span className="text-sm font-semibold text-platinum">
                              {mod.name}
                            </span>
                          </div>
                          {mod.features.map((f, i) => (
                            <div
                              key={i}
                              className="flex items-start gap-2 py-0.5"
                            >
                              <Check className="w-3 h-3 text-automationgreen flex-shrink-0 mt-0.5" />
                              <span className="text-xs text-silver">{f}</span>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right: price + CTA */}
                <div className="flex flex-col items-center lg:items-end gap-4 lg:min-w-[200px]">
                  <div className="text-center lg:text-right">
                    <p className="text-sm text-mist mb-1">
                      <span className="line-through">
                        ${BUNDLE.individualTotal}/mo
                      </span>
                      <span className="ml-2 text-automationgreen font-semibold">
                        Save {BUNDLE.savings}%
                      </span>
                    </p>
                    <div className="flex items-baseline gap-1.5 justify-center lg:justify-end">
                      <span className="text-4xl font-bold text-platinum">
                        ${getDiscountedPrice(BUNDLE.monthlyPrice, billingInterval) % 1 === 0
                          ? getDiscountedPrice(BUNDLE.monthlyPrice, billingInterval)
                          : getDiscountedPrice(BUNDLE.monthlyPrice, billingInterval).toFixed(2)}
                      </span>
                      <span className="text-silver">/mo</span>
                    </div>
                    {billingInterval !== "monthly" && (
                      <p className="text-xs text-mist mt-1">
                        Was ${BUNDLE.monthlyPrice}/mo at monthly rate
                      </p>
                    )}
                    {billingInterval !== "monthly" && (
                      <p className="text-xs text-automationgreen font-semibold mt-0.5">
                        Save ${getYearlySavings(BUNDLE.monthlyPrice, billingInterval).toFixed(0)}/year
                      </p>
                    )}
                  </div>
                  <Button
                    onClick={() => handleCheckout("bundle")}
                    disabled={loadingCheckout}
                    className="bg-neonblue hover:bg-electricblue px-8 w-full lg:w-auto"
                    size="lg"
                  >
                    {loadingCheckout ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        Get Bundle
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* BYOAPI Section */}
      <section className="py-20 border-t border-gunmetal">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <div className="w-14 h-14 rounded-2xl bg-warningamber/20 flex items-center justify-center mx-auto mb-4">
              <Key className="w-7 h-7 text-warningamber" />
            </div>
            <h2 className="text-3xl font-bold text-platinum mb-3">
              Bring Your Own API Keys
            </h2>
            <p className="text-lg text-silver max-w-2xl mx-auto">
              You provide AI keys (OpenAI, Anthropic). We handle infrastructure.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-onyx border border-gunmetal rounded-xl p-6 text-center">
              <div className="w-10 h-10 rounded-lg bg-neonblue/20 flex items-center justify-center mx-auto mb-3">
                <Key className="w-5 h-5 text-neonblue" />
              </div>
              <h3 className="text-lg font-semibold text-platinum mb-2">Your Keys</h3>
              <p className="text-sm text-silver">
                Connect your OpenAI, Anthropic, or Google API keys in settings. Use your own accounts.
              </p>
            </div>
            <div className="bg-onyx border border-gunmetal rounded-xl p-6 text-center">
              <div className="w-10 h-10 rounded-lg bg-automationgreen/20 flex items-center justify-center mx-auto mb-3">
                <Sparkles className="w-5 h-5 text-automationgreen" />
              </div>
              <h3 className="text-lg font-semibold text-platinum mb-2">Our Platform</h3>
              <p className="text-sm text-silver">
                We orchestrate AI calls, manage agents, handle CRM, analytics, and all infrastructure.
              </p>
            </div>
            <div className="bg-onyx border border-gunmetal rounded-xl p-6 text-center">
              <div className="w-10 h-10 rounded-lg bg-warningamber/20 flex items-center justify-center mx-auto mb-3">
                <Check className="w-5 h-5 text-warningamber" />
              </div>
              <h3 className="text-lg font-semibold text-platinum mb-2">No Markup</h3>
              <p className="text-sm text-silver">
                Zero markup on AI usage. You pay providers directly at their published rates.
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
              QuotaHit combines coaching, CRM, and calling -- replacing multiple tools at a fraction of the cost
            </p>
          </div>

          <div className="bg-onyx border border-gunmetal rounded-xl overflow-hidden">
            {/* QuotaHit row (highlighted) */}
            <div className="flex items-center justify-between p-4 bg-neonblue/10 border-b border-neonblue/30">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neonblue to-electricblue flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <span className="font-semibold text-platinum">QuotaHit Bundle</span>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-neonblue">
                  ${BUNDLE.monthlyPrice}/mo
                </span>
                <p className="text-xs text-silver">All 5 modules included</p>
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
                  <h3 className="text-lg font-semibold text-platinum pr-4">
                    {faq.q}
                  </h3>
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
            <Link href="/signup">
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
            {TRIAL_DURATION_DAYS}-day free trial. No credit card required. Cancel anytime.
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

      {/* Sticky Cart Bar */}
      {selectedModules.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-graphite/95 backdrop-blur-md border-t border-gunmetal shadow-2xl shadow-black/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16 sm:h-18 gap-4">
              {/* Left: selection info */}
              <div className="flex items-center gap-4 min-w-0">
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="w-8 h-8 rounded-lg bg-neonblue/20 flex items-center justify-center">
                    <span className="text-sm font-bold text-neonblue">
                      {selectedModules.length}
                    </span>
                  </div>
                  <span className="text-sm text-silver hidden sm:inline">
                    module{selectedModules.length !== 1 ? "s" : ""} selected
                  </span>
                </div>

                {/* Selected module pills */}
                <div className="hidden md:flex items-center gap-1.5 min-w-0 overflow-x-auto">
                  {selectedModules.map((slug) => {
                    const Icon = MODULE_ICONS[slug];
                    const colors = MODULE_COLORS[slug];
                    return (
                      <button
                        key={slug}
                        onClick={() => toggleModule(slug)}
                        className="flex items-center gap-1.5 bg-onyx border border-gunmetal rounded-full px-2.5 py-1 text-xs text-silver hover:border-red-500/50 hover:text-red-400 transition-colors flex-shrink-0 group"
                      >
                        <Icon className={cn("w-3 h-3", colors.text)} />
                        <span>{MODULES[slug].name}</span>
                        <X className="w-3 h-3 text-mist group-hover:text-red-400" />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right: price + actions */}
              <div className="flex items-center gap-4 flex-shrink-0">
                {/* Bundle suggestion */}
                {bundleSuggested && (
                  <button
                    onClick={() => handleCheckout("bundle")}
                    className="hidden lg:flex items-center gap-2 bg-automationgreen/10 border border-automationgreen/30 rounded-lg px-3 py-1.5 text-xs text-automationgreen hover:bg-automationgreen/20 transition-colors"
                  >
                    <Package className="w-3.5 h-3.5" />
                    <span>
                      Switch to bundle and save ${bundleSavingsVsSelected}/mo
                    </span>
                  </button>
                )}

                {/* Total price */}
                <div className="text-right">
                  <span className="text-xl sm:text-2xl font-bold text-platinum">
                    ${selectedTotal % 1 === 0 ? selectedTotal : selectedTotal.toFixed(2)}
                  </span>
                  <span className="text-sm text-silver">/mo</span>
                </div>

                {/* Subscribe button */}
                <Button
                  onClick={() => handleCheckout("modules")}
                  disabled={loadingCheckout}
                  className="bg-neonblue hover:bg-electricblue px-6"
                >
                  {loadingCheckout ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "Subscribe"
                  )}
                </Button>
              </div>
            </div>

            {/* Bundle suggestion on mobile when applicable */}
            {bundleSuggested && (
              <div className="lg:hidden pb-3 -mt-1">
                <button
                  onClick={() => handleCheckout("bundle")}
                  className="w-full flex items-center justify-center gap-2 bg-automationgreen/10 border border-automationgreen/30 rounded-lg px-3 py-2 text-xs text-automationgreen hover:bg-automationgreen/20 transition-colors"
                >
                  <Package className="w-3.5 h-3.5" />
                  <span>
                    Switch to bundle and save ${bundleSavingsVsSelected}/mo
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
