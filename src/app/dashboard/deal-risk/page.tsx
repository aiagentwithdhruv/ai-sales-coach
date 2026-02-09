"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { getAuthToken } from "@/hooks/useCredits";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Target,
  Loader2,
  Clock,
  DollarSign,
  Building,
  Users,
  Swords,
  StickyNote,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  History,
  Trash2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Activity,
  Lightbulb,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

type DealStage =
  | "Discovery"
  | "Qualification"
  | "Demo"
  | "Proposal"
  | "Negotiation"
  | "Closing";

type RiskLevel = "Low" | "Medium" | "High";

interface RiskSignal {
  id: string;
  label: string;
  description: string;
  level: RiskLevel;
  coaching: string;
}

interface DealAnalysis {
  id: string;
  dealName: string;
  company: string;
  dealValue: number;
  stage: DealStage;
  daysInPipeline: number;
  lastContactDate: string;
  stakeholders: string;
  competitorMentioned: string;
  notes: string;
  healthScore: number;
  riskLevel: RiskLevel;
  riskSignals: RiskSignal[];
  recommendations: string[];
  aiAnalysis: string;
  analyzedAt: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const DEAL_STAGES: DealStage[] = [
  "Discovery",
  "Qualification",
  "Demo",
  "Proposal",
  "Negotiation",
  "Closing",
];

const STAGE_COLORS: Record<DealStage, string> = {
  Discovery: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  Qualification: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  Demo: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  Proposal: "bg-warningamber/20 text-warningamber border-warningamber/30",
  Negotiation: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  Closing: "bg-automationgreen/20 text-automationgreen border-automationgreen/30",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(value);
}

function daysSince(dateStr: string): number {
  const date = new Date(dateStr);
  const now = new Date();
  return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
}

function getRiskColor(level: RiskLevel): string {
  switch (level) {
    case "Low":
      return "text-automationgreen";
    case "Medium":
      return "text-warningamber";
    case "High":
      return "text-errorred";
  }
}

function getRiskBgColor(level: RiskLevel): string {
  switch (level) {
    case "Low":
      return "bg-automationgreen/10 border-automationgreen/30";
    case "Medium":
      return "bg-warningamber/10 border-warningamber/30";
    case "High":
      return "bg-errorred/10 border-errorred/30";
  }
}

function getScoreColor(score: number): string {
  if (score >= 70) return "#2DFF8E"; // automationgreen
  if (score >= 40) return "#FFB020"; // warningamber
  return "#FF4757"; // errorred
}

function getScoreGradient(score: number): string {
  if (score >= 70) return "from-automationgreen to-emerald";
  if (score >= 40) return "from-warningamber to-orange-500";
  return "from-errorred to-red-700";
}

// ─── Circular Gauge Component ────────────────────────────────────────────────

function HealthScoreGauge({
  score,
  riskLevel,
  size = 200,
}: {
  score: number;
  riskLevel: RiskLevel;
  size?: number;
}) {
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const color = getScoreColor(score);

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#2A2F36"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
          style={{
            filter: `drop-shadow(0 0 8px ${color}40)`,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="text-5xl font-bold font-mono"
          style={{ color }}
        >
          {score}
        </span>
        <span className="text-sm text-mist mt-1">out of 100</span>
        <Badge
          className={cn(
            "mt-2 text-xs font-semibold border",
            riskLevel === "Low" &&
              "bg-automationgreen/15 text-automationgreen border-automationgreen/30",
            riskLevel === "Medium" &&
              "bg-warningamber/15 text-warningamber border-warningamber/30",
            riskLevel === "High" &&
              "bg-errorred/15 text-errorred border-errorred/30"
          )}
        >
          {riskLevel} Risk
        </Badge>
      </div>
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function DealRiskPage() {
  // Form state
  const [dealName, setDealName] = useState("");
  const [company, setCompany] = useState("");
  const [dealValue, setDealValue] = useState<number>(0);
  const [stage, setStage] = useState<DealStage>("Discovery");
  const [daysInPipeline, setDaysInPipeline] = useState<number>(0);
  const [lastContactDate, setLastContactDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [stakeholders, setStakeholders] = useState("");
  const [competitorMentioned, setCompetitorMentioned] = useState("");
  const [notes, setNotes] = useState("");

  // Analysis state
  const [analysis, setAnalysis] = useState<DealAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResponse, setAiResponse] = useState("");

  // History state
  const [dealHistory, setDealHistory] = useState<DealAnalysis[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const responseRef = useRef<HTMLDivElement>(null);

  // Load history from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("deal_risk_history");
      if (stored) {
        setDealHistory(JSON.parse(stored));
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  // Auto-scroll AI response
  useEffect(() => {
    if (responseRef.current) {
      responseRef.current.scrollTop = responseRef.current.scrollHeight;
    }
  }, [aiResponse]);

  // ─── Local Risk Analysis ───────────────────────────────────────────────────

  function computeLocalRiskSignals(): RiskSignal[] {
    const signals: RiskSignal[] = [];

    // No follow-up (7+ days)
    const daysSinceContact = daysSince(lastContactDate);
    if (daysSinceContact >= 7) {
      signals.push({
        id: "no-followup",
        label: "No Recent Follow-up",
        description: `${daysSinceContact} days since last contact. Deals go cold after 7 days without engagement.`,
        level: daysSinceContact >= 14 ? "High" : "Medium",
        coaching:
          daysSinceContact >= 14
            ? "URGENT: Reach out today with a value-add touchpoint. Share an insight, case study, or relevant article. Do not simply ask for an update."
            : "Schedule a touchpoint within 48 hours. Reference their last conversation topic to maintain continuity.",
      });
    }

    // Missing decision makers
    const stakeholderCount = stakeholders
      .split(",")
      .filter((s) => s.trim()).length;
    if (stakeholderCount < 2) {
      signals.push({
        id: "missing-dm",
        label: "Missing Decision Makers",
        description: `Only ${stakeholderCount} stakeholder(s) identified. Most B2B deals require 3-6 stakeholders.`,
        level: "Medium",
        coaching:
          "Ask: 'Who else would need to be involved in this decision?' Map the buying committee: champion, economic buyer, technical evaluator, and potential blockers.",
      });
    }

    // Competitor mentioned
    if (competitorMentioned.trim()) {
      signals.push({
        id: "competitor",
        label: "Competitor in Play",
        description: `Competitor "${competitorMentioned}" is being evaluated. You need a clear differentiation strategy.`,
        level: "Medium",
        coaching:
          "Focus on unique value, not feature comparison. Ask: 'What criteria matter most in your decision?' Position against the competitor's weakness without naming them directly.",
      });
    }

    // Deal stalling (no stage change 14+ days)
    if (daysInPipeline >= 14 && ["Discovery", "Qualification"].includes(stage)) {
      signals.push({
        id: "stalling",
        label: "Deal Stalling",
        description: `${daysInPipeline} days in pipeline at ${stage} stage. This deal may be losing momentum.`,
        level: "High",
        coaching:
          "Create urgency with a mutual action plan. Propose specific next steps with dates. Consider a 'pattern interrupt' like an executive-level outreach or on-site visit.",
      });
    } else if (daysInPipeline >= 30) {
      signals.push({
        id: "stalling-extended",
        label: "Extended Deal Cycle",
        description: `${daysInPipeline} days in pipeline. This exceeds typical deal cycles.`,
        level: "High",
        coaching:
          "Re-qualify the deal. Confirm budget, authority, need, and timeline are still aligned. Consider whether this deal should be deprioritized.",
      });
    }

    // Vague next steps
    const notesLower = notes.toLowerCase();
    if (
      !notes.trim() ||
      notesLower.includes("follow up") ||
      notesLower.includes("tbd") ||
      notesLower.includes("maybe")
    ) {
      signals.push({
        id: "vague-next-steps",
        label: "Vague Next Steps",
        description:
          "No specific next steps documented. Deals without clear actions stall 2x more often.",
        level: "Medium",
        coaching:
          "Define a concrete next step with a date and owner. Use: 'Based on our conversation, I suggest we [action] by [date]. Does that work for you?'",
      });
    }

    // Price objections unresolved
    if (
      notesLower.includes("price") ||
      notesLower.includes("expensive") ||
      notesLower.includes("budget") ||
      notesLower.includes("cost concern")
    ) {
      signals.push({
        id: "price-objection",
        label: "Price Objections Unresolved",
        description:
          "Price or budget concerns detected in notes. This must be addressed before progressing.",
        level: "High",
        coaching:
          "Reframe from cost to ROI. Calculate the cost of inaction. Ask: 'If we could show you a 3x return in the first year, would the investment make sense?' Offer flexible payment terms if appropriate.",
      });
    }

    return signals;
  }

  function computeHealthScore(signals: RiskSignal[]): number {
    let score = 100;

    // Deduct for risk signals
    for (const signal of signals) {
      switch (signal.level) {
        case "High":
          score -= 20;
          break;
        case "Medium":
          score -= 10;
          break;
        case "Low":
          score -= 5;
          break;
      }
    }

    // Bonus for advanced stages
    const stageIndex = DEAL_STAGES.indexOf(stage);
    score += stageIndex * 3;

    // Bonus for multiple stakeholders
    const stakeholderCount = stakeholders
      .split(",")
      .filter((s) => s.trim()).length;
    if (stakeholderCount >= 3) score += 5;
    if (stakeholderCount >= 5) score += 5;

    // Penalty for no deal value
    if (dealValue <= 0) score -= 5;

    return Math.max(0, Math.min(100, score));
  }

  function computeRiskLevel(score: number): RiskLevel {
    if (score >= 70) return "Low";
    if (score >= 40) return "Medium";
    return "High";
  }

  // ─── AI Analysis ───────────────────────────────────────────────────────────

  const handleAnalyze = async () => {
    if (!dealName.trim()) return;
    setIsAnalyzing(true);
    setAiResponse("");

    // Compute local risk signals first
    const signals = computeLocalRiskSignals();
    const healthScore = computeHealthScore(signals);
    const riskLevel = computeRiskLevel(healthScore);

    // Build AI prompt
    const prompt = `You are an expert sales strategist and deal risk analyst. Analyze this deal and provide actionable coaching.

DEAL DETAILS:
- Deal Name: ${dealName}
- Company: ${company}
- Deal Value: ${formatCurrency(dealValue)}
- Stage: ${stage}
- Days in Pipeline: ${daysInPipeline}
- Last Contact: ${lastContactDate} (${daysSince(lastContactDate)} days ago)
- Key Stakeholders: ${stakeholders || "Not specified"}
- Competitor Mentioned: ${competitorMentioned || "None"}
- Notes: ${notes || "No notes"}

PRE-COMPUTED RISK SIGNALS:
${signals.map((s) => `- [${s.level}] ${s.label}: ${s.description}`).join("\n")}

HEALTH SCORE: ${healthScore}/100 (${riskLevel} Risk)

Please provide:

## Deal Assessment
A 2-3 sentence executive summary of this deal's health and likelihood to close.

## Key Risks & Coaching
For each risk signal, provide specific, actionable coaching advice. Be direct and tactical.

## Recommended Next Actions
Provide a prioritized list of 5-7 specific actions the sales rep should take in the next 7 days. Each action should be concrete with a clear outcome.

## Win Probability Factors
List 3 positive signals and 3 concerns about this deal.

## Strategic Recommendation
One paragraph with your overall strategic recommendation for this deal.

Be specific, tactical, and avoid generic advice. Reference the deal details directly.`;

    try {
      const token = await getAuthToken();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/ai/coach", {
        method: "POST",
        headers,
        body: JSON.stringify({
          message: prompt,
          model:
            localStorage.getItem("ai_model") ||
            "claude-sonnet-4-5-20250929",
        }),
      });

      if (!res.ok) {
        throw new Error(`Request failed: ${res.status}`);
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");
          for (const line of lines) {
            if (line.startsWith("0:")) {
              try {
                const text = JSON.parse(line.slice(2));
                fullText += text;
              } catch {
                fullText += line.slice(2);
              }
            } else if (line.trim()) {
              fullText += line;
            }
          }
          setAiResponse(fullText);
        }
      }

      // Build full analysis
      const dealAnalysis: DealAnalysis = {
        id: crypto.randomUUID(),
        dealName,
        company,
        dealValue,
        stage,
        daysInPipeline,
        lastContactDate,
        stakeholders,
        competitorMentioned,
        notes,
        healthScore,
        riskLevel,
        riskSignals: signals,
        recommendations: [],
        aiAnalysis: fullText,
        analyzedAt: new Date().toISOString(),
      };

      setAnalysis(dealAnalysis);

      // Save to history
      const updated = [dealAnalysis, ...dealHistory].slice(0, 50);
      setDealHistory(updated);
      localStorage.setItem("deal_risk_history", JSON.stringify(updated));
    } catch (err) {
      console.error("Deal analysis error:", err);
      setAiResponse("Failed to complete AI analysis. Please try again.");

      // Still show local analysis
      setAnalysis({
        id: crypto.randomUUID(),
        dealName,
        company,
        dealValue,
        stage,
        daysInPipeline,
        lastContactDate,
        stakeholders,
        competitorMentioned,
        notes,
        healthScore,
        riskLevel,
        riskSignals: signals,
        recommendations: [],
        aiAnalysis: "",
        analyzedAt: new Date().toISOString(),
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // ─── Load deal from history ────────────────────────────────────────────────

  const loadDeal = (deal: DealAnalysis) => {
    setDealName(deal.dealName);
    setCompany(deal.company);
    setDealValue(deal.dealValue);
    setStage(deal.stage);
    setDaysInPipeline(deal.daysInPipeline);
    setLastContactDate(deal.lastContactDate);
    setStakeholders(deal.stakeholders);
    setCompetitorMentioned(deal.competitorMentioned);
    setNotes(deal.notes);
    setAnalysis(deal);
    setAiResponse(deal.aiAnalysis);
    setShowHistory(false);
  };

  // ─── Delete deal from history ──────────────────────────────────────────────

  const deleteDeal = (id: string) => {
    const updated = dealHistory.filter((d) => d.id !== id);
    setDealHistory(updated);
    localStorage.setItem("deal_risk_history", JSON.stringify(updated));
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-platinum flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-neonblue" />
            Deal Risk Engine
          </h1>
          <p className="text-silver mt-1">
            AI-powered deal health scoring and risk analysis
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowHistory(!showHistory)}
            className="border-gunmetal text-silver hover:text-platinum gap-1"
          >
            <History className="h-4 w-4" />
            History ({dealHistory.length})
          </Button>
        </div>
      </div>

      {/* History Panel */}
      {showHistory && dealHistory.length > 0 && (
        <Card className="bg-graphite border-gunmetal">
          <CardHeader>
            <CardTitle className="text-platinum text-base">
              Deal Analysis History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {dealHistory.map((deal) => (
                <div
                  key={deal.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-onyx border border-gunmetal hover:border-neonblue/40 transition-colors"
                >
                  <button
                    onClick={() => loadDeal(deal)}
                    className="flex-1 text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold font-mono"
                        style={{
                          color: getScoreColor(deal.healthScore),
                          backgroundColor: `${getScoreColor(deal.healthScore)}15`,
                          border: `1px solid ${getScoreColor(deal.healthScore)}40`,
                        }}
                      >
                        {deal.healthScore}
                      </div>
                      <div>
                        <span className="text-sm font-medium text-platinum">
                          {deal.dealName}
                        </span>
                        <span className="text-sm text-mist ml-2">
                          {deal.company}
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge
                            className={cn(
                              "text-[10px] border",
                              STAGE_COLORS[deal.stage]
                            )}
                          >
                            {deal.stage}
                          </Badge>
                          <span className="text-xs text-silver">
                            {formatCurrency(deal.dealValue)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-mist mt-1">
                      Analyzed:{" "}
                      {new Date(deal.analyzedAt).toLocaleDateString()}{" "}
                      {new Date(deal.analyzedAt).toLocaleTimeString()}
                    </p>
                  </button>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => deleteDeal(deal.id)}
                    className="text-mist hover:text-errorred ml-2"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* ─── LEFT: Input Form (2 cols) ──────────────────────────── */}
        <div className="xl:col-span-2 space-y-6">
          <Card className="bg-graphite border-gunmetal">
            <CardHeader>
              <CardTitle className="text-platinum flex items-center gap-2 text-base">
                <Target className="h-4 w-4 text-neonblue" />
                Deal Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-xs text-silver mb-1.5">
                  Deal Name *
                </label>
                <Input
                  value={dealName}
                  onChange={(e) => setDealName(e.target.value)}
                  placeholder="e.g., Enterprise License - Q1 2026"
                  className="bg-onyx border-gunmetal text-platinum placeholder:text-mist focus:border-neonblue"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-silver mb-1.5">
                    Company
                  </label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-mist" />
                    <Input
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder="Acme Corp"
                      className="bg-onyx border-gunmetal text-platinum placeholder:text-mist focus:border-neonblue pl-9"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-silver mb-1.5">
                    Deal Value ($)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-mist" />
                    <Input
                      type="number"
                      min={0}
                      value={dealValue || ""}
                      onChange={(e) =>
                        setDealValue(Math.max(0, parseFloat(e.target.value) || 0))
                      }
                      placeholder="50000"
                      className="bg-onyx border-gunmetal text-platinum placeholder:text-mist focus:border-neonblue pl-9"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs text-silver mb-1.5">
                  Stage
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {DEAL_STAGES.map((s) => (
                    <button
                      key={s}
                      onClick={() => setStage(s)}
                      className={cn(
                        "px-3 py-2 rounded-lg text-xs font-medium transition-all border",
                        stage === s
                          ? STAGE_COLORS[s]
                          : "bg-onyx border-gunmetal text-mist hover:text-silver hover:border-steel"
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-silver mb-1.5">
                    Days in Pipeline
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-mist" />
                    <Input
                      type="number"
                      min={0}
                      value={daysInPipeline || ""}
                      onChange={(e) =>
                        setDaysInPipeline(
                          Math.max(0, parseInt(e.target.value) || 0)
                        )
                      }
                      placeholder="14"
                      className="bg-onyx border-gunmetal text-platinum placeholder:text-mist focus:border-neonblue pl-9"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-silver mb-1.5">
                    Last Contact Date
                  </label>
                  <Input
                    type="date"
                    value={lastContactDate}
                    onChange={(e) => setLastContactDate(e.target.value)}
                    className="bg-onyx border-gunmetal text-platinum focus:border-neonblue"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-silver mb-1.5">
                  <Users className="inline h-3 w-3 mr-1" />
                  Key Stakeholders
                </label>
                <Input
                  value={stakeholders}
                  onChange={(e) => setStakeholders(e.target.value)}
                  placeholder="e.g., Jane (CTO), Mike (VP Sales), Sarah (CFO)"
                  className="bg-onyx border-gunmetal text-platinum placeholder:text-mist focus:border-neonblue"
                />
                <p className="text-[10px] text-mist mt-1">
                  Comma-separated list of stakeholders
                </p>
              </div>

              <div>
                <label className="block text-xs text-silver mb-1.5">
                  <Swords className="inline h-3 w-3 mr-1" />
                  Competitor Mentioned
                </label>
                <Input
                  value={competitorMentioned}
                  onChange={(e) => setCompetitorMentioned(e.target.value)}
                  placeholder="e.g., Salesforce, HubSpot"
                  className="bg-onyx border-gunmetal text-platinum placeholder:text-mist focus:border-neonblue"
                />
              </div>

              <div>
                <label className="block text-xs text-silver mb-1.5">
                  <StickyNote className="inline h-3 w-3 mr-1" />
                  Notes
                </label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Key details, concerns raised, next steps discussed..."
                  className="min-h-[80px] bg-onyx border-gunmetal text-platinum placeholder:text-mist focus:border-neonblue text-sm"
                />
              </div>

              <Button
                onClick={handleAnalyze}
                disabled={isAnalyzing || !dealName.trim()}
                className="w-full bg-neonblue hover:bg-electricblue text-white gap-2 h-11"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analyzing Deal...
                  </>
                ) : (
                  <>
                    <Activity className="h-4 w-4" />
                    Analyze Risk
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* ─── RIGHT: Results (3 cols) ────────────────────────────── */}
        <div className="xl:col-span-3 space-y-6">
          {/* Health Score */}
          {(analysis || isAnalyzing) && (
            <Card className="bg-graphite border-gunmetal overflow-hidden">
              <div className="relative">
                {/* Subtle gradient background */}
                {analysis && (
                  <div
                    className={cn(
                      "absolute inset-0 opacity-5 bg-gradient-to-br",
                      getScoreGradient(analysis.healthScore)
                    )}
                  />
                )}
                <CardContent className="relative p-6">
                  {analysis ? (
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                      {/* Gauge */}
                      <HealthScoreGauge
                        score={analysis.healthScore}
                        riskLevel={analysis.riskLevel}
                      />

                      {/* Deal Summary */}
                      <div className="flex-1 space-y-3">
                        <div>
                          <h2 className="text-xl font-bold text-platinum">
                            {analysis.dealName}
                          </h2>
                          <p className="text-silver text-sm">
                            {analysis.company}{" "}
                            <span className="text-mist">|</span>{" "}
                            <span className="text-automationgreen font-mono font-semibold">
                              {formatCurrency(analysis.dealValue)}
                            </span>
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Badge
                            className={cn(
                              "border text-xs",
                              STAGE_COLORS[analysis.stage]
                            )}
                          >
                            {analysis.stage}
                          </Badge>
                          <Badge className="bg-onyx text-silver border-gunmetal text-xs border">
                            <Clock className="h-3 w-3 mr-1" />
                            {analysis.daysInPipeline}d in pipeline
                          </Badge>
                          <Badge className="bg-onyx text-silver border-gunmetal text-xs border">
                            <Users className="h-3 w-3 mr-1" />
                            {stakeholders.split(",").filter((s) => s.trim())
                              .length || 0}{" "}
                            stakeholders
                          </Badge>
                        </div>

                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <AlertTriangle className="h-4 w-4 text-errorred" />
                            <span className="text-errorred font-medium">
                              {
                                analysis.riskSignals.filter(
                                  (s) => s.level === "High"
                                ).length
                              }
                            </span>
                            <span className="text-mist">High</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <AlertTriangle className="h-4 w-4 text-warningamber" />
                            <span className="text-warningamber font-medium">
                              {
                                analysis.riskSignals.filter(
                                  (s) => s.level === "Medium"
                                ).length
                              }
                            </span>
                            <span className="text-mist">Medium</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <CheckCircle2 className="h-4 w-4 text-automationgreen" />
                            <span className="text-mist">
                              {6 - analysis.riskSignals.length} checks passed
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center py-8">
                      <div className="flex items-center gap-3 text-mist">
                        <Loader2 className="h-6 w-6 animate-spin text-neonblue" />
                        <span className="text-lg">
                          Analyzing deal risk factors...
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </div>
            </Card>
          )}

          {/* Risk Signal Cards */}
          {analysis && analysis.riskSignals.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-platinum mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-warningamber" />
                Risk Signals Detected ({analysis.riskSignals.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {analysis.riskSignals.map((signal) => (
                  <Card
                    key={signal.id}
                    className={cn(
                      "border transition-colors",
                      getRiskBgColor(signal.level)
                    )}
                  >
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {signal.level === "High" ? (
                            <XCircle
                              className={cn(
                                "h-4 w-4 flex-shrink-0",
                                getRiskColor(signal.level)
                              )}
                            />
                          ) : (
                            <AlertTriangle
                              className={cn(
                                "h-4 w-4 flex-shrink-0",
                                getRiskColor(signal.level)
                              )}
                            />
                          )}
                          <span
                            className={cn(
                              "text-sm font-semibold",
                              getRiskColor(signal.level)
                            )}
                          >
                            {signal.label}
                          </span>
                        </div>
                        <Badge
                          className={cn(
                            "text-[10px] border",
                            signal.level === "High" &&
                              "bg-errorred/20 text-errorred border-errorred/40",
                            signal.level === "Medium" &&
                              "bg-warningamber/20 text-warningamber border-warningamber/40"
                          )}
                        >
                          {signal.level}
                        </Badge>
                      </div>
                      <p className="text-xs text-silver leading-relaxed">
                        {signal.description}
                      </p>
                      <div className="bg-obsidian/50 rounded-lg p-3 border border-gunmetal">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Lightbulb className="h-3 w-3 text-neonblue" />
                          <span className="text-[10px] text-neonblue font-semibold uppercase tracking-wide">
                            Coaching
                          </span>
                        </div>
                        <p className="text-xs text-platinum leading-relaxed">
                          {signal.coaching}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* No Risks Found */}
          {analysis && analysis.riskSignals.length === 0 && (
            <Card className="bg-automationgreen/5 border-automationgreen/20">
              <CardContent className="p-6 text-center">
                <CheckCircle2 className="h-10 w-10 text-automationgreen mx-auto mb-2" />
                <h3 className="text-lg font-semibold text-automationgreen">
                  No Major Risks Detected
                </h3>
                <p className="text-sm text-silver mt-1">
                  This deal appears to be in good health. Keep monitoring and
                  maintaining engagement.
                </p>
              </CardContent>
            </Card>
          )}

          {/* AI Analysis */}
          {(aiResponse || isAnalyzing) && (
            <Card className="bg-graphite border-gunmetal">
              <CardHeader>
                <CardTitle className="text-platinum flex items-center gap-2 text-base">
                  <Sparkles className="h-4 w-4 text-warningamber" />
                  AI Strategic Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  ref={responseRef}
                  className="prose prose-invert prose-sm max-w-none max-h-[500px] overflow-y-auto prose-headings:text-platinum prose-p:text-gray-200 prose-strong:text-white prose-li:text-gray-200 prose-td:text-gray-300 prose-th:text-platinum prose-th:bg-onyx prose-a:text-neonblue prose-code:text-automationgreen prose-blockquote:text-gray-300 prose-blockquote:border-neonblue/50"
                >
                  {aiResponse ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {aiResponse}
                    </ReactMarkdown>
                  ) : (
                    <div className="flex items-center gap-2 text-mist">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Running AI analysis...
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Empty State */}
          {!analysis && !isAnalyzing && (
            <Card className="bg-onyx border-gunmetal">
              <CardContent className="p-8 text-center">
                <div className="w-20 h-20 rounded-full bg-neonblue/10 flex items-center justify-center mx-auto mb-4">
                  <ShieldAlert className="h-10 w-10 text-neonblue" />
                </div>
                <h3 className="text-lg font-semibold text-platinum mb-2">
                  Analyze Your Deal
                </h3>
                <p className="text-sm text-silver max-w-md mx-auto mb-6">
                  Enter your deal details on the left and click
                  &quot;Analyze Risk&quot; to get a comprehensive health score,
                  risk signals, and AI-powered coaching recommendations.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-lg mx-auto">
                  {[
                    {
                      icon: Activity,
                      label: "Health Score",
                      desc: "0-100 gauge",
                    },
                    {
                      icon: AlertTriangle,
                      label: "Risk Signals",
                      desc: "Auto-detected",
                    },
                    {
                      icon: Lightbulb,
                      label: "AI Coaching",
                      desc: "Per risk signal",
                    },
                    {
                      icon: ArrowRight,
                      label: "Next Actions",
                      desc: "Prioritized list",
                    },
                    {
                      icon: TrendingUp,
                      label: "Win Factors",
                      desc: "Positive signals",
                    },
                    {
                      icon: BarChart3,
                      label: "History",
                      desc: "Score trends",
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="p-3 rounded-lg bg-graphite border border-gunmetal"
                    >
                      <item.icon className="h-5 w-5 text-neonblue mx-auto mb-1" />
                      <p className="text-xs font-medium text-platinum">
                        {item.label}
                      </p>
                      <p className="text-[10px] text-mist">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
