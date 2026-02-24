import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MobileNav } from "@/components/ui/mobile-nav";

export const metadata: Metadata = {
  title: "AI Agents — Your Full Autonomous Sales Department",
  description:
    "7 AI agents that find leads, qualify prospects, reach out on every channel, follow up, close deals, and collect payment. Meet your AI sales team.",
  keywords: [
    "AI SDR", "AI sales agent", "autonomous sales", "AI lead qualification",
    "AI outreach", "AI cold calling", "AI sales department", "AI sales pipeline",
    "AI lead generation", "AI deal closing", "AI follow-up", "AI sales automation",
  ],
  alternates: {
    canonical: "https://www.quotahit.com/features",
  },
  openGraph: {
    title: "7 AI Agents — Your Autonomous Sales Department | QuotaHit",
    description: "From lead generation to payment collection — 7 AI agents that handle your entire sales pipeline. Every channel. 24/7. Zero manual work.",
    url: "https://www.quotahit.com/features",
  },
};
import {
  Sparkles,
  ArrowRight,
  Phone,
  Zap,
  Brain,
  Shield,
  Clock,
  Mail,
  Search,
  CheckCircle,
  Handshake,
  Send,
  PhoneCall,
  Mic,
  RefreshCw,
  GitBranch,
  Settings,
  BellRing,
  Scale,
  Plug,
  Layers,
  DollarSign,
  Bot,
  TrendingUp,
} from "lucide-react";

const coreFeatures = [
  {
    icon: Search,
    title: "Autonomous Lead Discovery",
    description:
      "AI finds leads matching your ICP 24/7 from LinkedIn, web, and imports. Auto-enriches every lead with company data, tech stack, funding signals, and pain points using Perplexity-powered research.",
    color: "neonblue",
    tag: "Always-On Prospecting",
  },
  {
    icon: CheckCircle,
    title: "AI-Powered Qualification",
    description:
      "Has intelligent BANT+ conversations to pre-qualify leads. Scores every lead 0-100 based on fit, engagement, budget, authority, need, and timeline. No human intervention required.",
    color: "automationgreen",
    tag: "Zero Manual Work",
  },
  {
    icon: Handshake,
    title: "Autonomous Deal Closing",
    description:
      "Handles objections, negotiates terms, sends proposals, collects payment, and triggers onboarding. The first AI that goes from first touch to revenue collected.",
    color: "warningamber",
    tag: "End-to-End",
  },
];

const allFeatures = [
  {
    icon: Send,
    title: "Multi-Channel Outreach",
    description:
      "Personalized sequences across email, LinkedIn, WhatsApp, and cold calling. AI writes every message using prospect context.",
  },
  {
    icon: PhoneCall,
    title: "Autonomous AI Calling",
    description:
      "Outbound calls with AI voice. Books meetings, qualifies leads, and handles objections on the phone.",
  },
  {
    icon: Mic,
    title: "Voice-First Interface",
    description:
      "Speak to your CRM. Instruct AI with voice commands like 'send follow-up to Sarah' and AI does the rest.",
  },
  {
    icon: RefreshCw,
    title: "Self-Optimizing Templates",
    description:
      "Templates, scoring weights, and timing auto-optimize from every interaction. AI gets smarter every day.",
  },
  {
    icon: GitBranch,
    title: "Intelligent Lead Routing",
    description:
      "Route qualified leads to Mode A (fully autonomous), Mode B (hybrid with reps), or Mode C (self-service payment).",
  },
  {
    icon: Settings,
    title: "Customizable Agent Loadouts",
    description:
      "Configure each agent's behavior, channels, tone, and rules. Build custom loadouts or use pre-built templates.",
  },
  {
    icon: BellRing,
    title: "Automated Follow-Ups",
    description:
      "Multi-step sequences that never miss a beat. Email, WhatsApp, and SMS follow-ups triggered by lead behavior.",
  },
  {
    icon: Scale,
    title: "TCPA Compliant",
    description:
      "AI call disclosure, DNC enforcement, consent tracking, and full audit trail. Enterprise-grade compliance from day one.",
  },
  {
    icon: Plug,
    title: "MCP-Ready Architecture",
    description:
      "Connect any AI tool via Model Context Protocol. Your pipeline is extensible and future-proof.",
  },
];

const aiModels = [
  { name: "GPT-4o", provider: "OpenAI", use: "Voice calls, real-time conversations" },
  { name: "Claude 4.6", provider: "Anthropic", use: "Qualification, research, proposals" },
  { name: "Kimi K2.5", provider: "Moonshot", use: "High-volume tasks, cost-efficient" },
  { name: "Gemini", provider: "Google", use: "Research, multi-modal analysis" },
  { name: "ElevenLabs", provider: "ElevenLabs", use: "AI voice generation for calls" },
  { name: "Deepgram", provider: "Deepgram", use: "Speech-to-text, voice commands" },
];

const stats = [
  { value: "7", label: "AI Agents" },
  { value: "5", label: "Channels" },
  { value: "24/7", label: "Autonomous" },
  { value: "100%", label: "Pipeline Coverage" },
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
            <div className="flex items-center gap-2">
              <a
                href="https://wa.me/919827853940?text=Hi%20Dhruv%2C%20I%27m%20interested%20in%20QuotaHit"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/30 transition-all text-sm font-medium"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                WhatsApp
              </a>
              <a
                href="tel:+919827853940"
                className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-lg bg-neonblue/10 border border-neonblue/20 text-neonblue hover:bg-neonblue/20 hover:border-neonblue/30 transition-all text-sm font-medium"
              >
                <Phone className="h-3.5 w-3.5" />
                Call
              </a>
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
            <Bot className="h-4 w-4 text-neonblue" />
            <span className="text-sm text-neonblue font-medium">
              Your AI Sales Team
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-platinum mb-6 animate-fade-in-up leading-tight">
            7 AI Agents That
            <br />
            <span className="text-neonblue">Close Deals For You</span>
          </h1>

          <p className="text-lg sm:text-xl text-silver max-w-3xl mx-auto mb-12 animate-fade-in-up">
            From lead generation to payment collection — your entire sales pipeline, automated.
            Every channel. 24/7. Zero manual work.
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
              3 Core <span className="text-neonblue">Agent Capabilities</span>
            </h2>
            <p className="text-lg text-silver max-w-2xl mx-auto">
              The AI agents that power your autonomous sales pipeline from first touch to revenue.
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

      {/* All Agent Capabilities Grid */}
      <section className="py-20 px-4 bg-obsidian">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-platinum mb-4">
              Every Capability Your <span className="text-automationgreen">AI Team</span> Has
            </h2>
            <p className="text-lg text-silver max-w-2xl mx-auto">
              9 specialized capabilities across every channel. No integrations, no manual work, no gaps in your pipeline.
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
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

      {/* Why Teams Switch Section */}
      <section className="py-20 px-4 bg-obsidian">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-platinum mb-4">
              Why Teams Switch to <span className="text-automationgreen">QuotaHit</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Clock,
                title: "Setup in 5 Minutes",
                description: "Import leads, connect channels, and AI starts selling. No onboarding calls or team setup needed.",
              },
              {
                icon: Layers,
                title: "Replaces 5-7 Tools",
                description: "Lead gen, CRM, outreach, calling, follow-ups, proposals, and payments — all in one platform.",
              },
              {
                icon: Zap,
                title: "Works While You Sleep",
                description: "7 AI agents operate 24/7 across every channel. Wake up to qualified leads and closed deals.",
              },
              {
                icon: TrendingUp,
                title: "Self-Improving",
                description: "AI optimizes its own templates, timing, and scoring from every interaction. Gets smarter every day.",
              },
              {
                icon: Shield,
                title: "Enterprise Compliance",
                description: "TCPA, CAN-SPAM, DNC enforcement, and full audit trail built in. No compliance add-ons needed.",
              },
              {
                icon: DollarSign,
                title: "Fraction of the Cost",
                description: "11x.ai charges $800-1500/mo for prospecting only. QuotaHit starts at $299/mo for the full pipeline.",
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
            Your Sales Team That <span className="text-neonblue">Never Sleeps</span>
          </h2>
          <p className="text-lg text-silver mb-10 max-w-xl mx-auto">
            Set up in 5 minutes. Wake up to qualified leads, booked meetings, and closed deals.
          </p>
          <Link href="/signup">
            <Button
              size="lg"
              className="bg-neonblue hover:bg-electricblue text-white px-10 py-7 text-lg glow-blue animate-pulse-glow glow-ring-pulse cursor-pointer"
            >
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <p className="text-sm text-mist mt-6">
            14-day free trial. No credit card required.
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
            <div className="flex items-center gap-4 sm:gap-6">
              <a href="tel:+919827853940" className="flex items-center gap-1.5 text-sm text-silver hover:text-neonblue transition-colors">
                <Phone className="w-3.5 h-3.5 text-neonblue" />
                +91 98278 53940
              </a>
              <a href="mailto:aiwithdhruv@gmail.com" className="flex items-center gap-1.5 text-sm text-silver hover:text-neonblue transition-colors">
                <Mail className="w-3.5 h-3.5 text-neonblue" />
                aiwithdhruv@gmail.com
              </a>
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
