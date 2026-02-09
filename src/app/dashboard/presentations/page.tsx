"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { getAuthToken, useCredits } from "@/hooks/useCredits";
import { saveSession } from "@/lib/session-history";
import { exportToPDF } from "@/lib/export-pdf";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Presentation,
  Sparkles,
  Download,
  Copy,
  Mail,
  Loader2,
  FileDown,
  Send,
  Check,
  ChevronDown,
  AlertCircle,
  Layers,
  LayoutTemplate,
  Briefcase,
  BarChart3,
  Users,
  Award,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Template types
// ---------------------------------------------------------------------------

interface TemplateType {
  id: string;
  label: string;
  icon: React.ElementType;
  description: string;
  defaultSlides: number;
  color: string;
}

const TEMPLATE_TYPES: TemplateType[] = [
  {
    id: "pitch-deck",
    label: "Pitch Deck",
    icon: Zap,
    description: "Persuasive deck for prospects & investors",
    defaultSlides: 12,
    color: "text-neonblue",
  },
  {
    id: "product-demo",
    label: "Product Demo",
    icon: Layers,
    description: "Walk through features & use cases",
    defaultSlides: 10,
    color: "text-automationgreen",
  },
  {
    id: "sales-proposal",
    label: "Sales Proposal",
    icon: Briefcase,
    description: "Formal proposal with pricing & ROI",
    defaultSlides: 15,
    color: "text-purple-400",
  },
  {
    id: "quarterly-review",
    label: "Quarterly Review",
    icon: BarChart3,
    description: "QBR with metrics, wins & roadmap",
    defaultSlides: 14,
    color: "text-warningamber",
  },
  {
    id: "client-onboarding",
    label: "Client Onboarding",
    icon: Users,
    description: "Welcome deck for new customers",
    defaultSlides: 8,
    color: "text-cyan-400",
  },
  {
    id: "case-study",
    label: "Case Study",
    icon: Award,
    description: "Success story with data & quotes",
    defaultSlides: 8,
    color: "text-rose-400",
  },
];

const TONE_OPTIONS = [
  { id: "professional", label: "Professional" },
  { id: "casual", label: "Casual" },
  { id: "executive", label: "Executive" },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PresentationsPage() {
  // Form state
  const [topic, setTopic] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("pitch-deck");
  const [slideCount, setSlideCount] = useState(12);
  const [companyContext, setCompanyContext] = useState("");
  const [tone, setTone] = useState("professional");

  // Generation state
  const [response, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Action state
  const [copied, setCopied] = useState(false);
  const [isExportingGamma, setIsExportingGamma] = useState(false);
  const [gammaResult, setGammaResult] = useState<{ url?: string; error?: string } | null>(null);
  const [showToneDropdown, setShowToneDropdown] = useState(false);

  // Refs
  const responseRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const { refetch: refetchCredits } = useCredits();

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Auto-scroll response
  useEffect(() => {
    if (responseRef.current) {
      responseRef.current.scrollTop = responseRef.current.scrollHeight;
    }
  }, [response]);

  // Update slide count when template changes
  useEffect(() => {
    const template = TEMPLATE_TYPES.find((t) => t.id === selectedTemplate);
    if (template) {
      setSlideCount(template.defaultSlides);
    }
  }, [selectedTemplate]);

  // Close tone dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-tone-dropdown]")) {
        setShowToneDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // -----------------------------------------------------------------------
  // Build the AI prompt
  // -----------------------------------------------------------------------
  const buildPrompt = (): string => {
    const template = TEMPLATE_TYPES.find((t) => t.id === selectedTemplate);
    const templateLabel = template?.label ?? "Presentation";

    let prompt = `You are an expert sales presentation designer. Create a detailed, structured slide-by-slide outline for a **${templateLabel}** presentation.

**Topic / Context:**
${topic}

**Number of slides:** ${slideCount}
**Tone:** ${tone}
${companyContext ? `\n**Company / Additional Context:**\n${companyContext}\n` : ""}

For EACH slide provide:
1. **Slide Number & Title** (e.g., "Slide 1: Opening Hook")
2. **Key Bullet Points** (3-5 concise bullets per slide)
3. **Speaker Notes** (2-3 sentences of what the presenter should say)
4. **Visual Suggestion** (brief note on what visual/graphic to include)

Structure guidelines based on the template type:
`;

    switch (selectedTemplate) {
      case "pitch-deck":
        prompt += `
- Start with a compelling hook / problem statement
- Include slides for: Problem, Solution, Market Opportunity, Product Demo highlights, Business Model, Traction/Metrics, Team, Competitive Advantage, Pricing, Call to Action
- End with a strong closing slide and next steps`;
        break;
      case "product-demo":
        prompt += `
- Start with the customer's pain points
- Walk through key features with use-case scenarios
- Include before/after comparisons
- Show integration capabilities
- End with pricing overview and next steps`;
        break;
      case "sales-proposal":
        prompt += `
- Executive summary slide first
- Include: Understanding of needs, Proposed solution, Implementation timeline, Pricing & ROI analysis, Team & support, Terms & conditions
- Professional and data-driven throughout
- End with decision timeline and call to action`;
        break;
      case "quarterly-review":
        prompt += `
- Start with executive summary / highlights
- Include: Key metrics & KPIs, Goals vs actuals, Wins & successes, Challenges & learnings, Customer feedback, Product roadmap, Next quarter goals
- Use data-heavy slides with clear metrics`;
        break;
      case "client-onboarding":
        prompt += `
- Welcome slide with warm tone
- Include: Team introductions, Onboarding timeline, Key milestones, Resources & support channels, Success metrics, FAQ
- Keep it clear, friendly, and action-oriented`;
        break;
      case "case-study":
        prompt += `
- Start with the customer profile / challenge
- Include: Initial situation, Solution implemented, Implementation process, Key results with specific metrics, Customer quotes, Lessons learned
- Data-driven with compelling storytelling`;
        break;
    }

    prompt += `

Format the output in clean markdown. Use ## for slide titles, bullet points for content, and > blockquotes for speaker notes. Use --- between slides for clear separation.`;

    return prompt;
  };

  // -----------------------------------------------------------------------
  // Generate presentation
  // -----------------------------------------------------------------------
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() || isLoading) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setResponse("");
    setError(null);
    setGammaResult(null);

    try {
      const token = await getAuthToken();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const prompt = buildPrompt();

      const res = await fetch("/api/ai/coach", {
        method: "POST",
        headers,
        body: JSON.stringify({
          message: prompt,
          model: localStorage.getItem("ai_model") || "claude-sonnet-4-5-20250929",
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        if (res.status === 402) {
          throw new Error("Out of credits! Request more credits to continue.");
        }
        throw new Error(
          errorData.details || errorData.error || `Request failed with status ${res.status}`
        );
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });

          // Check if this is a Vercel AI SDK stream (0: prefix format)
          if (chunk.includes("0:")) {
            const lines = chunk.split("\n");
            for (const line of lines) {
              if (line.startsWith("0:")) {
                try {
                  const text = JSON.parse(line.slice(2));
                  fullText += text;
                } catch {
                  // Not valid JSON after 0:, skip
                }
              }
            }
          } else {
            // Plain text stream (default from /api/ai/coach)
            fullText += chunk;
          }

          setResponse(fullText);
        }
      }

      // Save to session history
      const templateLabel =
        TEMPLATE_TYPES.find((t) => t.id === selectedTemplate)?.label ?? "Presentation";
      saveSession({
        type: "tool",
        toolType: "presentation",
        title: `${templateLabel}: ${topic.slice(0, 50)}${topic.length > 50 ? "..." : ""}`,
        input: topic,
        output: fullText,
      });

      refetchCredits();
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      setResponse("");
    } finally {
      setIsLoading(false);
    }
  };

  // -----------------------------------------------------------------------
  // Action handlers
  // -----------------------------------------------------------------------

  const handleCopy = () => {
    navigator.clipboard.writeText(response);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportPDF = () => {
    const templateLabel =
      TEMPLATE_TYPES.find((t) => t.id === selectedTemplate)?.label ?? "Presentation";
    exportToPDF({
      title: `${templateLabel}: ${topic.slice(0, 60)}`,
      content: response,
      subtitle: `Generated by AI Sales Coach`,
      metadata: {
        Template: templateLabel,
        Slides: String(slideCount),
        Tone: tone.charAt(0).toUpperCase() + tone.slice(1),
        Date: new Date().toLocaleDateString(),
      },
    });
  };

  const handleSendGamma = async () => {
    if (!response || isExportingGamma) return;
    setIsExportingGamma(true);
    setGammaResult(null);

    try {
      const res = await fetch("/api/presentations/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          slides: slideCount,
          theme: selectedTemplate,
          style: tone,
          outline: response,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setGammaResult({ error: data.error || "Failed to generate presentation" });
      } else {
        setGammaResult({ url: data.url || data.downloadUrl });
      }
    } catch (err) {
      setGammaResult({
        error: err instanceof Error ? err.message : "Network error",
      });
    } finally {
      setIsExportingGamma(false);
    }
  };

  const handleEmail = () => {
    const templateLabel =
      TEMPLATE_TYPES.find((t) => t.id === selectedTemplate)?.label ?? "Presentation";
    const subject = encodeURIComponent(`${templateLabel} Outline: ${topic.slice(0, 80)}`);
    const body = encodeURIComponent(response);
    window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
  };

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  const currentTemplate = TEMPLATE_TYPES.find((t) => t.id === selectedTemplate);

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-platinum flex items-center gap-2">
          <Presentation className="h-6 w-6 text-neonblue" />
          Presentation Generator
        </h1>
        <p className="text-silver mt-1">
          AI-powered slide outlines for pitch decks, proposals, demos & more
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ----------------------------------------------------------------- */}
        {/* Left Column - Configuration & Results (2/3 width) */}
        {/* ----------------------------------------------------------------- */}
        <div className="lg:col-span-2 space-y-6">
          {/* Template Selector */}
          <Card className="bg-graphite border-gunmetal">
            <CardHeader>
              <CardTitle className="text-platinum flex items-center gap-2">
                <LayoutTemplate className="h-5 w-5 text-neonblue" />
                Choose Template
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {TEMPLATE_TYPES.map((template) => {
                  const Icon = template.icon;
                  const isSelected = selectedTemplate === template.id;
                  return (
                    <button
                      key={template.id}
                      onClick={() => setSelectedTemplate(template.id)}
                      className={cn(
                        "relative flex flex-col items-start gap-2 p-4 rounded-xl border transition-all duration-200 text-left group",
                        isSelected
                          ? "bg-neonblue/10 border-neonblue/50 ring-1 ring-neonblue/30"
                          : "bg-onyx border-gunmetal hover:border-neonblue/30 hover:bg-onyx/80"
                      )}
                    >
                      {isSelected && (
                        <div className="absolute top-2 right-2">
                          <Check className="h-4 w-4 text-neonblue" />
                        </div>
                      )}
                      <div
                        className={cn(
                          "h-9 w-9 rounded-lg flex items-center justify-center transition-colors",
                          isSelected ? "bg-neonblue/20" : "bg-graphite group-hover:bg-graphite/80"
                        )}
                      >
                        <Icon className={cn("h-5 w-5", template.color)} />
                      </div>
                      <div>
                        <p
                          className={cn(
                            "text-sm font-medium",
                            isSelected ? "text-neonblue" : "text-platinum"
                          )}
                        >
                          {template.label}
                        </p>
                        <p className="text-xs text-mist mt-0.5 leading-relaxed">
                          {template.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Input Form */}
          <Card className="bg-graphite border-gunmetal">
            <CardHeader>
              <CardTitle className="text-platinum flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-neonblue" />
                Presentation Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleGenerate} className="space-y-5">
                {/* Topic */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-platinum">
                    Topic / Context <span className="text-errorred">*</span>
                  </label>
                  <Textarea
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder={`e.g., "Q1 2026 sales results for Acme Corp SaaS platform - 40% YoY growth, 200 new enterprise customers, expanding into APAC market..."`}
                    className="min-h-[100px] bg-onyx border-gunmetal text-platinum placeholder:text-mist focus:border-neonblue resize-none"
                  />
                </div>

                {/* Slide Count + Tone Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Slide Count */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-platinum">
                      Number of Slides
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min={5}
                        max={20}
                        value={slideCount}
                        onChange={(e) => setSlideCount(Number(e.target.value))}
                        className="flex-1 h-2 bg-onyx rounded-lg appearance-none cursor-pointer accent-neonblue"
                      />
                      <span className="text-sm font-mono text-neonblue w-8 text-center">
                        {slideCount}
                      </span>
                    </div>
                  </div>

                  {/* Tone Selector */}
                  <div className="space-y-2" data-tone-dropdown>
                    <label className="text-sm font-medium text-platinum">Tone</label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowToneDropdown(!showToneDropdown)}
                        className={cn(
                          "w-full flex items-center justify-between px-3 py-2 rounded-md border text-sm transition-colors",
                          "bg-onyx border-gunmetal text-platinum hover:border-neonblue/50"
                        )}
                      >
                        <span>{tone.charAt(0).toUpperCase() + tone.slice(1)}</span>
                        <ChevronDown className="h-4 w-4 text-mist" />
                      </button>
                      {showToneDropdown && (
                        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-graphite border border-gunmetal rounded-lg shadow-xl overflow-hidden">
                          {TONE_OPTIONS.map((option) => (
                            <button
                              key={option.id}
                              type="button"
                              onClick={() => {
                                setTone(option.id);
                                setShowToneDropdown(false);
                              }}
                              className={cn(
                                "w-full text-left px-3 py-2 text-sm transition-colors",
                                tone === option.id
                                  ? "bg-neonblue/10 text-neonblue"
                                  : "text-silver hover:text-platinum hover:bg-onyx"
                              )}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Company Context (optional) */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-platinum">
                    Company Context{" "}
                    <span className="text-mist font-normal">(optional)</span>
                  </label>
                  <Input
                    value={companyContext}
                    onChange={(e) => setCompanyContext(e.target.value)}
                    placeholder="e.g., B2B SaaS, Series B, 150 employees, targeting enterprise healthcare"
                    className="bg-onyx border-gunmetal text-platinum placeholder:text-mist focus:border-neonblue"
                  />
                </div>

                {/* Error Message */}
                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-errorred/10 border border-errorred/20">
                    <AlertCircle className="h-4 w-4 text-errorred shrink-0" />
                    <p className="text-sm text-errorred">{error}</p>
                  </div>
                )}

                {/* Submit */}
                <div className="flex items-center justify-between pt-1">
                  <p className="text-xs text-mist flex items-center gap-1.5">
                    <Presentation className="h-3.5 w-3.5" />
                    {currentTemplate?.label} - {slideCount} slides - {tone} tone
                  </p>
                  <Button
                    type="submit"
                    disabled={!topic.trim() || isLoading}
                    className="bg-neonblue hover:bg-neonblue/90 text-white px-6"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generate Outline
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Loading Animation */}
          {isLoading && !response && (
            <Card className="bg-graphite border-gunmetal overflow-hidden">
              <CardContent className="p-8">
                <div className="flex flex-col items-center justify-center gap-4">
                  <div className="relative">
                    <div className="h-16 w-16 rounded-2xl bg-neonblue/10 flex items-center justify-center">
                      <Presentation className="h-8 w-8 text-neonblue animate-pulse" />
                    </div>
                    <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-automationgreen/20 flex items-center justify-center">
                      <Sparkles className="h-3 w-3 text-automationgreen animate-spin" />
                    </div>
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-platinum font-medium">
                      Crafting your {currentTemplate?.label}...
                    </p>
                    <p className="text-sm text-mist">
                      Building {slideCount} slides with {tone} tone
                    </p>
                  </div>
                  {/* Animated slide placeholders */}
                  <div className="w-full max-w-md mt-2 grid grid-cols-4 gap-2">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-12 rounded-lg bg-onyx border border-gunmetal animate-pulse"
                        style={{ animationDelay: `${i * 150}ms` }}
                      />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Response / Results */}
          {(response || (isLoading && response)) && (
            <Card className="bg-graphite border-gunmetal">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-platinum flex items-center gap-2">
                  <Layers className="h-5 w-5 text-automationgreen" />
                  Generated Outline
                  {!isLoading && (
                    <span className="text-xs font-normal text-mist ml-2">
                      {currentTemplate?.label} - {slideCount} slides
                    </span>
                  )}
                </CardTitle>
                {response && !isLoading && (
                  <div className="flex items-center gap-1 flex-wrap">
                    {/* Copy */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopy}
                      className="text-silver hover:text-platinum"
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

                    {/* Export PDF */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleExportPDF}
                      className="text-silver hover:text-platinum"
                    >
                      <FileDown className="h-4 w-4 mr-1" />
                      PDF
                    </Button>

                    {/* Gamma PPTX */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleSendGamma}
                      disabled={isExportingGamma}
                      className="text-silver hover:text-platinum"
                    >
                      {isExportingGamma ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4 mr-1" />
                          PPTX
                        </>
                      )}
                    </Button>

                    {/* Email */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleEmail}
                      className="text-silver hover:text-platinum"
                    >
                      <Mail className="h-4 w-4 mr-1" />
                      Email
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {/* Gamma result feedback */}
                {gammaResult && (
                  <div
                    className={cn(
                      "mb-4 p-3 rounded-lg border text-sm flex items-center gap-2",
                      gammaResult.url
                        ? "bg-automationgreen/10 border-automationgreen/20 text-automationgreen"
                        : "bg-errorred/10 border-errorred/20 text-errorred"
                    )}
                  >
                    {gammaResult.url ? (
                      <>
                        <Check className="h-4 w-4 shrink-0" />
                        <span>
                          Presentation created!{" "}
                          <a
                            href={gammaResult.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline font-medium"
                          >
                            Open in Gamma
                          </a>
                        </span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>{gammaResult.error}</span>
                      </>
                    )}
                  </div>
                )}

                <div
                  ref={responseRef}
                  className="prose prose-invert prose-sm max-w-none max-h-[600px] overflow-y-auto prose-headings:text-platinum prose-p:text-gray-200 prose-strong:text-white prose-li:text-gray-200 prose-td:text-gray-300 prose-th:text-platinum prose-th:bg-onyx prose-a:text-neonblue prose-code:text-automationgreen prose-blockquote:text-gray-300 prose-blockquote:border-neonblue/50 prose-hr:border-gunmetal"
                >
                  {response ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{response}</ReactMarkdown>
                  ) : (
                    <div className="flex items-center gap-2 text-mist">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating slide outline...
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* Right Column - Sidebar (1/3 width) */}
        {/* ----------------------------------------------------------------- */}
        <div className="space-y-4">
          {/* Selected Template Preview */}
          <Card className="bg-graphite border-gunmetal">
            <CardHeader>
              <CardTitle className="text-platinum text-base flex items-center gap-2">
                {currentTemplate && (
                  <currentTemplate.icon className={cn("h-5 w-5", currentTemplate.color)} />
                )}
                {currentTemplate?.label ?? "Template"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-silver">{currentTemplate?.description}</p>

              {/* Mini slide preview */}
              <div className="space-y-2">
                <p className="text-xs text-mist font-medium uppercase tracking-wider">
                  Slide Preview
                </p>
                <div className="grid grid-cols-3 gap-1.5">
                  {Array.from({ length: Math.min(slideCount, 9) }).map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        "aspect-[16/10] rounded border flex items-center justify-center text-[10px]",
                        i === 0
                          ? "bg-neonblue/10 border-neonblue/30 text-neonblue"
                          : i === Math.min(slideCount, 9) - 1
                          ? "bg-automationgreen/10 border-automationgreen/30 text-automationgreen"
                          : "bg-onyx border-gunmetal text-mist"
                      )}
                    >
                      {i + 1}
                    </div>
                  ))}
                  {slideCount > 9 && (
                    <div className="aspect-[16/10] rounded border border-gunmetal bg-onyx flex items-center justify-center text-[10px] text-mist">
                      +{slideCount - 9}
                    </div>
                  )}
                </div>
              </div>

              {/* Config summary */}
              <div className="pt-2 border-t border-gunmetal space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-mist">Slides</span>
                  <span className="text-platinum font-medium">{slideCount}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-mist">Tone</span>
                  <span className="text-platinum font-medium capitalize">{tone}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-mist">Template</span>
                  <span className="text-platinum font-medium">{currentTemplate?.label}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tips */}
          <Card className="bg-onyx border-gunmetal">
            <CardContent className="p-4">
              <h4 className="font-medium text-platinum mb-3 flex items-center gap-2 text-sm">
                <Sparkles className="h-4 w-4 text-warningamber" />
                Presentation Tips
              </h4>
              <ul className="space-y-2 text-xs text-silver">
                <li className="flex items-start gap-2">
                  <span className="text-neonblue mt-0.5">1.</span>
                  <span>Be specific with your topic - include numbers, company names, and goals</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-neonblue mt-0.5">2.</span>
                  <span>Add company context for more tailored and relevant content</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-neonblue mt-0.5">3.</span>
                  <span>Use Executive tone for C-suite audiences, Casual for internal team meetings</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-neonblue mt-0.5">4.</span>
                  <span>Export to PPTX via Gamma for ready-to-present slides with visuals</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-neonblue mt-0.5">5.</span>
                  <span>10-15 slides is optimal for most sales presentations</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Quick Templates */}
          <Card className="bg-graphite border-gunmetal">
            <CardHeader>
              <CardTitle className="text-platinum text-base">Quick Starts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                {
                  label: "SaaS Pitch Deck",
                  topic:
                    "SaaS product pitch for enterprise CRM - AI-powered lead scoring, 3x conversion improvement, SOC2 compliant",
                  template: "pitch-deck",
                },
                {
                  label: "Q1 Sales Review",
                  topic:
                    "Q1 2026 quarterly business review - exceeded revenue target by 15%, 50 new logos, NRR at 125%",
                  template: "quarterly-review",
                },
                {
                  label: "Product Demo",
                  topic:
                    "Live product demo for marketing automation platform - email sequences, A/B testing, analytics dashboard",
                  template: "product-demo",
                },
                {
                  label: "Enterprise Proposal",
                  topic:
                    "Sales proposal for Fortune 500 healthcare company - 3-year contract, custom integrations, dedicated CSM",
                  template: "sales-proposal",
                },
              ].map((qs) => (
                <button
                  key={qs.label}
                  onClick={() => {
                    setTopic(qs.topic);
                    setSelectedTemplate(qs.template);
                  }}
                  className={cn(
                    "w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all",
                    "text-silver hover:text-platinum hover:bg-onyx",
                    "flex items-center justify-between group border border-transparent hover:border-gunmetal"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Send className="h-3.5 w-3.5 text-neonblue shrink-0" />
                    <span>{qs.label}</span>
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 -rotate-90 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
