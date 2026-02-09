"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Store,
  Search,
  Lock,
  CheckCircle2,
  Play,
  Filter,
  Building2,
  Briefcase,
  HeartPulse,
  Landmark,
  Factory,
  ShoppingCart,
  Globe,
  AlertTriangle,
  User,
  Shield,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Difficulty = "easy" | "medium" | "hard";
type Industry =
  | "SaaS"
  | "Healthcare"
  | "Finance"
  | "Manufacturing"
  | "Retail"
  | "Enterprise";

interface Persona {
  id: string;
  name: string;
  title: string;
  companyType: string;
  personality: string;
  commonObjections: string[];
  difficulty: Difficulty;
  industry: Industry;
  isPro: boolean;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DIFFICULTY_CONFIG: Record<
  Difficulty,
  { label: string; bg: string; text: string; dot: string }
> = {
  easy: {
    label: "Easy",
    bg: "bg-automationgreen/15",
    text: "text-automationgreen",
    dot: "bg-automationgreen",
  },
  medium: {
    label: "Medium",
    bg: "bg-warningamber/15",
    text: "text-warningamber",
    dot: "bg-warningamber",
  },
  hard: {
    label: "Hard",
    bg: "bg-errorred/15",
    text: "text-errorred",
    dot: "bg-errorred",
  },
};

const INDUSTRY_ICONS: Record<Industry, typeof Building2> = {
  SaaS: Building2,
  Healthcare: HeartPulse,
  Finance: Landmark,
  Manufacturing: Factory,
  Retail: ShoppingCart,
  Enterprise: Globe,
};

const INDUSTRY_COLORS: Record<Industry, { text: string; bg: string }> = {
  SaaS: { text: "text-neonblue", bg: "bg-neonblue/10" },
  Healthcare: { text: "text-automationgreen", bg: "bg-automationgreen/10" },
  Finance: { text: "text-warningamber", bg: "bg-warningamber/10" },
  Manufacturing: { text: "text-purple-400", bg: "bg-purple-400/10" },
  Retail: { text: "text-pink-400", bg: "bg-pink-400/10" },
  Enterprise: { text: "text-sky-400", bg: "bg-sky-400/10" },
};

const ALL_INDUSTRIES: Industry[] = [
  "SaaS",
  "Healthcare",
  "Finance",
  "Manufacturing",
  "Retail",
  "Enterprise",
];

const ALL_DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];

// ---------------------------------------------------------------------------
// Pre-built Personas (18 total -- 6 free, 12 pro)
// ---------------------------------------------------------------------------

const PERSONAS: Persona[] = [
  // ---- SaaS ----
  {
    id: "saas-1",
    name: "Mark Sullivan",
    title: "VP of Sales",
    companyType: "Mid-Market SaaS",
    personality: "Skeptical and data-driven. Needs proof before committing.",
    commonObjections: [
      "Show me the ROI data",
      "We already have a tool for that",
      "What makes you different from competitor X?",
    ],
    difficulty: "easy",
    industry: "SaaS",
    isPro: false,
  },
  {
    id: "saas-2",
    name: "Rachel Kim",
    title: "RevOps Manager",
    companyType: "B2B SaaS Startup",
    personality:
      "Process-focused and integration-obsessed. Evaluates everything through a systems lens.",
    commonObjections: [
      "Does it integrate with our CRM?",
      "We need to standardize our stack first",
      "Can we get a proof of concept?",
    ],
    difficulty: "medium",
    industry: "SaaS",
    isPro: false,
  },
  {
    id: "saas-3",
    name: "James Chen",
    title: "IT Director",
    companyType: "Enterprise SaaS",
    personality:
      "Security-conscious and budget-constrained. Will push back on anything non-essential.",
    commonObjections: [
      "What about SOC 2 compliance?",
      "Our budget is frozen this quarter",
      "We need IT security review first",
    ],
    difficulty: "hard",
    industry: "SaaS",
    isPro: true,
  },

  // ---- Healthcare ----
  {
    id: "health-1",
    name: "Dr. Priya Sharma",
    title: "Hospital CTO",
    companyType: "Regional Health System",
    personality:
      "HIPAA-focused and risk-averse. Every decision runs through compliance first.",
    commonObjections: [
      "Is this HIPAA compliant?",
      "We need BAA agreements",
      "How does this integrate with Epic/Cerner?",
    ],
    difficulty: "medium",
    industry: "Healthcare",
    isPro: false,
  },
  {
    id: "health-2",
    name: "Robert Dawson",
    title: "CMO of Health System",
    companyType: "Multi-Hospital Network",
    personality:
      "ROI-driven and extremely busy. You get 10 minutes max. Every second counts.",
    commonObjections: [
      "Get to the point quickly",
      "What is the patient outcome impact?",
      "We have 5 other vendors pitching this",
    ],
    difficulty: "hard",
    industry: "Healthcare",
    isPro: true,
  },
  {
    id: "health-3",
    name: "Sandra Okafor",
    title: "Compliance Officer",
    companyType: "Healthcare Provider",
    personality:
      "Regulatory expert. Detail-oriented and will probe every claim for accuracy.",
    commonObjections: [
      "Show me your audit trail",
      "How do you handle data residency?",
      "This needs legal review",
    ],
    difficulty: "hard",
    industry: "Healthcare",
    isPro: true,
  },

  // ---- Finance ----
  {
    id: "fin-1",
    name: "David Rosenberg",
    title: "CFO",
    companyType: "Private Equity Firm",
    personality:
      "Numbers-only and impatient. If you cannot quantify it, he is not interested.",
    commonObjections: [
      "What is the IRR on this?",
      "Show me the financial model",
      "We need 3-year projections",
    ],
    difficulty: "hard",
    industry: "Finance",
    isPro: true,
  },
  {
    id: "fin-2",
    name: "Lisa Tanaka",
    title: "Head of Risk",
    companyType: "Investment Bank",
    personality:
      "Conservative and compliance-focused. Asks probing questions about edge cases.",
    commonObjections: [
      "What about regulatory changes?",
      "How do you handle market volatility?",
      "Who else in our sector uses this?",
    ],
    difficulty: "medium",
    industry: "Finance",
    isPro: false,
  },
  {
    id: "fin-3",
    name: "Michael Brooks",
    title: "VP of Operations",
    companyType: "Insurance Company",
    personality:
      "Efficiency-driven and practical. Values solutions that simplify workflows.",
    commonObjections: [
      "How long is the implementation?",
      "Can your team handle our scale?",
      "What is the learning curve?",
    ],
    difficulty: "easy",
    industry: "Finance",
    isPro: false,
  },

  // ---- Manufacturing ----
  {
    id: "mfg-1",
    name: "Tony Vargas",
    title: "Plant Manager",
    companyType: "Automotive Manufacturing",
    personality:
      "Hands-on and skeptical of tech. If it does not solve a floor problem, it is a waste.",
    commonObjections: [
      "My team does not have time for new software",
      "We tried something like this before",
      "Can it work offline?",
    ],
    difficulty: "medium",
    industry: "Manufacturing",
    isPro: true,
  },
  {
    id: "mfg-2",
    name: "Karen Lindstrom",
    title: "Supply Chain Director",
    companyType: "Electronics Manufacturer",
    personality:
      "Efficiency-focused and cost-conscious. Evaluates everything on payback period.",
    commonObjections: [
      "What is the payback period?",
      "How does this reduce our COGS?",
      "We need global supply chain visibility",
    ],
    difficulty: "medium",
    industry: "Manufacturing",
    isPro: true,
  },
  {
    id: "mfg-3",
    name: "Hiroshi Nakamura",
    title: "Quality Assurance Lead",
    companyType: "Precision Parts Manufacturer",
    personality:
      "Detail-oriented and process-driven. Follows Lean/Six Sigma principles religiously.",
    commonObjections: [
      "How does this fit our QMS?",
      "Show me defect-rate improvement data",
      "We need ISO 9001 compliance",
    ],
    difficulty: "easy",
    industry: "Manufacturing",
    isPro: true,
  },

  // ---- Retail ----
  {
    id: "ret-1",
    name: "Alicia Nguyen",
    title: "E-commerce Director",
    companyType: "DTC Brand",
    personality:
      "Growth-focused and fast-paced. Wants quick wins and scalable solutions.",
    commonObjections: [
      "How fast can we see results?",
      "What is the impact on conversion rate?",
      "We are already using Shopify Plus",
    ],
    difficulty: "easy",
    industry: "Retail",
    isPro: false,
  },
  {
    id: "ret-2",
    name: "Frank Morrison",
    title: "Store Operations VP",
    companyType: "National Retail Chain",
    personality:
      "Traditional and margin-focused. Skeptical of digital-first approaches.",
    commonObjections: [
      "How does this help our physical stores?",
      "What is the impact on margins?",
      "We have 500+ locations to roll out",
    ],
    difficulty: "medium",
    industry: "Retail",
    isPro: true,
  },
  {
    id: "ret-3",
    name: "Zara Patel",
    title: "Head of Digital",
    companyType: "Luxury Retail",
    personality:
      "Tech-savvy and ROI-focused. Balances innovation with brand experience.",
    commonObjections: [
      "How does this enhance our brand?",
      "What is the customer LTV impact?",
      "We need omnichannel attribution",
    ],
    difficulty: "easy",
    industry: "Retail",
    isPro: true,
  },

  // ---- Enterprise ----
  {
    id: "ent-1",
    name: "Patricia Williams",
    title: "CIO",
    companyType: "Fortune 500 Technology",
    personality:
      "Political and process-heavy. Every decision involves committees and long sales cycles.",
    commonObjections: [
      "We need to run this through procurement",
      "Who else at our scale uses this?",
      "This needs board approval",
    ],
    difficulty: "hard",
    industry: "Enterprise",
    isPro: true,
  },
  {
    id: "ent-2",
    name: "George Hamilton",
    title: "Head of Procurement",
    companyType: "Fortune 1000 Conglomerate",
    personality:
      "Price-focused with formal RFP process. Will negotiate aggressively on every line item.",
    commonObjections: [
      "Can you match competitor pricing?",
      "We need an RFP response",
      "Volume discounts are mandatory",
    ],
    difficulty: "hard",
    industry: "Enterprise",
    isPro: true,
  },
  {
    id: "ent-3",
    name: "Natasha Volkov",
    title: "Digital Transformation Lead",
    companyType: "Global Enterprise",
    personality:
      "Visionary but cautious. Excited by innovation yet constrained by legacy systems.",
    commonObjections: [
      "How does this integrate with our legacy stack?",
      "We need a phased rollout plan",
      "What is your change management support?",
    ],
    difficulty: "medium",
    industry: "Enterprise",
    isPro: true,
  },
];

// ---------------------------------------------------------------------------
// localStorage helpers
// ---------------------------------------------------------------------------

const STORAGE_KEY = "marketplace-practiced-personas";

function getPracticedIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function MarketplacePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndustry, setSelectedIndustry] = useState<Industry | "all">(
    "all"
  );
  const [selectedDifficulty, setSelectedDifficulty] = useState<
    Difficulty | "all"
  >("all");
  const [practicedIds, setPracticedIds] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    setPracticedIds(getPracticedIds());
  }, []);

  // Filtered personas
  const filteredPersonas = useMemo(() => {
    return PERSONAS.filter((p) => {
      const matchesIndustry =
        selectedIndustry === "all" || p.industry === selectedIndustry;
      const matchesDifficulty =
        selectedDifficulty === "all" || p.difficulty === selectedDifficulty;
      const matchesSearch =
        !searchQuery ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.companyType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.industry.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesIndustry && matchesDifficulty && matchesSearch;
    });
  }, [searchQuery, selectedIndustry, selectedDifficulty]);

  // Group by industry for visual sections
  const groupedByIndustry = useMemo(() => {
    const groups: Record<string, Persona[]> = {};
    for (const p of filteredPersonas) {
      if (!groups[p.industry]) groups[p.industry] = [];
      groups[p.industry].push(p);
    }
    return groups;
  }, [filteredPersonas]);

  // Stats
  const freeCount = PERSONAS.filter((p) => !p.isPro).length;
  const proCount = PERSONAS.filter((p) => p.isPro).length;
  const practicedCount = practicedIds.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-neonblue/10 flex items-center justify-center">
            <Store className="h-5 w-5 text-neonblue" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-platinum">
              Role-Play Marketplace
            </h1>
            <p className="text-sm text-silver">
              Practice with industry-specific buyer personas
            </p>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-onyx border-gunmetal">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-neonblue/10 flex items-center justify-center">
              <User className="h-5 w-5 text-neonblue" />
            </div>
            <div>
              <p className="text-2xl font-bold text-platinum">
                {PERSONAS.length}
              </p>
              <p className="text-xs text-mist">Total Personas</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-onyx border-gunmetal">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-automationgreen/10 flex items-center justify-center">
              <Shield className="h-5 w-5 text-automationgreen" />
            </div>
            <div>
              <p className="text-2xl font-bold text-automationgreen">
                {freeCount}
              </p>
              <p className="text-xs text-mist">Free Personas</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-onyx border-gunmetal">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-warningamber/10 flex items-center justify-center">
              <Lock className="h-5 w-5 text-warningamber" />
            </div>
            <div>
              <p className="text-2xl font-bold text-warningamber">{proCount}</p>
              <p className="text-xs text-mist">Pro Personas</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-onyx border-gunmetal">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-purple-400/10 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-400">
                {practicedCount}
              </p>
              <p className="text-xs text-mist">Practiced</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search + Filters */}
      <div className="space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-mist" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search personas by name, title, industry..."
              className="pl-10 bg-onyx border-gunmetal text-platinum placeholder:text-mist/50"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "border-gunmetal text-silver hover:text-platinum",
              showFilters && "border-neonblue/50 text-neonblue"
            )}
          >
            <Filter className="h-4 w-4 mr-1.5" />
            Filters
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 ml-1 transition-transform",
                showFilters && "rotate-180"
              )}
            />
          </Button>
        </div>

        {showFilters && (
          <Card className="bg-onyx border-gunmetal">
            <CardContent className="p-4 space-y-4">
              {/* Industry Filter */}
              <div>
                <label className="text-xs text-mist mb-2 block">
                  Industry
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedIndustry("all")}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border",
                      selectedIndustry === "all"
                        ? "bg-neonblue/10 text-neonblue border-neonblue/50"
                        : "bg-graphite text-silver border-gunmetal hover:border-neonblue/30"
                    )}
                  >
                    All Industries
                  </button>
                  {ALL_INDUSTRIES.map((ind) => {
                    const Icon = INDUSTRY_ICONS[ind];
                    return (
                      <button
                        key={ind}
                        onClick={() => setSelectedIndustry(ind)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border flex items-center gap-1.5",
                          selectedIndustry === ind
                            ? "bg-neonblue/10 text-neonblue border-neonblue/50"
                            : "bg-graphite text-silver border-gunmetal hover:border-neonblue/30"
                        )}
                      >
                        <Icon className="h-3 w-3" />
                        {ind}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Difficulty Filter */}
              <div>
                <label className="text-xs text-mist mb-2 block">
                  Difficulty
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedDifficulty("all")}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border",
                      selectedDifficulty === "all"
                        ? "bg-neonblue/10 text-neonblue border-neonblue/50"
                        : "bg-graphite text-silver border-gunmetal hover:border-neonblue/30"
                    )}
                  >
                    All Levels
                  </button>
                  {ALL_DIFFICULTIES.map((d) => {
                    const config = DIFFICULTY_CONFIG[d];
                    return (
                      <button
                        key={d}
                        onClick={() => setSelectedDifficulty(d)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border flex items-center gap-1.5",
                          selectedDifficulty === d
                            ? cn(config.bg, config.text, "border-transparent")
                            : "bg-graphite text-silver border-gunmetal hover:border-neonblue/30"
                        )}
                      >
                        <span
                          className={cn("w-2 h-2 rounded-full", config.dot)}
                        />
                        {config.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Persona Grid — grouped by industry */}
      {Object.keys(groupedByIndustry).length === 0 ? (
        <Card className="bg-onyx border-gunmetal">
          <CardContent className="py-16 flex flex-col items-center justify-center text-center">
            <div className="h-16 w-16 rounded-full bg-graphite flex items-center justify-center mb-4">
              <Search className="h-8 w-8 text-mist" />
            </div>
            <h3 className="text-lg font-semibold text-platinum mb-1">
              No personas found
            </h3>
            <p className="text-sm text-silver max-w-md">
              Try adjusting your search or filter criteria.
            </p>
          </CardContent>
        </Card>
      ) : (
        Object.entries(groupedByIndustry).map(([industry, personas]) => {
          const ind = industry as Industry;
          const Icon = INDUSTRY_ICONS[ind];
          const colors = INDUSTRY_COLORS[ind];
          return (
            <section key={industry}>
              <div className="flex items-center gap-2 mb-4">
                <div
                  className={cn(
                    "h-8 w-8 rounded-lg flex items-center justify-center",
                    colors.bg
                  )}
                >
                  <Icon className={cn("h-4 w-4", colors.text)} />
                </div>
                <h2 className="text-lg font-semibold text-platinum">
                  {industry}
                </h2>
                <Badge
                  variant="outline"
                  className="border-gunmetal text-mist text-xs ml-1"
                >
                  {personas.length} persona{personas.length !== 1 ? "s" : ""}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {personas.map((persona) => {
                  const diffConfig = DIFFICULTY_CONFIG[persona.difficulty];
                  const hasPracticed = practicedIds.includes(persona.id);

                  return (
                    <Card
                      key={persona.id}
                      className={cn(
                        "bg-onyx border-gunmetal group relative overflow-hidden transition-all hover:border-neonblue/30",
                        persona.isPro && "opacity-90"
                      )}
                    >
                      {/* Pro lock overlay */}
                      {persona.isPro && (
                        <div className="absolute top-3 right-3 z-10">
                          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-warningamber/10 border border-warningamber/20">
                            <Lock className="h-3 w-3 text-warningamber" />
                            <span className="text-[10px] font-medium text-warningamber">
                              PRO
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Practiced check */}
                      {hasPracticed && !persona.isPro && (
                        <div className="absolute top-3 right-3 z-10">
                          <CheckCircle2 className="h-5 w-5 text-automationgreen" />
                        </div>
                      )}

                      <CardContent className="p-5">
                        {/* Name & Title */}
                        <div className="mb-3">
                          <h3 className="text-base font-semibold text-platinum">
                            {persona.name}
                          </h3>
                          <p className="text-sm text-silver">{persona.title}</p>
                          <p className="text-xs text-mist mt-0.5">
                            {persona.companyType}
                          </p>
                        </div>

                        {/* Tags */}
                        <div className="flex items-center gap-2 flex-wrap mb-3">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs border-transparent",
                              colors.bg,
                              colors.text
                            )}
                          >
                            {persona.industry}
                          </Badge>
                          <Badge
                            className={cn(
                              "text-xs border-transparent",
                              diffConfig.bg,
                              diffConfig.text
                            )}
                          >
                            {diffConfig.label}
                          </Badge>
                        </div>

                        {/* Personality */}
                        <p className="text-sm text-silver leading-relaxed mb-3 line-clamp-2">
                          {persona.personality}
                        </p>

                        {/* Common Objections */}
                        <div className="mb-4">
                          <p className="text-xs text-mist mb-1.5 flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Common Objections
                          </p>
                          <div className="space-y-1">
                            {persona.commonObjections
                              .slice(0, 2)
                              .map((obj, i) => (
                                <p
                                  key={i}
                                  className="text-xs text-silver/80 pl-3 border-l-2 border-gunmetal"
                                >
                                  &ldquo;{obj}&rdquo;
                                </p>
                              ))}
                            {persona.commonObjections.length > 2 && (
                              <p className="text-[10px] text-mist pl-3">
                                +{persona.commonObjections.length - 2} more
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Action */}
                        {persona.isPro ? (
                          <Button
                            disabled
                            className="w-full bg-graphite border border-gunmetal text-mist cursor-not-allowed"
                            size="sm"
                          >
                            <Lock className="h-3.5 w-3.5 mr-1.5" />
                            Upgrade to Pro
                          </Button>
                        ) : (
                          <Link
                            href={`/dashboard/practice?persona=${persona.id}`}
                          >
                            <Button
                              className="w-full bg-neonblue hover:bg-neonblue/90 text-obsidian font-medium"
                              size="sm"
                            >
                              <Play className="h-3.5 w-3.5 mr-1.5" />
                              {hasPracticed
                                ? "Practice Again"
                                : "Start Practice"}
                            </Button>
                          </Link>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}
