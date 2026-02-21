import Link from "next/link";
import { Button } from "@/components/ui/button";
import { NavProductDropdown } from "@/components/ui/nav-product-dropdown";
import { MobileNav } from "@/components/ui/mobile-nav";
import { GeminiVoiceWidget } from "@/components/landing/GeminiVoiceWidget";
import {
  Sparkles,
  ArrowRight,
  Check,
  X,
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
  Users,
  Shield,
  Calendar,
  ExternalLink,
  PhoneCall,
  Mail,
} from "lucide-react";

const features = [
  {
    icon: MessageSquare,
    title: "Objection Coach",
    description:
      "Get instant AI responses to any sales objection with context-aware handling.",
  },
  {
    icon: Mic,
    title: "Voice Practice",
    description:
      "Practice your pitch with AI using GPT-4o Realtime voice.",
  },
  {
    icon: PenLine,
    title: "Text Practice",
    description:
      "Role-play sales calls via chat with AI scoring.",
  },
  {
    icon: Phone,
    title: "Call Analysis",
    description:
      "Upload recordings and get AI-powered call scoring & coaching.",
  },
  {
    icon: Swords,
    title: "Sales Tools",
    description:
      "Email crafter, pitch scorer, battle cards, discovery questions & more.",
  },
  {
    icon: Globe,
    title: "Research Mode",
    description:
      "Perplexity-powered company research for call prep.",
  },
  {
    icon: FileText,
    title: "Meeting Notes",
    description:
      "AI meeting summarizer with action items & follow-up emails.",
  },
  {
    icon: BookOpen,
    title: "Objection Library",
    description:
      "Save, search, and categorize your best objection responses.",
  },
  {
    icon: UserSearch,
    title: "Custom Personas",
    description:
      "Create buyer personas at any difficulty to practice against.",
  },
  {
    icon: Trophy,
    title: "Progress Tracking",
    description:
      "18 achievement badges, streaks, and progress dashboards.",
  },
  {
    icon: History,
    title: "Session History",
    description:
      "Review all past sessions, coaching, and tool outputs.",
  },
  {
    icon: FileDown,
    title: "PDF Export",
    description:
      "Export any research, meeting notes, or session as a styled PDF.",
  },
];

const steps = [
  {
    number: "01",
    title: "Practice",
    description:
      "Practice your pitch against AI buyers with voice or text. Get scored on delivery, objection handling, and closing.",
    color: "text-neonblue",
    bgColor: "bg-neonblue/10",
    borderColor: "border-neonblue/30",
  },
  {
    number: "02",
    title: "Coach",
    description:
      "Get instant AI coaching on objections, discovery, deal strategy. Use 12 built-in sales tools to prepare for every call.",
    color: "text-automationgreen",
    bgColor: "bg-automationgreen/10",
    borderColor: "border-automationgreen/30",
  },
  {
    number: "03",
    title: "Analyze",
    description:
      "Upload real calls, get AI scoring, and improve every day. Track your progress with badges and streaks.",
    color: "text-warningamber",
    bgColor: "bg-warningamber/10",
    borderColor: "border-warningamber/30",
  },
];

const comparisonRows = [
  {
    feature: "AI Roleplay Practice",
    us: true,
    gong: false,
    yoodli: true,
    dialpad: "partial",
  },
  {
    feature: "Real-time Voice Practice",
    us: true,
    gong: false,
    yoodli: false,
    dialpad: false,
  },
  {
    feature: "Objection Coaching",
    us: true,
    gong: "partial",
    yoodli: true,
    dialpad: true,
  },
  {
    feature: "Call Analysis & Scoring",
    us: true,
    gong: true,
    yoodli: false,
    dialpad: true,
  },
  {
    feature: "12 Sales Tools Built In",
    us: true,
    gong: false,
    yoodli: false,
    dialpad: false,
  },
  {
    feature: "Multi-AI Provider (GPT-4o, Claude 4.6, Kimi K2.5)",
    us: true,
    gong: false,
    yoodli: false,
    dialpad: false,
  },
  {
    feature: "No Enterprise Contract",
    us: true,
    gong: false,
    yoodli: true,
    dialpad: false,
  },
];

const pricingPlans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Get started with AI sales coaching",
    features: [
      "5 practice sessions/month",
      "Objection Coach",
      "Basic call analysis",
      "Session history",
    ],
    cta: "Start Free",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$19",
    period: "/month",
    description: "Everything you need to close more deals",
    features: [
      "Unlimited practice sessions",
      "All 12 sales tools",
      "Voice + text practice",
      "Custom personas",
      "PDF exports",
      "Progress tracking",
    ],
    cta: "Start Pro Trial",
    highlighted: true,
  },
  {
    name: "Team",
    price: "$49",
    period: "/month",
    description: "For sales teams that want to win together",
    features: [
      "Everything in Pro",
      "5 team members",
      "Team analytics dashboard",
      "Shared objection library",
      "Priority support",
    ],
    cta: "Start Team Trial",
    highlighted: false,
  },
];

function ComparisonCell({ value }: { value: boolean | string }) {
  if (value === true) {
    return (
      <div className="flex items-center justify-center">
        <div className="h-6 w-6 rounded-full bg-automationgreen/15 flex items-center justify-center">
          <Check className="h-4 w-4 text-automationgreen" />
        </div>
      </div>
    );
  }
  if (value === "partial") {
    return (
      <span className="text-xs text-warningamber font-medium">Partial</span>
    );
  }
  return (
    <div className="flex items-center justify-center">
      <div className="h-6 w-6 rounded-full bg-errorred/10 flex items-center justify-center">
        <X className="h-4 w-4 text-mist" />
      </div>
    </div>
  );
}

export default function LandingPage() {
  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "QuotaHit",
    url: "https://www.quotahit.com",
    description: "AI-powered sales coaching platform — practice pitches, handle objections, and analyze calls.",
    foundingDate: "2026",
    sameAs: [
      "https://www.linkedin.com/in/aiwithdhruv/",
      "https://github.com/aiagentwithdhruv",
    ],
  };

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "QuotaHit",
    url: "https://www.quotahit.com",
    description: "AI Sales Coach — Practice. Coach. Close.",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://www.quotahit.com/blog?q={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };

  const softwareJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "QuotaHit",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    description: "AI sales coaching platform with voice practice, objection coaching, call analysis, and 12 sales tools.",
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      ratingCount: "12",
    },
  };

  return (
    <div className="min-h-screen bg-obsidian">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }} />
      {/* ───────────────── Navigation ───────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 glassmorphism border-b border-gunmetal">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-neonblue to-electricblue flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold text-platinum">
                Quota<span className="text-neonblue">Hit</span>
              </span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <NavProductDropdown />
              <a
                href="#how-it-works"
                className="text-silver hover:text-platinum transition-colors"
              >
                How It Works
              </a>
              <Link
                href="/pricing"
                className="text-silver hover:text-platinum transition-colors"
              >
                Pricing
              </Link>
              <Link
                href="/blog"
                className="text-silver hover:text-platinum transition-colors"
              >
                Blog
              </Link>
              <Link
                href="/login"
                className="text-silver hover:text-platinum transition-colors"
              >
                Login
              </Link>
              <span className="text-gunmetal/40">|</span>
              <a href="tel:+919827853940" className="flex items-center gap-1.5 text-silver hover:text-neonblue transition-colors text-sm">
                <PhoneCall className="w-3.5 h-3.5 text-neonblue/70" />
                <span className="hidden lg:inline">+91 98278 53940</span>
              </a>
              <a href="mailto:aiwithdhruv@gmail.com" className="flex items-center gap-1.5 text-silver hover:text-neonblue transition-colors text-sm">
                <Mail className="w-3.5 h-3.5 text-neonblue/70" />
                <span className="hidden lg:inline">aiwithdhruv@gmail.com</span>
              </a>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/login" className="hidden md:block">
                <Button
                  variant="ghost"
                  className="text-silver hover:text-platinum"
                >
                  Sign In
                </Button>
              </Link>
              <a
                href="https://n8n.aiwithdhruv.cloud/form/10f459a3-ca15-466e-b718-8b11f312c3f8"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden md:flex"
              >
                <button className="btn-premium-sm text-sm px-4 py-2 rounded-lg font-medium cursor-pointer flex items-center gap-1.5">
                  <PhoneCall className="h-3.5 w-3.5" />
                  Test AI Call
                  <ExternalLink className="h-3 w-3 opacity-50" />
                </button>
              </a>
              <a
                href="https://calendly.com/aiwithdhruv/makeaiworkforyou"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden md:flex"
              >
                <Button variant="outline" className="border-neonblue/40 text-neonblue hover:bg-neonblue/10 text-sm px-4 gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  Book Demo
                </Button>
              </a>
              <Link href="/dashboard">
                <Button className="bg-neonblue hover:bg-electricblue text-white text-sm px-4">
                  Start Free
                </Button>
              </Link>
              <MobileNav
                links={[
                  { href: "/features", label: "AI Product" },
                  { href: "/#how-it-works", label: "How It Works" },
                  { href: "/pricing", label: "Pricing" },
                  { href: "https://n8n.aiwithdhruv.cloud/form/10f459a3-ca15-466e-b718-8b11f312c3f8", label: "Test AI Call" },
                  { href: "https://calendly.com/aiwithdhruv/makeaiworkforyou", label: "Book Demo" },
                  { href: "/login", label: "Login" },
                  { href: "/signup", label: "Sign Up" },
                ]}
              />
            </div>
          </div>
        </div>
      </nav>

      {/* ───────────────── Hero Section ───────────────── */}
      <section className="relative pt-32 pb-24 px-4 overflow-hidden">
        {/* Background gradient mesh */}
        <div
          className="absolute inset-0 opacity-50"
          style={{
            background:
              "radial-gradient(circle at 20% 30%, rgba(0, 179, 255, 0.08) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(45, 255, 142, 0.05) 0%, transparent 50%), radial-gradient(circle at 50% 50%, rgba(0, 179, 255, 0.03) 0%, transparent 70%)",
          }}
        />
        {/* Floating glow orbs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-neonblue/5 rounded-full blur-3xl animate-float" />
        <div
          className="absolute bottom-20 right-10 w-96 h-96 bg-automationgreen/5 rounded-full blur-3xl animate-float"
          style={{ animationDelay: "2s" }}
        />

        <div className="max-w-7xl mx-auto text-center relative z-10">
          {/* AI Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neonblue/10 border border-neonblue/20 mb-8 animate-fade-in-up">
            <Sparkles className="h-4 w-4 text-neonblue" />
            <span className="text-sm text-neonblue font-medium">
              Powered by GPT-4o, Claude 4.6, Kimi K2.5 & More
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-platinum mb-4 animate-fade-in-up leading-tight">
            Your AI Sales Coach.
          </h1>
          <div className="inline-flex items-center gap-3 sm:gap-5 mb-6 animate-fade-in-up">
            <span className="text-xl sm:text-2xl lg:text-3xl font-semibold tracking-wide text-neonblue hero-word-glow hero-word-box" style={{ "--glow-word-color": "rgba(0, 179, 255, 0.4)" } as React.CSSProperties}>Practice</span>
            <span className="text-xl sm:text-2xl lg:text-3xl font-semibold tracking-wide text-automationgreen hero-word-glow hero-word-box" style={{ "--glow-word-color": "rgba(45, 255, 142, 0.4)" } as React.CSSProperties}>Coach</span>
            <span className="text-xl sm:text-2xl lg:text-3xl font-semibold tracking-wide hero-word-glow hero-word-box" style={{ "--glow-word-color": "rgba(192, 199, 209, 0.5)", color: "#C7CCD1" } as React.CSSProperties}>Close</span>
          </div>

          <p className="text-lg sm:text-xl text-silver max-w-3xl mx-auto mb-10 animate-fade-in-up">
            The only AI sales tool that combines real-time voice practice,
            intelligent objection coaching, and call analysis — all in one app.{" "}
            <span className="text-platinum font-semibold">
              10-50x cheaper than Gong or Dialpad.
            </span>
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14 animate-fade-in-up">
            <Link href="/signup">
              <button
                className="btn-premium relative px-10 py-5 rounded-xl text-lg font-semibold cursor-pointer"
              >
                <span className="btn-premium-text relative z-10 flex items-center gap-2">
                  Start Free — No Credit Card
                  <ArrowRight className="h-5 w-5" />
                </span>
              </button>
            </Link>
            <a
              href="https://n8n.aiwithdhruv.cloud/form/10f459a3-ca15-466e-b718-8b11f312c3f8"
              target="_blank"
              rel="noopener noreferrer"
            >
              <button className="btn-premium relative px-8 py-5 rounded-xl text-lg font-semibold cursor-pointer">
                <span className="btn-premium-text relative z-10 flex items-center gap-2">
                  <PhoneCall className="h-5 w-5" />
                  Test AI Call — Free
                  <ExternalLink className="h-4 w-4 opacity-50" />
                </span>
              </button>
            </a>
            <a
              href="https://calendly.com/aiwithdhruv/makeaiworkforyou"
              target="_blank"
              rel="noopener noreferrer"
            >
              <button className="btn-premium relative px-8 py-5 rounded-xl text-lg font-semibold cursor-pointer">
                <span className="btn-premium-text relative z-10 flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Book a Demo
                  <ExternalLink className="h-4 w-4 opacity-50" />
                </span>
              </button>
            </a>
          </div>

          {/* Social Proof */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 text-silver animate-fade-in-up">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-automationgreen" />
              <span className="text-sm">
                Used by sales reps at early-stage startups
              </span>
            </div>
            <div className="hidden sm:block w-px h-5 bg-gunmetal" />
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-neonblue" />
              <span className="text-sm">
                Built by a sales rep, for sales reps
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────── Features Grid ───────────────── */}
      <section id="features" className="py-24 px-4 bg-graphite">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neonblue/10 border border-neonblue/20 mb-4">
              <Zap className="h-3.5 w-3.5 text-neonblue" />
              <span className="text-xs text-neonblue font-medium uppercase tracking-wider">
                Full Platform
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-platinum mb-4">
              12 AI-Powered{" "}
              <span className="text-neonblue">Sales Tools</span>
            </h2>
            <p className="text-lg text-silver max-w-2xl mx-auto">
              Everything you need to practice, coach, and close — built into one
              app. No integrations needed.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="glow-card p-6 rounded-xl bg-onyx border border-gunmetal hover:border-neonblue/50 transition-all duration-300 group hover-lift"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="w-11 h-11 rounded-lg bg-neonblue/10 flex items-center justify-center mb-4 group-hover:bg-neonblue/20 transition-colors">
                  <feature.icon className="h-5 w-5 text-neonblue" />
                </div>
                <h3 className="text-base font-semibold text-platinum mb-2">
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

      {/* ───────────────── How It Works ───────────────── */}
      <section id="how-it-works" className="py-24 px-4 bg-obsidian">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-platinum mb-4">
              3 Steps to{" "}
              <span className="text-automationgreen">Close More Deals</span>
            </h2>
            <p className="text-lg text-silver max-w-2xl mx-auto">
              A simple workflow that makes you a better seller every single day.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step) => (
              <div
                key={step.number}
                className={`glow-card relative p-8 rounded-2xl bg-graphite border ${step.borderColor} hover-lift transition-all duration-300`}
              >
                <div
                  className={`text-6xl font-black ${step.color} opacity-15 absolute top-4 right-6`}
                >
                  {step.number}
                </div>
                <div
                  className={`w-12 h-12 rounded-xl ${step.bgColor} flex items-center justify-center mb-5`}
                >
                  <span className={`text-xl font-bold ${step.color}`}>
                    {step.number}
                  </span>
                </div>
                <h3
                  className={`text-2xl font-bold ${step.color} mb-3`}
                >
                  {step.title}
                </h3>
                <p className="text-silver leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────── Competitor Comparison ───────────────── */}
      <section className="py-24 px-4 bg-graphite">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-platinum mb-4">
              Why Sales Reps{" "}
              <span className="text-neonblue">Choose Us</span> Over Enterprise
              Tools
            </h2>
            <p className="text-lg text-silver max-w-2xl mx-auto">
              Enterprise features without the enterprise price tag or contracts.
            </p>
          </div>

          <div className="rounded-2xl border border-gunmetal overflow-x-auto">
            <div className="min-w-[640px]">
            {/* Table header */}
            <div className="grid grid-cols-5 bg-onyx border-b border-gunmetal">
              <div className="p-4 text-sm font-medium text-mist">Feature</div>
              <div className="p-4 text-center">
                <div className="text-sm font-bold text-neonblue">Us</div>
                <div className="text-xs text-automationgreen font-medium">
                  $0-19/mo
                </div>
              </div>
              <div className="p-4 text-center">
                <div className="text-sm font-medium text-silver">Gong</div>
                <div className="text-xs text-mist">$108-250/mo</div>
              </div>
              <div className="p-4 text-center">
                <div className="text-sm font-medium text-silver">Yoodli</div>
                <div className="text-xs text-mist">$0-20/mo</div>
              </div>
              <div className="p-4 text-center">
                <div className="text-sm font-medium text-silver">Dialpad</div>
                <div className="text-xs text-mist">$39-170/mo</div>
              </div>
            </div>

            {/* Table rows */}
            {comparisonRows.map((row, index) => (
              <div
                key={row.feature}
                className={`grid grid-cols-5 ${
                  index % 2 === 0 ? "bg-graphite" : "bg-onyx/50"
                } ${
                  index < comparisonRows.length - 1
                    ? "border-b border-gunmetal/50"
                    : ""
                }`}
              >
                <div className="p-4 text-sm text-platinum flex items-center">
                  {row.feature}
                </div>
                <div className="p-4 flex items-center justify-center">
                  <ComparisonCell value={row.us} />
                </div>
                <div className="p-4 flex items-center justify-center">
                  <ComparisonCell value={row.gong} />
                </div>
                <div className="p-4 flex items-center justify-center">
                  <ComparisonCell value={row.yoodli} />
                </div>
                <div className="p-4 flex items-center justify-center">
                  <ComparisonCell value={row.dialpad} />
                </div>
              </div>
            ))}

            {/* Price row */}
            <div className="grid grid-cols-5 bg-onyx border-t border-gunmetal">
              <div className="p-4 text-sm font-semibold text-platinum">
                Price
              </div>
              <div className="p-4 text-center">
                <span className="text-sm font-bold text-automationgreen">
                  FREE-$19/mo
                </span>
              </div>
              <div className="p-4 text-center">
                <span className="text-sm text-errorred font-medium">
                  $108-250/mo
                </span>
              </div>
              <div className="p-4 text-center">
                <span className="text-sm text-silver">$0-20/mo</span>
              </div>
              <div className="p-4 text-center">
                <span className="text-sm text-errorred font-medium">
                  $39-170/mo
                </span>
              </div>
            </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────── Pricing Preview ───────────────── */}
      <section className="py-24 px-4 bg-obsidian">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-platinum mb-4">
              Simple, Transparent{" "}
              <span className="text-neonblue">Pricing</span>
            </h2>
            <p className="text-lg text-silver max-w-2xl mx-auto">
              Start free. Upgrade when you are ready. No surprises.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {pricingPlans.map((plan) => (
              <div
                key={plan.name}
                className={`${plan.highlighted ? "glow-card-visible" : "glow-card"} relative p-6 rounded-2xl border transition-all duration-300 hover-lift ${
                  plan.highlighted
                    ? "bg-onyx border-neonblue/50 glow-blue"
                    : "bg-graphite border-gunmetal hover:border-gunmetal"
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-neonblue text-xs font-bold text-white">
                    Most Popular
                  </div>
                )}
                <div className="mb-5">
                  <h3 className="text-lg font-semibold text-platinum mb-1">
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-4xl font-bold text-platinum">
                      {plan.price}
                    </span>
                    <span className="text-sm text-mist">{plan.period}</span>
                  </div>
                  <p className="text-sm text-silver">{plan.description}</p>
                </div>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-automationgreen shrink-0" />
                      <span className="text-sm text-silver">{feat}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/dashboard">
                  <Button
                    className={`w-full cursor-pointer ${
                      plan.highlighted
                        ? "bg-neonblue hover:bg-electricblue text-white"
                        : "bg-onyx border border-gunmetal text-platinum hover:bg-gunmetal"
                    }`}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link
              href="/pricing"
              className="text-neonblue hover:text-electricblue transition-colors text-sm font-medium inline-flex items-center gap-1"
            >
              See All Plans & Compare Features
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ───────────────── Final CTA Section ───────────────── */}
      <section className="py-24 px-4 bg-graphite relative overflow-hidden">
        {/* Background glow */}
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(circle at 50% 50%, rgba(0, 179, 255, 0.1) 0%, transparent 60%)",
          }}
        />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-platinum mb-6 animate-fade-in-up">
            Start Practicing in{" "}
            <span className="text-neonblue">30 Seconds</span>
          </h2>
          <p className="text-lg text-silver mb-10 max-w-xl mx-auto">
            No credit card. No setup. Just sign up and start practicing.
          </p>
          <Link href="/dashboard">
            <Button
              size="lg"
              className="bg-neonblue hover:bg-electricblue text-white px-10 py-7 text-lg glow-blue animate-pulse-glow cursor-pointer"
            >
              Start Free — No Credit Card
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <p className="text-sm text-mist mt-6">
            Free forever plan available. No credit card required.
          </p>
        </div>
      </section>

      {/* ───────────────── Footer ───────────────── */}
      <footer className="py-12 px-4 border-t border-gunmetal bg-obsidian">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-neonblue to-electricblue flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-platinum">
                Quota<span className="text-neonblue">Hit</span>
              </span>
            </div>
            <div className="flex items-center gap-6">
              <Link
                href="/features"
                className="text-sm text-mist hover:text-silver transition-colors"
              >
                AI Product
              </Link>
              <Link
                href="/pricing"
                className="text-sm text-mist hover:text-silver transition-colors"
              >
                Pricing
              </Link>
              <Link
                href="/blog"
                className="text-sm text-mist hover:text-silver transition-colors"
              >
                Blog
              </Link>
              <a
                href="https://n8n.aiwithdhruv.cloud/form/10f459a3-ca15-466e-b718-8b11f312c3f8"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-automationgreen hover:text-automationgreen/80 transition-colors flex items-center gap-1"
              >
                Test AI Call <ExternalLink className="h-3 w-3" />
              </a>
              <a
                href="https://calendly.com/aiwithdhruv/makeaiworkforyou"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-neonblue hover:text-electricblue transition-colors flex items-center gap-1"
              >
                Book Demo <ExternalLink className="h-3 w-3" />
              </a>
              <Link
                href="/login"
                className="text-sm text-mist hover:text-silver transition-colors"
              >
                Login
              </Link>
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
            <p className="text-sm text-mist">
              &copy; 2026 QuotaHit. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Floating Gemini Voice Widget */}
      <GeminiVoiceWidget />
    </div>
  );
}
