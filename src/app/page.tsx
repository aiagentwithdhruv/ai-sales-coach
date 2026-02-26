import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MobileNav } from "@/components/ui/mobile-nav";
import { GeminiVoiceWidget } from "@/components/landing/GeminiVoiceWidget";
import { TIERS, ALL_TIER_SLUGS } from "@/lib/pricing";
import {
  Sparkles,
  ArrowRight,
  Check,
  X,
  MessageSquare,
  Phone,
  Swords,
  Globe,
  UserSearch,
  Zap,
  Users,
  Shield,
  Calendar,
  ExternalLink,
  PhoneCall,
  Mail,
} from "lucide-react";

const agents = [
  {
    icon: UserSearch,
    title: "Scout Agent",
    description:
      "Finds leads matching your ICP 24/7 from LinkedIn, web, and imports.",
    color: "text-neonblue",
  },
  {
    icon: Globe,
    title: "Researcher Agent",
    description:
      "Auto-enriches every lead with company data, tech stack, funding, and pain points.",
    color: "text-automationgreen",
  },
  {
    icon: MessageSquare,
    title: "Qualifier Agent",
    description:
      "Has BANT+ conversations to pre-qualify leads. No human needed.",
    color: "text-warningamber",
  },
  {
    icon: Mail,
    title: "Outreach Agent",
    description:
      "Multi-channel sequences across email, LinkedIn, WhatsApp, and cold calling.",
    color: "text-neonblue",
  },
  {
    icon: Phone,
    title: "Caller Agent",
    description:
      "Autonomous outbound calls with AI voice. Books meetings while you sleep.",
    color: "text-automationgreen",
  },
  {
    icon: Swords,
    title: "Closer Agent",
    description:
      "Handles objections, negotiates, sends proposals, and collects payment.",
    color: "text-warningamber",
  },
  {
    icon: Zap,
    title: "Ops Agent",
    description:
      "Invoicing, onboarding, follow-ups, and self-improving templates. Auto-optimizes everything.",
    color: "text-neonblue",
  },
];


const steps = [
  {
    number: "01",
    title: "Connect",
    description:
      "Import your leads or let AI find them. Connect your email, WhatsApp, and LinkedIn. Takes 5 minutes.",
    color: "text-neonblue",
    bgColor: "bg-neonblue/10",
    borderColor: "border-neonblue/30",
  },
  {
    number: "02",
    title: "AI Sells",
    description:
      "7 AI agents score, qualify, reach out, follow up, and close deals across every channel. Automatically. 24/7.",
    color: "text-automationgreen",
    bgColor: "bg-automationgreen/10",
    borderColor: "border-automationgreen/30",
  },
  {
    number: "03",
    title: "You Grow",
    description:
      "Wake up to qualified leads, booked meetings, and closed deals. AI improves itself every day. You scale without hiring.",
    color: "text-warningamber",
    bgColor: "bg-warningamber/10",
    borderColor: "border-warningamber/30",
  },
];

const comparisonRows = [
  {
    feature: "End-to-End Autonomous Pipeline",
    us: true,
    elevenx: false,
    artisan: false,
    apollo: false,
  },
  {
    feature: "AI Lead Qualification (BANT+)",
    us: true,
    elevenx: "partial",
    artisan: "partial",
    apollo: false,
  },
  {
    feature: "Multi-Channel Outreach (Email + LinkedIn + WhatsApp + Call)",
    us: true,
    elevenx: "partial",
    artisan: "partial",
    apollo: "partial",
  },
  {
    feature: "Autonomous AI Calling",
    us: true,
    elevenx: true,
    artisan: false,
    apollo: false,
  },
  {
    feature: "Built-in CRM + Pipeline",
    us: true,
    elevenx: false,
    artisan: false,
    apollo: true,
  },
  {
    feature: "Self-Improving AI (auto-optimizes templates, timing, scoring)",
    us: true,
    elevenx: false,
    artisan: false,
    apollo: false,
  },
  {
    feature: "Voice-First Interface",
    us: true,
    elevenx: false,
    artisan: false,
    apollo: false,
  },
  {
    feature: "Invoice + Payment Collection",
    us: true,
    elevenx: false,
    artisan: false,
    apollo: false,
  },
];

const pricingPlans = ALL_TIER_SLUGS.map((slug) => {
  const tier = TIERS[slug];
  return {
    name: tier.name,
    price: `$${tier.monthlyPrice}`,
    period: "/month",
    description: tier.tagline,
    features: tier.features.slice(0, 7),
    cta: tier.cta,
    highlighted: tier.popular ?? false,
  };
});

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
    description: "Your autonomous AI Sales Department. 7 AI agents that find leads, qualify prospects, reach out, follow up, close deals, and collect payment.",
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
    description: "Your AI Sales Department — Find. Qualify. Close. Automatically.",
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
      "@type": "AggregateOffer",
      lowPrice: "297",
      highPrice: "1497",
      priceCurrency: "USD",
    },
    description: "Autonomous AI Sales Department with 7 AI agents — lead generation, qualification, multi-channel outreach, follow-up, closing, and payment collection.",
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
            <div className="hidden md:flex items-center gap-6">
              <Link href="/features" className="text-sm text-silver hover:text-platinum transition-colors">
                Features
              </Link>
              <a href="#how-it-works" className="text-sm text-silver hover:text-platinum transition-colors">
                How It Works
              </a>
              <Link href="/pricing" className="text-sm text-silver hover:text-platinum transition-colors">
                Pricing
              </Link>
              <Link href="/blog" className="text-sm text-silver hover:text-platinum transition-colors">
                Blog
              </Link>
              <Link href="/login" className="text-sm text-silver hover:text-platinum transition-colors">
                Login
              </Link>
            </div>
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
                <PhoneCall className="h-3.5 w-3.5" />
                Call
              </a>
              <Link href="/signup">
                <Button className="bg-neonblue hover:bg-electricblue text-white text-sm px-4">
                  Start Free
                </Button>
              </Link>
              <MobileNav
                links={[
                  { href: "/features", label: "AI Agents" },
                  { href: "/#how-it-works", label: "How It Works" },
                  { href: "/pricing", label: "Pricing" },
                  { href: "https://n8n.aiwithdhruv.cloud/form/10f459a3-ca15-466e-b718-8b11f312c3f8", label: "Hear Our AI Call" },
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
              7 AI Agents. Every Channel. Zero Manual Work.
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-platinum mb-4 animate-fade-in-up leading-tight">
            Your AI Sales Department.
          </h1>
          <div className="inline-flex items-center gap-3 sm:gap-5 mb-6 animate-fade-in-up">
            <span className="text-xl sm:text-2xl lg:text-3xl font-semibold tracking-wide text-neonblue hero-word-glow hero-word-box" style={{ "--glow-word-color": "rgba(0, 179, 255, 0.4)" } as React.CSSProperties}>Find</span>
            <span className="text-xl sm:text-2xl lg:text-3xl font-semibold tracking-wide text-automationgreen hero-word-glow hero-word-box" style={{ "--glow-word-color": "rgba(45, 255, 142, 0.4)" } as React.CSSProperties}>Qualify</span>
            <span className="text-xl sm:text-2xl lg:text-3xl font-semibold tracking-wide hero-word-glow hero-word-box" style={{ "--glow-word-color": "rgba(192, 199, 209, 0.5)", color: "#C7CCD1" } as React.CSSProperties}>Close</span>
          </div>

          <p className="text-lg sm:text-xl text-silver max-w-3xl mx-auto mb-10 animate-fade-in-up">
            7 AI agents that find leads, qualify prospects, reach out on every
            channel, follow up, close deals, and collect payment.{" "}
            <span className="text-platinum font-semibold">
              While you sleep.
            </span>
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14 animate-fade-in-up">
            <Link href="/signup">
              <button
                className="btn-premium relative px-10 py-5 rounded-xl text-lg font-semibold cursor-pointer"
              >
                <span className="btn-premium-text relative z-10 flex items-center gap-2">
                  Start Free Trial
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
                  Hear Our AI Call You
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
                Replaces 5-7 sales tools at a fraction of the cost
              </span>
            </div>
            <div className="hidden sm:block w-px h-5 bg-gunmetal" />
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-neonblue" />
              <span className="text-sm">
                TCPA compliant &middot; SOC2 ready &middot; Enterprise-grade
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────── AI Agents Grid ───────────────── */}
      <section id="features" className="py-24 px-4 bg-graphite">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neonblue/10 border border-neonblue/20 mb-4">
              <Zap className="h-3.5 w-3.5 text-neonblue" />
              <span className="text-xs text-neonblue font-medium uppercase tracking-wider">
                Your AI Sales Team
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-platinum mb-4">
              7 AI Agents That{" "}
              <span className="text-neonblue">Sell For You</span>
            </h2>
            <p className="text-lg text-silver max-w-2xl mx-auto">
              A full sales department that works 24/7 across every channel.
              No hiring. No training. No missed follow-ups.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {agents.map((agent, index) => (
              <div
                key={agent.title}
                className="glow-card p-6 rounded-xl bg-onyx border border-gunmetal hover:border-neonblue/50 transition-all duration-300 group hover-lift"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className={`w-11 h-11 rounded-lg ${agent.color === "text-neonblue" ? "bg-neonblue/10 group-hover:bg-neonblue/20" : agent.color === "text-automationgreen" ? "bg-automationgreen/10 group-hover:bg-automationgreen/20" : "bg-warningamber/10 group-hover:bg-warningamber/20"} flex items-center justify-center mb-4 transition-colors`}>
                  <agent.icon className={`h-5 w-5 ${agent.color}`} />
                </div>
                <h3 className="text-base font-semibold text-platinum mb-2">
                  {agent.title}
                </h3>
                <p className="text-silver text-sm leading-relaxed">
                  {agent.description}
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
              Set it up once. AI handles everything from lead to payment.
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
              Why Teams{" "}
              <span className="text-neonblue">Switch</span> to QuotaHit
            </h2>
            <p className="text-lg text-silver max-w-2xl mx-auto">
              The only platform that goes from lead to payment. No stitching tools together.
            </p>
          </div>

          <div className="rounded-2xl border border-gunmetal overflow-x-auto">
            <div className="min-w-[640px]">
            {/* Table header */}
            <div className="grid grid-cols-5 bg-onyx border-b border-gunmetal">
              <div className="p-4 text-sm font-medium text-mist">Feature</div>
              <div className="p-4 text-center">
                <div className="text-sm font-bold text-neonblue">QuotaHit</div>
                <div className="text-xs text-automationgreen font-medium">
                  $297-1,497/mo
                </div>
              </div>
              <div className="p-4 text-center">
                <div className="text-sm font-medium text-silver">11x.ai</div>
                <div className="text-xs text-mist">$800-1,500/mo</div>
              </div>
              <div className="p-4 text-center">
                <div className="text-sm font-medium text-silver">Artisan</div>
                <div className="text-xs text-mist">$2,000+/mo</div>
              </div>
              <div className="p-4 text-center">
                <div className="text-sm font-medium text-silver">Apollo</div>
                <div className="text-xs text-mist">$49-119/mo</div>
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
                  <ComparisonCell value={row.elevenx} />
                </div>
                <div className="p-4 flex items-center justify-center">
                  <ComparisonCell value={row.artisan} />
                </div>
                <div className="p-4 flex items-center justify-center">
                  <ComparisonCell value={row.apollo} />
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
                  $297-1,497/mo
                </span>
              </div>
              <div className="p-4 text-center">
                <span className="text-sm text-errorred font-medium">
                  $800-1,500/mo
                </span>
              </div>
              <div className="p-4 text-center">
                <span className="text-sm text-errorred font-medium">
                  $2,000+/mo
                </span>
              </div>
              <div className="p-4 text-center">
                <span className="text-sm text-silver">$49-119/mo</span>
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
              Less than hiring one SDR. More output than an entire team.
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
                <Link href="/signup">
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
            Your Sales Team That{" "}
            <span className="text-neonblue">Never Sleeps</span>
          </h2>
          <p className="text-lg text-silver mb-10 max-w-xl mx-auto">
            Set up in 5 minutes. Wake up to qualified leads, booked meetings, and closed deals.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup">
              <Button
                size="lg"
                className="bg-neonblue hover:bg-electricblue text-white px-10 py-7 text-lg glow-blue animate-pulse-glow cursor-pointer"
              >
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <a
              href="https://calendly.com/aiwithdhruv/makeaiworkforyou"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                size="lg"
                variant="outline"
                className="border-gunmetal text-platinum hover:bg-gunmetal px-10 py-7 text-lg cursor-pointer"
              >
                <Calendar className="mr-2 h-5 w-5" />
                Book a Demo
              </Button>
            </a>
          </div>
          <p className="text-sm text-mist mt-6">
            14-day free trial. No credit card required.
          </p>
        </div>
      </section>

      {/* ───────────────── Footer ───────────────── */}
      <footer className="py-12 px-4 border-t border-gunmetal bg-obsidian">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Row 1: Brand + Nav + Actions */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Brand */}
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-neonblue to-electricblue flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-platinum">
                Quota<span className="text-neonblue">Hit</span>
              </span>
            </div>

            {/* Nav Links */}
            <div className="flex flex-wrap items-center justify-center gap-6">
              <Link href="/features" className="text-sm text-mist hover:text-silver transition-colors">
                AI Agents
              </Link>
              <Link href="/pricing" className="text-sm text-mist hover:text-silver transition-colors">
                Pricing
              </Link>
              <Link href="/blog" className="text-sm text-mist hover:text-silver transition-colors">
                Blog
              </Link>
              <a
                href="https://n8n.aiwithdhruv.cloud/form/10f459a3-ca15-466e-b718-8b11f312c3f8"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-automationgreen hover:text-automationgreen/80 transition-colors flex items-center gap-1"
              >
                Hear Our AI Call <ExternalLink className="h-3 w-3" />
              </a>
              <a
                href="https://calendly.com/aiwithdhruv/makeaiworkforyou"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-neonblue hover:text-electricblue transition-colors flex items-center gap-1"
              >
                Book Demo <ExternalLink className="h-3 w-3" />
              </a>
              <Link href="/login" className="text-sm text-mist hover:text-silver transition-colors">
                Login
              </Link>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gunmetal/50" />

          {/* Row 2: Contact + Socials + Copyright */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Contact Info */}
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

            {/* Social Links */}
            <div className="flex items-center gap-4">
              <a
                href="https://youtube.com/@aiwithdhruv"
                target="_blank"
                rel="noopener noreferrer"
                className="text-mist hover:text-red-400 transition-colors"
                title="YouTube"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
              </a>
              <a
                href="https://instagram.com/aiwithdhruv"
                target="_blank"
                rel="noopener noreferrer"
                className="text-mist hover:text-pink-400 transition-colors"
                title="Instagram"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
              </a>
              <a
                href="https://linkedin.com/in/aiwithdhruv"
                target="_blank"
                rel="noopener noreferrer"
                className="text-mist hover:text-blue-400 transition-colors"
                title="LinkedIn"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              </a>
              <a
                href="https://x.com/aiwithdhruv"
                target="_blank"
                rel="noopener noreferrer"
                className="text-mist hover:text-white transition-colors"
                title="X (Twitter)"
              >
                <svg className="w-4.5 h-4.5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
            </div>

            {/* Copyright */}
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
