"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  FileSearch,
  Sparkles,
  Loader2,
  Copy,
  Check,
  Download,
  Send,
  Building2,
  Lightbulb,
  FileText,
  RotateCcw,
  X,
  ChevronDown,
  Info,
  Quote,
  Wrench,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getAuthToken } from "@/hooks/useCredits";
import { useCredits } from "@/hooks/useCredits";
import { saveSession } from "@/lib/session-history";
import { exportToPDF } from "@/lib/export-pdf";

// ============================================================
// Types
// ============================================================

type Severity = "high" | "medium" | "low";
type Industry = "SaaS" | "Finance" | "Healthcare" | "Insurance" | "General";

interface ComplianceFinding {
  id: string;
  type: string;
  severity: Severity;
  quote: string;
  explanation: string;
  remediation: string;
}

interface ComplianceResult {
  score: number;
  findings: ComplianceFinding[];
  summary: string;
  rawResponse: string;
}

// ============================================================
// Constants
// ============================================================

const INDUSTRIES: { value: Industry; label: string; description: string }[] = [
  { value: "SaaS", label: "SaaS / Technology", description: "Software & tech sales compliance" },
  { value: "Finance", label: "Finance / Banking", description: "SEC, FINRA, and financial regulations" },
  { value: "Healthcare", label: "Healthcare", description: "HIPAA, FDA, and healthcare regulations" },
  { value: "Insurance", label: "Insurance", description: "State insurance regulations & disclosures" },
  { value: "General", label: "General", description: "Standard sales compliance best practices" },
];

const SEVERITY_CONFIG: Record<Severity, { label: string; color: string; bgColor: string; borderColor: string; icon: typeof AlertCircle }> = {
  high: {
    label: "High",
    color: "text-errorred",
    bgColor: "bg-errorred/10",
    borderColor: "border-errorred/30",
    icon: AlertCircle,
  },
  medium: {
    label: "Medium",
    color: "text-warningamber",
    bgColor: "bg-warningamber/10",
    borderColor: "border-warningamber/30",
    icon: AlertTriangle,
  },
  low: {
    label: "Low",
    color: "text-automationgreen",
    bgColor: "bg-automationgreen/10",
    borderColor: "border-automationgreen/30",
    icon: CheckCircle2,
  },
};

const FINDING_TYPES = [
  { key: "Unapproved Claims", severity: "high" as Severity },
  { key: "Missing Disclosures", severity: "medium" as Severity },
  { key: "Competitor Disparagement", severity: "medium" as Severity },
  { key: "Pricing Inaccuracies", severity: "high" as Severity },
  { key: "Regulatory Violations", severity: "high" as Severity },
  { key: "Best Practices Followed", severity: "low" as Severity },
];

const SAMPLE_TRANSCRIPT = `Sales Rep: Hey Mark, great connecting with you today. So I wanted to tell you about our platform - it's the #1 rated CRM in the industry and it's guaranteed to increase your revenue by at least 40% within the first quarter.

Prospect: That sounds impressive. How does it compare to Salesforce?

Sales Rep: Oh, Salesforce is terrible honestly. Their platform crashes all the time and their customer support is basically non-existent. We're light years ahead of them in every category. Plus they've had major data breaches recently that they tried to cover up.

Prospect: What about pricing?

Sales Rep: We're very affordable - just $29 per user per month and that includes everything. No hidden fees whatsoever. And I can guarantee that price will never go up.

Prospect: Do you comply with SOC 2?

Sales Rep: Absolutely, we're fully SOC 2 compliant, HIPAA compliant, GDPR compliant - we have every certification you can think of. Your data is 100% safe with us, guaranteed.`;

// ============================================================
// Parse AI response into structured findings
// ============================================================

function parseComplianceResponse(text: string): ComplianceResult {
  const findings: ComplianceFinding[] = [];
  let score = 0;
  let summary = "";

  // Extract score
  const scoreMatch = text.match(/(?:Overall\s*)?Compliance\s*Score[:\s]*(\d+)\s*(?:\/\s*100|%)?/i);
  if (scoreMatch) {
    score = parseInt(scoreMatch[1], 10);
  }

  // Extract summary
  const summaryMatch = text.match(/(?:##\s*)?(?:Executive\s*)?Summary[:\s]*\n([\s\S]*?)(?=\n##|\n---|\n\*\*Finding|$)/i);
  if (summaryMatch) {
    summary = summaryMatch[1].trim();
  }

  // Extract findings using a pattern that matches numbered findings
  const findingBlocks = text.split(/(?=\*\*Finding\s*\d+|\*\*\d+\.\s|###\s*Finding\s*\d+|---\s*\n\*\*Type)/i);

  for (const block of findingBlocks) {
    if (!block.trim()) continue;

    // Try to extract type
    const typeMatch = block.match(/(?:\*\*)?Type(?:\*\*)?[:\s]*(.*?)(?:\n|$)/i);
    // Try to extract severity
    const sevMatch = block.match(/(?:\*\*)?Severity(?:\*\*)?[:\s]*(high|medium|low)/i);
    // Try to extract quote
    const quoteMatch = block.match(/(?:\*\*)?Quote(?:\*\*)?[:\s]*[""]?([\s\S]*?)[""]?(?=\n\*\*|$)/i) ||
      block.match(/(?:\*\*)?(?:Quoted?\s*(?:Text|Passage))(?:\*\*)?[:\s]*[""]?([\s\S]*?)[""]?(?=\n\*\*|$)/i);
    // Try to extract explanation
    const explMatch = block.match(/(?:\*\*)?(?:Explanation|Issue|Description)(?:\*\*)?[:\s]*([\s\S]*?)(?=\n\*\*|$)/i);
    // Try to extract remediation
    const remMatch = block.match(/(?:\*\*)?(?:Remediation|Recommendation|Fix|Suggestion)(?:\*\*)?[:\s]*([\s\S]*?)(?=\n\*\*|\n---|$)/i);

    if (typeMatch || sevMatch) {
      const finding: ComplianceFinding = {
        id: `f-${findings.length + 1}`,
        type: typeMatch ? typeMatch[1].trim().replace(/\*\*/g, "") : "General",
        severity: (sevMatch ? sevMatch[1].toLowerCase() : "medium") as Severity,
        quote: quoteMatch ? quoteMatch[1].trim().replace(/\*\*/g, "").replace(/^[""]|[""]$/g, "") : "",
        explanation: explMatch ? explMatch[1].trim().replace(/\*\*/g, "") : "",
        remediation: remMatch ? remMatch[1].trim().replace(/\*\*/g, "") : "",
      };
      findings.push(finding);
    }
  }

  return { score, findings, summary, rawResponse: text };
}

// ============================================================
// Component
// ============================================================

export default function CompliancePage() {
  // Input state
  const [transcript, setTranscript] = useState("");
  const [industry, setIndustry] = useState<Industry>("General");
  const [showIndustryPicker, setShowIndustryPicker] = useState(false);

  // Result state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [rawResponse, setRawResponse] = useState("");
  const [result, setResult] = useState<ComplianceResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"cards" | "raw">("cards");

  // General
  const [copied, setCopied] = useState(false);
  const responseRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const { refetch: refetchCredits } = useCredits();

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  // Auto-scroll
  useEffect(() => {
    if (responseRef.current) {
      responseRef.current.scrollTop = responseRef.current.scrollHeight;
    }
  }, [rawResponse]);

  // ---- Analysis ----

  const handleAnalyze = async () => {
    if (!transcript.trim() || isAnalyzing) return;

    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();

    setIsAnalyzing(true);
    setRawResponse("");
    setResult(null);
    setError(null);

    try {
      const token = await getAuthToken();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const model = localStorage.getItem("ai_model") || "claude-sonnet-4-5-20250929";

      const prompt = `You are an expert sales compliance analyst specializing in ${industry} industry regulations. Analyze the following sales transcript/email for compliance issues.

TRANSCRIPT/EMAIL:
"""
${transcript}
"""

Analyze for ALL of the following categories:
1. **Unapproved Claims** - Unsubstantiated guarantees, false statistics, misleading performance claims
2. **Missing Disclosures** - Required disclaimers, terms, or disclosures that are absent
3. **Competitor Disparagement** - False or unfair statements about competitors
4. **Pricing Inaccuracies** - Misleading pricing, hidden fee omissions, false price guarantees
5. **Regulatory Violations** - Industry-specific regulation violations (${industry})
6. **Best Practices Followed** - Things the sales rep did well from a compliance perspective

For EACH finding, use this EXACT format:

---
**Type:** [Category name from above]
**Severity:** [high/medium/low]
**Quote:** "[Exact quote from transcript]"
**Explanation:** [Why this is an issue or why this is good practice]
**Remediation:** [Specific recommendation for how to fix or improve]

After all findings, provide:

## Compliance Score: [0-100]

## Summary
[2-3 sentence executive summary of the overall compliance assessment]

IMPORTANT: Be thorough. Check EVERY sentence for potential issues. Even minor concerns should be flagged. For Best Practices, highlight anything the rep did correctly.`;

      const res = await fetch("/api/ai/coach", {
        method: "POST",
        headers,
        body: JSON.stringify({
          type: "general",
          message: prompt,
          model,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        if (res.status === 402) throw new Error("Out of credits! Request more credits to continue.");
        throw new Error(errorData.details || errorData.error || `Request failed (${res.status})`);
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const text = decoder.decode(value);
          fullText += text;
          setRawResponse(fullText);
        }
      }

      // Parse the complete response
      const parsed = parseComplianceResponse(fullText);
      setResult(parsed);

      // Save session
      saveSession({
        type: "tool",
        toolType: "compliance-analysis",
        title: `Compliance: ${industry} - Score ${parsed.score}/100`,
        input: transcript.slice(0, 200),
        output: fullText,
        model,
      });

      refetchCredits();
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(msg);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // ---- Export PDF ----

  const handleExportPDF = () => {
    if (!result) return;
    exportToPDF({
      title: "Talk-Track Compliance Report",
      subtitle: `Industry: ${industry} | Score: ${result.score}/100`,
      content: result.rawResponse,
      metadata: {
        "Analysis Date": new Date().toLocaleDateString(),
        "Industry": industry,
        "Compliance Score": `${result.score}/100`,
        "Total Findings": `${result.findings.length}`,
        "High Severity": `${result.findings.filter((f) => f.severity === "high").length}`,
        "Medium Severity": `${result.findings.filter((f) => f.severity === "medium").length}`,
        "Best Practices": `${result.findings.filter((f) => f.severity === "low").length}`,
      },
    });
  };

  // ---- Copy ----

  const handleCopy = () => {
    navigator.clipboard.writeText(rawResponse || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ---- Load Sample ----

  const handleLoadSample = () => {
    setTranscript(SAMPLE_TRANSCRIPT);
    setIndustry("SaaS");
    setResult(null);
    setRawResponse("");
    setError(null);
  };

  // ---- Score color ----

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-automationgreen";
    if (score >= 60) return "text-warningamber";
    return "text-errorred";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return "bg-automationgreen/10 border-automationgreen/30";
    if (score >= 60) return "bg-warningamber/10 border-warningamber/30";
    return "bg-errorred/10 border-errorred/30";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return "Excellent";
    if (score >= 80) return "Good";
    if (score >= 70) return "Acceptable";
    if (score >= 60) return "Needs Improvement";
    if (score >= 40) return "Poor";
    return "Critical Issues";
  };

  // ---- Severity counts ----

  const severityCounts = result
    ? {
        high: result.findings.filter((f) => f.severity === "high").length,
        medium: result.findings.filter((f) => f.severity === "medium").length,
        low: result.findings.filter((f) => f.severity === "low").length,
      }
    : { high: 0, medium: 0, low: 0 };

  // ============================================================
  // Render
  // ============================================================

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-platinum flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-neonblue" />
          Talk-Track Compliance
        </h1>
        <p className="text-silver mt-1">
          Analyze sales transcripts and emails for compliance issues, regulatory violations, and best practices
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Transcript Input */}
          <Card className="bg-graphite border-gunmetal">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-platinum flex items-center gap-2">
                  <FileSearch className="h-5 w-5 text-neonblue" />
                  Paste Transcript or Sales Email
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLoadSample}
                  className="border-gunmetal text-silver hover:text-platinum text-xs"
                >
                  <FileText className="h-3 w-3 mr-1" />
                  Load Sample
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Paste your call transcript, sales email, or any customer-facing communication here for compliance analysis..."
                className="min-h-[200px] bg-onyx border-gunmetal text-platinum placeholder:text-mist focus:border-neonblue font-mono text-xs leading-relaxed"
              />

              {/* Industry Selector */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <label className="text-xs text-mist whitespace-nowrap flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  Industry:
                </label>
                <div className="flex gap-2 flex-wrap">
                  {INDUSTRIES.map((ind) => (
                    <button
                      key={ind.value}
                      onClick={() => setIndustry(ind.value)}
                      className={cn(
                        "px-3 py-2 rounded-lg text-xs font-medium transition-all border",
                        industry === ind.value
                          ? "bg-neonblue/10 border-neonblue/30 text-neonblue"
                          : "bg-onyx border-gunmetal text-silver hover:text-platinum"
                      )}
                    >
                      {ind.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Character count and submit */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-mist">
                  {transcript.length > 0
                    ? `${transcript.length.toLocaleString()} characters | ~${Math.ceil(transcript.split(/\s+/).length)} words`
                    : "No content yet"}
                </span>
                <Button
                  onClick={handleAnalyze}
                  disabled={!transcript.trim() || isAnalyzing}
                  className="bg-neonblue hover:bg-neonblue/80 text-white"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4 mr-2" />
                      Analyze for Compliance
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Error */}
          {error && (
            <Card className="bg-errorred/5 border-errorred/30">
              <CardContent className="p-4 flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-errorred shrink-0" />
                <div>
                  <p className="text-sm text-errorred font-medium">Analysis failed</p>
                  <p className="text-xs text-silver mt-1">{error}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Loading State */}
          {isAnalyzing && rawResponse && (
            <Card className="bg-graphite border-gunmetal">
              <CardHeader>
                <CardTitle className="text-platinum flex items-center gap-2">
                  <Loader2 className="h-5 w-5 text-neonblue animate-spin" />
                  Analyzing Compliance...
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div ref={responseRef} className="prose prose-invert prose-sm max-w-none max-h-[400px] overflow-y-auto prose-headings:text-platinum prose-p:text-gray-200 prose-strong:text-white prose-li:text-gray-200 prose-a:text-neonblue prose-code:text-automationgreen">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{rawResponse}</ReactMarkdown>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Results */}
          {result && !isAnalyzing && (
            <div className="space-y-6">
              {/* Score Card */}
              <Card className={cn("border", getScoreBgColor(result.score))}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-6">
                    {/* Score Circle */}
                    <div className="relative">
                      <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="8" className="text-gunmetal" />
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="8"
                          strokeDasharray={`${(result.score / 100) * 251.2} 251.2`}
                          strokeLinecap="round"
                          className={getScoreColor(result.score)}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className={cn("text-2xl font-bold", getScoreColor(result.score))}>{result.score}</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className={cn("text-lg font-bold", getScoreColor(result.score))}>
                        {getScoreLabel(result.score)}
                      </h3>
                      <p className="text-sm text-silver mt-1">{result.summary || "Compliance analysis complete."}</p>
                      <div className="flex items-center gap-4 mt-3">
                        <div className="flex items-center gap-1.5">
                          <AlertCircle className="h-3.5 w-3.5 text-errorred" />
                          <span className="text-xs text-silver">{severityCounts.high} High</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <AlertTriangle className="h-3.5 w-3.5 text-warningamber" />
                          <span className="text-xs text-silver">{severityCounts.medium} Medium</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-automationgreen" />
                          <span className="text-xs text-silver">{severityCounts.low} Best Practice</span>
                        </div>
                      </div>
                    </div>
                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      <Button
                        onClick={handleExportPDF}
                        variant="outline"
                        size="sm"
                        className="border-gunmetal text-silver hover:text-platinum"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Export PDF
                      </Button>
                      <Button
                        onClick={handleCopy}
                        variant="outline"
                        size="sm"
                        className="border-gunmetal text-silver hover:text-platinum"
                      >
                        {copied ? (
                          <>
                            <Check className="h-4 w-4 mr-1 text-automationgreen" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4 mr-1" />
                            Copy
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* View Toggle */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode("cards")}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border",
                    viewMode === "cards"
                      ? "bg-neonblue/10 border-neonblue/30 text-neonblue"
                      : "bg-onyx border-gunmetal text-silver hover:text-platinum"
                  )}
                >
                  <BarChart3 className="h-3 w-3 inline mr-1" />
                  Finding Cards
                </button>
                <button
                  onClick={() => setViewMode("raw")}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border",
                    viewMode === "raw"
                      ? "bg-neonblue/10 border-neonblue/30 text-neonblue"
                      : "bg-onyx border-gunmetal text-silver hover:text-platinum"
                  )}
                >
                  <FileText className="h-3 w-3 inline mr-1" />
                  Full Report
                </button>
              </div>

              {/* Card View */}
              {viewMode === "cards" && (
                <div className="space-y-4">
                  {result.findings.length > 0 ? (
                    result.findings.map((finding) => {
                      const config = SEVERITY_CONFIG[finding.severity];
                      const SeverityIcon = config.icon;
                      return (
                        <Card key={finding.id} className={cn("border", config.borderColor)}>
                          <CardContent className="p-5">
                            <div className="flex items-start gap-4">
                              {/* Severity Icon */}
                              <div className={cn("p-2 rounded-lg shrink-0", config.bgColor)}>
                                <SeverityIcon className={cn("h-5 w-5", config.color)} />
                              </div>

                              <div className="flex-1 min-w-0 space-y-3">
                                {/* Header */}
                                <div className="flex items-center gap-3 flex-wrap">
                                  <h4 className="text-sm font-semibold text-platinum">{finding.type}</h4>
                                  <Badge className={cn("text-[10px] px-2 py-0.5 border-0", config.bgColor, config.color)}>
                                    {config.label} Severity
                                  </Badge>
                                </div>

                                {/* Quote */}
                                {finding.quote && (
                                  <div className="flex gap-2 p-3 bg-onyx/50 rounded-lg border border-gunmetal">
                                    <Quote className="h-4 w-4 text-mist shrink-0 mt-0.5" />
                                    <p className="text-xs text-silver italic leading-relaxed">
                                      &ldquo;{finding.quote}&rdquo;
                                    </p>
                                  </div>
                                )}

                                {/* Explanation */}
                                {finding.explanation && (
                                  <div className="flex gap-2">
                                    <Info className="h-4 w-4 text-mist shrink-0 mt-0.5" />
                                    <p className="text-xs text-silver leading-relaxed">{finding.explanation}</p>
                                  </div>
                                )}

                                {/* Remediation */}
                                {finding.remediation && (
                                  <div className="flex gap-2 p-3 bg-neonblue/5 rounded-lg border border-neonblue/10">
                                    <Wrench className="h-4 w-4 text-neonblue shrink-0 mt-0.5" />
                                    <div>
                                      <p className="text-[10px] text-neonblue font-medium mb-1">Recommended Fix</p>
                                      <p className="text-xs text-silver leading-relaxed">{finding.remediation}</p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })
                  ) : (
                    <Card className="bg-graphite border-gunmetal">
                      <CardContent className="p-8 text-center">
                        <Info className="h-8 w-8 text-mist mx-auto mb-3" />
                        <p className="text-sm text-silver">
                          Could not parse individual findings. Switch to &quot;Full Report&quot; view to see the complete analysis.
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* Raw View */}
              {viewMode === "raw" && (
                <Card className="bg-graphite border-gunmetal">
                  <CardContent className="p-6">
                    <div className="prose prose-invert prose-sm max-w-none max-h-[600px] overflow-y-auto prose-headings:text-platinum prose-p:text-gray-200 prose-strong:text-white prose-li:text-gray-200 prose-td:text-gray-300 prose-th:text-platinum prose-th:bg-onyx prose-a:text-neonblue prose-code:text-automationgreen prose-blockquote:text-gray-300 prose-blockquote:border-neonblue/50">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{rawResponse}</ReactMarkdown>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Re-analyze */}
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  onClick={() => {
                    setResult(null);
                    setRawResponse("");
                  }}
                  className="border-gunmetal text-silver hover:text-platinum"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Analyze Another Transcript
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="space-y-4">
          {/* Industry Info */}
          <Card className="bg-graphite border-gunmetal">
            <CardHeader>
              <CardTitle className="text-platinum text-base flex items-center gap-2">
                <Building2 className="h-4 w-4 text-neonblue" />
                Industry: {industry}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-silver leading-relaxed">
                {industry === "SaaS" && "Analysis includes checks for: unsubstantiated performance claims, misleading feature comparisons, data security misrepresentations, and SaaS pricing transparency requirements."}
                {industry === "Finance" && "Analysis includes checks for: SEC/FINRA regulations, required risk disclosures, misleading return projections, fee transparency, and suitability requirements."}
                {industry === "Healthcare" && "Analysis includes checks for: HIPAA compliance claims, FDA-regulated claims, patient data guarantees, clinical efficacy statements, and healthcare privacy regulations."}
                {industry === "Insurance" && "Analysis includes checks for: state insurance regulations, required policy disclosures, misleading coverage claims, premium guarantees, and insurance licensing requirements."}
                {industry === "General" && "Analysis includes checks for: false or misleading claims, competitor disparagement, pricing transparency, required disclosures, and general sales best practices."}
              </p>
            </CardContent>
          </Card>

          {/* What We Check */}
          <Card className="bg-graphite border-gunmetal">
            <CardHeader>
              <CardTitle className="text-platinum text-base flex items-center gap-2">
                <FileSearch className="h-4 w-4 text-warningamber" />
                What We Analyze
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {FINDING_TYPES.map((ft) => {
                const config = SEVERITY_CONFIG[ft.severity];
                const Icon = config.icon;
                return (
                  <div key={ft.key} className="flex items-center gap-2">
                    <Icon className={cn("h-3.5 w-3.5 shrink-0", config.color)} />
                    <span className="text-xs text-silver">{ft.key}</span>
                    <Badge className={cn("ml-auto text-[9px] px-1.5 py-0 border-0", config.bgColor, config.color)}>
                      {config.label}
                    </Badge>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Quick Stats (when results available) */}
          {result && (
            <Card className="bg-graphite border-gunmetal">
              <CardHeader>
                <CardTitle className="text-platinum text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-neonblue" />
                  Analysis Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-2 bg-onyx rounded-lg">
                  <span className="text-xs text-mist">Compliance Score</span>
                  <span className={cn("text-sm font-bold", getScoreColor(result.score))}>{result.score}/100</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-onyx rounded-lg">
                  <span className="text-xs text-mist">Total Findings</span>
                  <span className="text-sm font-bold text-platinum">{result.findings.length}</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-onyx rounded-lg">
                  <span className="text-xs text-mist flex items-center gap-1">
                    <AlertCircle className="h-3 w-3 text-errorred" />
                    High Severity
                  </span>
                  <span className="text-sm font-bold text-errorred">{severityCounts.high}</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-onyx rounded-lg">
                  <span className="text-xs text-mist flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3 text-warningamber" />
                    Medium Severity
                  </span>
                  <span className="text-sm font-bold text-warningamber">{severityCounts.medium}</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-onyx rounded-lg">
                  <span className="text-xs text-mist flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-automationgreen" />
                    Best Practices
                  </span>
                  <span className="text-sm font-bold text-automationgreen">{severityCounts.low}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tips Card */}
          <Card className="bg-onyx border-gunmetal">
            <CardContent className="p-4">
              <h4 className="font-medium text-platinum mb-2 flex items-center gap-2 text-sm">
                <Lightbulb className="h-4 w-4 text-warningamber" />
                Compliance Tips
              </h4>
              <ul className="space-y-2 text-xs text-silver">
                <li>- Never make unsubstantiated performance guarantees</li>
                <li>- Avoid absolute terms like &quot;guaranteed&quot; or &quot;100%&quot;</li>
                <li>- Don&apos;t disparage competitors with unverified claims</li>
                <li>- Always disclose pricing terms and conditions</li>
                <li>- Only claim certifications you actually hold</li>
                <li>- Document all verbal promises in writing</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
