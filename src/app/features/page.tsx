import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MobileNav } from "@/components/ui/mobile-nav";

export const metadata: Metadata = {
  title: "Features — 12 AI Sales Tools in One Platform",
  description:
    "Real-time voice practice, objection coaching, call analysis, custom personas, meeting notes, PDF export & more. Powered by GPT-4o, Claude 4.6, Kimi K2.5. See all 12 AI sales features.",
  keywords: [
    "AI sales tools", "sales voice practice", "objection handling AI", "call analysis software",
    "sales roleplay AI", "AI meeting notes", "sales persona practice", "sales coaching features",
  ],
  alternates: {
    canonical: "https://www.quotahit.com/features",
  },
  openGraph: {
    title: "QuotaHit Features — 12 AI-Powered Sales Tools",
    description: "Voice practice, objection coaching, call analysis, and 9 more AI sales tools. All in one app.",
    url: "https://www.quotahit.com/features",
  },
};
import {
  Sparkles,
  ArrowRight,
  MessageSquare,
  Mic,
  PenLine,
  Phone,
  Swords,
  Globe,
  FileText,
  BookOpen,
  UserSearch,
  Trophy,
  History,
  FileDown,
  Zap,
  Brain,
  Target,
  TrendingUp,
  Shield,
  Clock,
  Headphones,
  BarChart3,
} from "lucide-react";

const coreFeatures = [
  {
    icon: Mic,
    title: "Real-time Voice Practice",
    description:
      "Practice your sales pitch with AI using GPT-4o Realtime voice. Get scored on delivery, tone, objection handling, and closing ability. The closest thing to a live sales call — without the pressure.",
    color: "neonblue",
    tag: "Signature Feature",
  },
  {
    icon: MessageSquare,
    title: "Objection Coach",
    description:
      "Type any sales objection and get an instant, context-aware response. Backed by proven frameworks like LAER, Feel-Felt-Found, and more. Your always-on sales mentor.",
    color: "automationgreen",
    tag: "Most Used",
  },
  {
    icon: Phone,
    title: "Call Analysis & Scoring",
    description:
      "Upload any sales call recording and get a detailed AI analysis — talk ratio, filler words, objection handling score, engagement level, and personalized coaching tips.",
    color: "warningamber",
    tag: "Data-Driven",
  },
];

const allFeatures = [
  {
    icon: PenLine,
    title: "Text Practice",
    description:
      "Role-play complete sales calls via chat. AI plays the buyer with realistic objections, questions, and pushback. Get scored after each session.",
  },
  {
    icon: Swords,
    title: "12 Sales Tools",
    description:
      "Email crafter, pitch scorer, battle cards, discovery question generator, value proposition builder, competitor analysis, and more — all AI-powered.",
  },
  {
    icon: Globe,
    title: "Research Mode",
    description:
      "Perplexity-powered company and prospect research. Get real-time intel on any company before your call — news, financials, tech stack, and key decision makers.",
  },
  {
    icon: FileText,
    title: "Meeting Notes AI",
    description:
      "Paste or upload meeting transcripts. AI generates structured notes with action items, key decisions, follow-up tasks, and draft follow-up emails.",
  },
  {
    icon: BookOpen,
    title: "Objection Library",
    description:
      "Save, search, and categorize your best objection responses. Build a personal playbook of winning rebuttals organized by category and scenario.",
  },
  {
    icon: UserSearch,
    title: "Custom Personas",
    description:
      "Create buyer personas at any difficulty level to practice against — skeptical CFO, technical CTO, busy VP of Sales, or friendly champion.",
  },
  {
    icon: Trophy,
    title: "Progress & Achievements",
    description:
      "18 achievement badges, daily streaks, and detailed progress dashboards. Track your improvement over time with AI-generated insights.",
  },
  {
    icon: History,
    title: "Session History",
    description:
      "Review all past practice sessions, coaching conversations, and tool outputs. Never lose a great response or coaching insight again.",
  },
  {
    icon: FileDown,
    title: "PDF Export",
    description:
      "Export any research report, meeting notes, call analysis, or practice session as a professionally styled PDF for sharing or archiving.",
  },
];

const aiModels = [
  { name: "GPT-4o", provider: "OpenAI", use: "Voice practice, call analysis" },
  { name: "Claude 4.6", provider: "Anthropic", use: "Objection coaching, research" },
  { name: "Kimi K2.5", provider: "Moonshot", use: "Default chat, cost-efficient" },
  { name: "Gemini", provider: "Google", use: "Research, multi-modal tasks" },
];

const stats = [
  { value: "12", label: "AI Sales Tools" },
  { value: "4", label: "AI Models" },
  { value: "18", label: "Achievement Badges" },
  { value: "10-50x", label: "Cheaper than Gong" },
];

export default function FeaturesPage() {
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
            <div className="hidden md:flex items-center gap-8">
              <Link href="/#features" className="text-silver hover:text-platinum transition-colors">
                Overview
              </Link>
              <Link href="/features" className="text-neonblue font-medium">
                Features
              </Link>
              <Link href="/pricing" className="text-silver hover:text-platinum transition-colors">
                Pricing
              </Link>
              <Link href="/login" className="text-silver hover:text-platinum transition-colors">
                Login
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/login" className="hidden md:block">
                <Button variant="ghost" className="text-silver hover:text-platinum">
                  Sign In
                </Button>
              </Link>
              <Link href="/signup">
                <Button className="bg-neonblue hover:bg-electricblue text-white text-sm px-4">
                  Start Free
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
      <section className="relative py-20 sm:py-28 px-4 overflow-hidden">
        {/* Background effects */}
        <div className="absolute top-10 left-20 w-96 h-96 bg-neonblue/5 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-10 right-20 w-80 h-80 bg-automationgreen/5 rounded-full blur-3xl animate-float" style={{ animationDelay: "3s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-neonblue/3 rounded-full blur-[120px]" />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neonblue/10 border border-neonblue/20 mb-8 animate-fade-in-up">
            <Zap className="h-4 w-4 text-neonblue" />
            <span className="text-sm text-neonblue font-medium">
              Everything you need to close more deals
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-platinum mb-6 animate-fade-in-up leading-tight">
            AI-Powered Features
            <br />
            <span className="text-neonblue">Built for Sales Reps</span>
          </h1>

          <p className="text-lg sm:text-xl text-silver max-w-3xl mx-auto mb-12 animate-fade-in-up">
            Practice your pitch, handle any objection, analyze your calls, and track your progress —
            all powered by the latest AI models. One tool to replace five.
          </p>

          {/* Stats bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto animate-fade-in-up">
            {stats.map((stat) => (
              <div key={stat.label} className="glow-card p-4 rounded-xl bg-onyx border border-gunmetal text-center">
                <div className="text-2xl sm:text-3xl font-bold text-neonblue mb-1">
                  {stat.value}
                </div>
                <div className="text-xs sm:text-sm text-silver">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Features - Big Cards */}
      <section className="py-20 px-4 bg-graphite">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-platinum mb-4">
              3 Core <span className="text-neonblue">Superpowers</span>
            </h2>
            <p className="text-lg text-silver max-w-2xl mx-auto">
              The three features that make QuotaHit unlike any other sales tool.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {coreFeatures.map((feature) => {
              const colorClasses = {
                neonblue: {
                  tag: "bg-neonblue/20 text-neonblue",
                  icon: "bg-neonblue/15 text-neonblue group-hover:bg-neonblue/25",
                  border: "hover:border-neonblue/50",
                  glow: "group-hover:shadow-[0_0_40px_rgba(0,179,255,0.15)]",
                },
                automationgreen: {
                  tag: "bg-automationgreen/20 text-automationgreen",
                  icon: "bg-automationgreen/15 text-automationgreen group-hover:bg-automationgreen/25",
                  border: "hover:border-automationgreen/50",
                  glow: "group-hover:shadow-[0_0_40px_rgba(45,255,142,0.15)]",
                },
                warningamber: {
                  tag: "bg-warningamber/20 text-warningamber",
                  icon: "bg-warningamber/15 text-warningamber group-hover:bg-warningamber/25",
                  border: "hover:border-warningamber/50",
                  glow: "group-hover:shadow-[0_0_40px_rgba(255,176,32,0.15)]",
                },
              };
              const colors = colorClasses[feature.color as keyof typeof colorClasses];

              return (
                <div
                  key={feature.title}
                  className={`glow-card group relative p-8 rounded-2xl bg-onyx border border-gunmetal ${colors.border} ${colors.glow} transition-all duration-500 hover-lift`}
                >
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold mb-6 ${colors.tag}`}>
                    {feature.tag}
                  </div>
                  <div className={`w-14 h-14 rounded-xl ${colors.icon} flex items-center justify-center mb-5 transition-colors duration-300`}>
                    <feature.icon className="h-7 w-7" />
                  </div>
                  <h3 className="text-xl font-bold text-platinum mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-silver leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* All Features Grid */}
      <section className="py-20 px-4 bg-obsidian">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-platinum mb-4">
              Every Tool You <span className="text-automationgreen">Need</span>
            </h2>
            <p className="text-lg text-silver max-w-2xl mx-auto">
              12 AI-powered tools built into one platform. No integrations, no setup, no enterprise contracts.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {allFeatures.map((feature) => (
              <div
                key={feature.title}
                className="glow-card group p-6 rounded-xl bg-onyx border border-gunmetal hover:border-neonblue/40 transition-all duration-300 hover-lift"
              >
                <div className="w-12 h-12 rounded-lg bg-neonblue/10 flex items-center justify-center mb-4 group-hover:bg-neonblue/20 transition-colors duration-300">
                  <feature.icon className="h-6 w-6 text-neonblue" />
                </div>
                <h3 className="text-lg font-semibold text-platinum mb-2">
                  {feature.title}
                </h3>
                <p className="text-silver text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Models Section */}
      <section className="py-20 px-4 bg-graphite">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neonblue/10 border border-neonblue/20 mb-6">
              <Brain className="h-4 w-4 text-neonblue" />
              <span className="text-sm text-neonblue font-medium">Multi-AI Architecture</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-platinum mb-4">
              Powered by the <span className="text-neonblue">Best AI Models</span>
            </h2>
            <p className="text-lg text-silver max-w-2xl mx-auto">
              Not locked to one vendor. We route each task to the best AI model for the job.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {aiModels.map((model) => (
              <div
                key={model.name}
                className="glow-card p-6 rounded-xl bg-onyx border border-gunmetal hover:border-neonblue/40 transition-all duration-300 text-center hover-lift"
              >
                <div className="w-12 h-12 rounded-full bg-neonblue/10 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="h-6 w-6 text-neonblue" />
                </div>
                <h3 className="text-lg font-bold text-platinum mb-1">{model.name}</h3>
                <p className="text-xs text-neonblue font-medium mb-2">{model.provider}</p>
                <p className="text-sm text-silver">{model.use}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why QuotaHit Section */}
      <section className="py-20 px-4 bg-obsidian">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-platinum mb-4">
              Why Sales Reps <span className="text-automationgreen">Love Us</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Clock,
                title: "Ready in 30 Seconds",
                description: "Sign up, pick a scenario, and start practicing. No onboarding calls, no team setup.",
              },
              {
                icon: Shield,
                title: "No Enterprise Lock-In",
                description: "Month-to-month billing. No annual contracts, no minimum seats, cancel anytime.",
              },
              {
                icon: Target,
                title: "Built for Individual Reps",
                description: "You don't need manager approval or a team plan. Start improving on your own.",
              },
              {
                icon: TrendingUp,
                title: "Get Better Every Day",
                description: "Track streaks, earn badges, and see your scores improve session by session.",
              },
              {
                icon: Headphones,
                title: "Real Voice Practice",
                description: "The only tool with GPT-4o Realtime voice — practice like a real phone call.",
              },
              {
                icon: BarChart3,
                title: "10-50x Cheaper",
                description: "Gong costs $108-250/mo per user. QuotaHit Pro is $19/mo with more coaching features.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="glow-card group flex gap-4 p-5 rounded-xl bg-graphite border border-gunmetal hover:border-neonblue/30 transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-lg bg-automationgreen/10 flex items-center justify-center shrink-0 group-hover:bg-automationgreen/20 transition-colors">
                  <item.icon className="h-5 w-5 text-automationgreen" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-platinum mb-1">{item.title}</h3>
                  <p className="text-sm text-silver leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 bg-graphite relative overflow-hidden">
        <div className="absolute inset-0 opacity-40" style={{
          background: "radial-gradient(circle at 50% 50%, rgba(0, 179, 255, 0.1) 0%, transparent 60%)",
        }} />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-platinum mb-6">
            Ready to <span className="text-neonblue">Close More Deals?</span>
          </h2>
          <p className="text-lg text-silver mb-10 max-w-xl mx-auto">
            Join sales reps who are already practicing smarter and closing faster.
          </p>
          <Link href="/signup">
            <Button
              size="lg"
              className="bg-neonblue hover:bg-electricblue text-white px-10 py-7 text-lg glow-blue animate-pulse-glow glow-ring-pulse cursor-pointer"
            >
              Start Free — No Credit Card
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <p className="text-sm text-mist mt-6">
            Free forever plan. No credit card required.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gunmetal py-8 bg-obsidian">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-gradient-to-br from-neonblue to-electricblue flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-silver">QuotaHit</span>
            </div>
            <div className="flex items-center gap-6">
              <Link href="/" className="text-sm text-mist hover:text-silver transition-colors">Home</Link>
              <Link href="/pricing" className="text-sm text-mist hover:text-silver transition-colors">Pricing</Link>
              <Link href="/login" className="text-sm text-mist hover:text-silver transition-colors">Login</Link>
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
