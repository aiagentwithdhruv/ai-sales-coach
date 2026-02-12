"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Brain,
  Plus,
  Search,
  Trash2,
  Edit3,
  Save,
  X,
  BookOpen,
  HelpCircle,
  MessageSquare,
  Sparkles,
  Loader2,
  Check,
  Copy,
  ChevronDown,
  Send,
  FolderOpen,
  FileText,
  DollarSign,
  Swords,
  Settings,
  CircleHelp,
  RotateCcw,
  Lightbulb,
  GraduationCap,
  Mic,
} from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getAuthToken } from "@/lib/auth-token";
import { saveSession } from "@/lib/session-history";

// ============================================================
// Types
// ============================================================

interface KnowledgeItem {
  id: string;
  title: string;
  category: KnowledgeCategory;
  content: string;
  createdAt: number;
  updatedAt: number;
}

type KnowledgeCategory = "Product" | "Pricing" | "Competitor" | "Process" | "FAQ";

interface QuizQuestion {
  question: string;
  context: string;
}

// ============================================================
// Constants
// ============================================================

const CATEGORIES: { value: KnowledgeCategory; label: string; icon: typeof FileText; color: string }[] = [
  { value: "Product", label: "Product", icon: FileText, color: "text-neonblue" },
  { value: "Pricing", label: "Pricing", icon: DollarSign, color: "text-automationgreen" },
  { value: "Competitor", label: "Competitor", icon: Swords, color: "text-errorred" },
  { value: "Process", label: "Process", icon: Settings, color: "text-warningamber" },
  { value: "FAQ", label: "FAQ", icon: CircleHelp, color: "text-purple-400" },
];

const TALK_TRACK_SCENARIOS = [
  "Cold call introduction",
  "Discovery call opening",
  "Product demo walkthrough",
  "Handling price objection",
  "Competitor comparison",
  "Closing the deal",
  "Follow-up after demo",
  "Upsell / cross-sell pitch",
  "Renewal conversation",
  "Executive briefing",
];

const STORAGE_KEY = "company-brain-knowledge";

// ============================================================
// Helpers
// ============================================================

function generateId(): string {
  return `kb-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function loadKnowledge(): KnowledgeItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function persistKnowledge(items: KnowledgeItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function buildKnowledgeContext(items: KnowledgeItem[]): string {
  if (items.length === 0) return "";
  let ctx = "\n\n=== COMPANY KNOWLEDGE BASE ===\n";
  const grouped: Record<string, KnowledgeItem[]> = {};
  for (const item of items) {
    if (!grouped[item.category]) grouped[item.category] = [];
    grouped[item.category].push(item);
  }
  for (const [category, categoryItems] of Object.entries(grouped)) {
    ctx += `\n--- ${category.toUpperCase()} ---\n`;
    for (const item of categoryItems) {
      ctx += `\n[${item.title}]\n${item.content}\n`;
    }
  }
  ctx += "\n=== END KNOWLEDGE BASE ===\n";
  return ctx;
}

// ============================================================
// Component
// ============================================================

export default function CompanyBrainPage() {
  // Knowledge base state
  const [knowledge, setKnowledge] = useState<KnowledgeItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<KnowledgeCategory | "All">("All");

  // Add/Edit form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formCategory, setFormCategory] = useState<KnowledgeCategory>("Product");
  const [formContent, setFormContent] = useState("");

  // Quiz mode state
  const [quizActive, setQuizActive] = useState(false);
  const [quizQuestion, setQuizQuestion] = useState("");
  const [quizAnswer, setQuizAnswer] = useState("");
  const [quizFeedback, setQuizFeedback] = useState("");
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [quizHistory, setQuizHistory] = useState<{ question: string; answer: string; score: number; feedback: string }[]>([]);

  // Talk track state
  const [talkTrackScenario, setTalkTrackScenario] = useState("");
  const [talkTrackCustom, setTalkTrackCustom] = useState("");
  const [talkTrackResponse, setTalkTrackResponse] = useState("");
  const [talkTrackLoading, setTalkTrackLoading] = useState(false);

  // General
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("knowledge");
  const responseRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Load knowledge from localStorage on mount
  useEffect(() => {
    setKnowledge(loadKnowledge());
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  // Auto-scroll response areas
  useEffect(() => {
    if (responseRef.current) {
      responseRef.current.scrollTop = responseRef.current.scrollHeight;
    }
  }, [quizFeedback, talkTrackResponse]);

  // ---- Knowledge CRUD ----

  const handleSaveItem = () => {
    if (!formTitle.trim() || !formContent.trim()) return;

    const now = Date.now();
    let updated: KnowledgeItem[];

    if (editingId) {
      updated = knowledge.map((item) =>
        item.id === editingId
          ? { ...item, title: formTitle.trim(), category: formCategory, content: formContent.trim(), updatedAt: now }
          : item
      );
    } else {
      const newItem: KnowledgeItem = {
        id: generateId(),
        title: formTitle.trim(),
        category: formCategory,
        content: formContent.trim(),
        createdAt: now,
        updatedAt: now,
      };
      updated = [newItem, ...knowledge];
    }

    setKnowledge(updated);
    persistKnowledge(updated);
    resetForm();
  };

  const handleEditItem = (item: KnowledgeItem) => {
    setEditingId(item.id);
    setFormTitle(item.title);
    setFormCategory(item.category);
    setFormContent(item.content);
    setShowForm(true);
  };

  const handleDeleteItem = (id: string) => {
    const updated = knowledge.filter((item) => item.id !== id);
    setKnowledge(updated);
    persistKnowledge(updated);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormTitle("");
    setFormCategory("Product");
    setFormContent("");
  };

  // ---- Filtered knowledge ----

  const filteredKnowledge = knowledge.filter((item) => {
    const matchesSearch =
      !searchQuery ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === "All" || item.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  // ---- Streaming AI call helper ----

  const streamAI = useCallback(async (
    prompt: string,
    onChunk: (fullText: string) => void,
    signal?: AbortSignal
  ): Promise<string> => {
    const token = await getAuthToken();
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const model = localStorage.getItem("ai_model") || "claude-sonnet-4-5-20250929";

    const res = await fetch("/api/ai/coach", {
      method: "POST",
      headers,
      body: JSON.stringify({
        type: "general",
        message: prompt,
        model,
      }),
      signal,
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      if (res.status === 402) throw new Error("Usage limit reached. Upgrade your plan to continue.");
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
        onChunk(fullText);
      }
    }

    return fullText;
  }, []);

  // ---- Quiz Mode ----

  const handleGenerateQuiz = async () => {
    if (knowledge.length === 0) return;
    setQuizLoading(true);
    setQuizQuestion("");
    setQuizAnswer("");
    setQuizFeedback("");
    setQuizScore(null);

    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();

    try {
      const knowledgeCtx = buildKnowledgeContext(knowledge);
      const prompt = `You are a sales training quiz master. Based on the following company knowledge base, generate ONE challenging but fair quiz question that tests the sales rep's knowledge of the company's products, pricing, competitive advantages, or processes.

${knowledgeCtx}

RULES:
- Ask a specific, practical question a sales rep would need to know on a real call
- The question should have a clear correct answer based on the knowledge base
- Frame it as a scenario when possible (e.g. "A prospect asks you about...")
- Output ONLY the question, nothing else. No preamble, no numbering.`;

      const result = await streamAI(
        prompt,
        (text) => setQuizQuestion(text),
        abortControllerRef.current.signal
      );

      saveSession({
        type: "tool",
        toolType: "company-brain-quiz",
        title: `Quiz: ${result.slice(0, 60)}...`,
        input: "Generate quiz question",
        output: result,
        model: localStorage.getItem("ai_model") || "claude-sonnet-4-5-20250929",
      });
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      setQuizQuestion("Failed to generate question. Please try again.");
    } finally {
      setQuizLoading(false);
    }
  };

  const handleSubmitQuizAnswer = async () => {
    if (!quizAnswer.trim() || !quizQuestion || quizLoading) return;
    setQuizLoading(true);
    setQuizFeedback("");
    setQuizScore(null);

    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();

    try {
      const knowledgeCtx = buildKnowledgeContext(knowledge);
      const prompt = `You are a sales training evaluator. Grade the following answer based on the company knowledge base.

${knowledgeCtx}

QUESTION: ${quizQuestion}

SALES REP'S ANSWER: ${quizAnswer}

Provide your evaluation in this EXACT format:

## Score: [X]/10

## What You Got Right
[Bullet points of correct elements]

## What Was Missing or Incorrect
[Bullet points of gaps or errors]

## Ideal Answer
[The complete, ideal response based on the knowledge base]

## Coaching Tip
[One practical tip for improvement]`;

      let fullFeedback = "";
      await streamAI(
        prompt,
        (text) => {
          fullFeedback = text;
          setQuizFeedback(text);
          // Try to extract score
          const scoreMatch = text.match(/Score:\s*(\d+)\s*\/\s*10/i);
          if (scoreMatch) {
            setQuizScore(parseInt(scoreMatch[1], 10));
          }
        },
        abortControllerRef.current.signal
      );

      // Save to quiz history
      const scoreMatch = fullFeedback.match(/Score:\s*(\d+)\s*\/\s*10/i);
      const finalScore = scoreMatch ? parseInt(scoreMatch[1], 10) : 0;
      setQuizHistory((prev) => [
        { question: quizQuestion, answer: quizAnswer, score: finalScore, feedback: fullFeedback },
        ...prev,
      ]);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      setQuizFeedback("Failed to evaluate answer. Please try again.");
    } finally {
      setQuizLoading(false);
    }
  };

  // ---- Talk Track Generator ----

  const handleGenerateTalkTrack = async () => {
    const scenario = talkTrackCustom.trim() || talkTrackScenario;
    if (!scenario || knowledge.length === 0 || talkTrackLoading) return;

    setTalkTrackLoading(true);
    setTalkTrackResponse("");

    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();

    try {
      const knowledgeCtx = buildKnowledgeContext(knowledge);
      const prompt = `You are an expert sales coach. Generate a detailed, ready-to-use talk track for the following scenario, using ONLY information from the company knowledge base below.

${knowledgeCtx}

SCENARIO: ${scenario}

Generate the talk track in this format:

## Opening (First 30 seconds)
[Exact words to say to open the conversation]

## Key Talking Points
[3-5 numbered points with exact phrasing]

## Value Propositions to Highlight
[Specific value props from the knowledge base with supporting data/numbers]

## Anticipated Objections & Responses
[2-3 likely objections with scripted responses]

## Closing / Next Steps
[How to end the conversation with a clear CTA]

## Do's and Don'ts
- **Do:** [specific tip]
- **Don't:** [specific anti-pattern]

Make the talk track natural, conversational, and specific to the company's actual products/pricing/differentiators.`;

      const result = await streamAI(
        prompt,
        (text) => setTalkTrackResponse(text),
        abortControllerRef.current.signal
      );

      saveSession({
        type: "tool",
        toolType: "company-brain-talktrack",
        title: `Talk Track: ${scenario.slice(0, 50)}`,
        input: scenario,
        output: result,
        model: localStorage.getItem("ai_model") || "claude-sonnet-4-5-20250929",
      });
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      setTalkTrackResponse("Failed to generate talk track. Please try again.");
    } finally {
      setTalkTrackLoading(false);
    }
  };

  // ---- Copy ----

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ---- Category stats ----

  const categoryStats = CATEGORIES.map((cat) => ({
    ...cat,
    count: knowledge.filter((k) => k.category === cat.value).length,
  }));

  // ============================================================
  // Render
  // ============================================================

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-platinum flex items-center gap-2">
          <Brain className="h-6 w-6 text-neonblue" />
          Company Brain
        </h1>
        <p className="text-silver mt-1">
          Train the AI with your company knowledge, then quiz yourself or generate talk tracks
        </p>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        <Card className="bg-graphite border-gunmetal">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-neonblue/10">
              <BookOpen className="h-4 w-4 text-neonblue" />
            </div>
            <div>
              <p className="text-xs text-mist">Total Items</p>
              <p className="text-lg font-bold text-platinum">{knowledge.length}</p>
            </div>
          </CardContent>
        </Card>
        {categoryStats.map((cat) => (
          <Card key={cat.value} className="bg-graphite border-gunmetal">
            <CardContent className="p-3 flex items-center gap-3">
              <div className={cn("p-2 rounded-lg", `bg-${cat.color.replace("text-", "")}/10`)}>
                <cat.icon className={cn("h-4 w-4", cat.color)} />
              </div>
              <div>
                <p className="text-xs text-mist">{cat.label}</p>
                <p className="text-lg font-bold text-platinum">{cat.count}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-graphite border border-gunmetal">
          <TabsTrigger value="knowledge" className="data-[state=active]:bg-neonblue/10 data-[state=active]:text-neonblue text-silver">
            <BookOpen className="h-4 w-4 mr-2" />
            Knowledge Base
          </TabsTrigger>
          <TabsTrigger value="quiz" className="data-[state=active]:bg-automationgreen/10 data-[state=active]:text-automationgreen text-silver">
            <GraduationCap className="h-4 w-4 mr-2" />
            Quiz Mode
          </TabsTrigger>
          <TabsTrigger value="talktrack" className="data-[state=active]:bg-warningamber/10 data-[state=active]:text-warningamber text-silver">
            <Mic className="h-4 w-4 mr-2" />
            Talk Tracks
          </TabsTrigger>
        </TabsList>

        {/* ==================== KNOWLEDGE BASE TAB ==================== */}
        <TabsContent value="knowledge" className="space-y-6 mt-4">
          {/* Add / Search Row */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              className="bg-neonblue hover:bg-neonblue/80 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Knowledge Item
            </Button>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-mist" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search knowledge base..."
                className="pl-10 bg-onyx border-gunmetal text-platinum placeholder:text-mist focus:border-neonblue"
              />
            </div>
            <div className="flex gap-1 flex-wrap">
              <button
                onClick={() => setFilterCategory("All")}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                  filterCategory === "All"
                    ? "bg-neonblue/10 text-neonblue border border-neonblue/30"
                    : "text-silver hover:text-platinum bg-onyx border border-gunmetal"
                )}
              >
                All
              </button>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setFilterCategory(cat.value)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                    filterCategory === cat.value
                      ? "bg-neonblue/10 text-neonblue border border-neonblue/30"
                      : "text-silver hover:text-platinum bg-onyx border border-gunmetal"
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Add/Edit Form */}
          {showForm && (
            <Card className="bg-graphite border-neonblue/30">
              <CardHeader>
                <CardTitle className="text-platinum flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-neonblue" />
                  {editingId ? "Edit Knowledge Item" : "Add Knowledge Item"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-mist mb-1 block">Title</label>
                    <Input
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="e.g., Enterprise Plan Features"
                      className="bg-onyx border-gunmetal text-platinum placeholder:text-mist focus:border-neonblue"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-mist mb-1 block">Category</label>
                    <div className="flex gap-2 flex-wrap">
                      {CATEGORIES.map((cat) => (
                        <button
                          key={cat.value}
                          onClick={() => setFormCategory(cat.value)}
                          className={cn(
                            "px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5",
                            formCategory === cat.value
                              ? "bg-neonblue/10 text-neonblue border border-neonblue/30"
                              : "text-silver hover:text-platinum bg-onyx border border-gunmetal"
                          )}
                        >
                          <cat.icon className="h-3 w-3" />
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-mist mb-1 block">Content</label>
                  <Textarea
                    value={formContent}
                    onChange={(e) => setFormContent(e.target.value)}
                    placeholder="Paste your product documentation, pricing details, competitive intel, sales process steps, or FAQ answers here..."
                    className="min-h-[200px] bg-onyx border-gunmetal text-platinum placeholder:text-mist focus:border-neonblue"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    onClick={handleSaveItem}
                    disabled={!formTitle.trim() || !formContent.trim()}
                    className="bg-neonblue hover:bg-neonblue/80 text-white"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {editingId ? "Update Item" : "Save Item"}
                  </Button>
                  <Button variant="outline" onClick={resetForm} className="border-gunmetal text-silver hover:text-platinum">
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Knowledge Items Grid */}
          {filteredKnowledge.length === 0 ? (
            <Card className="bg-graphite border-gunmetal">
              <CardContent className="p-12 text-center">
                <FolderOpen className="h-12 w-12 text-mist mx-auto mb-4" />
                <h3 className="text-lg font-medium text-platinum mb-2">
                  {knowledge.length === 0 ? "No knowledge items yet" : "No items match your search"}
                </h3>
                <p className="text-sm text-silver mb-4">
                  {knowledge.length === 0
                    ? "Add your company's product docs, pricing, competitive intel, and processes to train the AI."
                    : "Try adjusting your search or filter criteria."}
                </p>
                {knowledge.length === 0 && (
                  <Button
                    onClick={() => {
                      resetForm();
                      setShowForm(true);
                    }}
                    className="bg-neonblue hover:bg-neonblue/80 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Item
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredKnowledge.map((item) => {
                const catDef = CATEGORIES.find((c) => c.value === item.category);
                return (
                  <Card key={item.id} className="bg-graphite border-gunmetal hover:border-gunmetal/80 transition-colors group">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <CardTitle className="text-sm text-platinum truncate">{item.title}</CardTitle>
                          <Badge className={cn(
                            "mt-1.5 text-[10px] px-2 py-0.5 border-0",
                            item.category === "Product" && "bg-neonblue/10 text-neonblue",
                            item.category === "Pricing" && "bg-automationgreen/10 text-automationgreen",
                            item.category === "Competitor" && "bg-errorred/10 text-errorred",
                            item.category === "Process" && "bg-warningamber/10 text-warningamber",
                            item.category === "FAQ" && "bg-purple-400/10 text-purple-400",
                          )}>
                            {item.category}
                          </Badge>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEditItem(item)}
                            className="p-1.5 rounded-md text-mist hover:text-neonblue hover:bg-onyx transition-colors"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-1.5 rounded-md text-mist hover:text-errorred hover:bg-onyx transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-silver line-clamp-4 leading-relaxed">{item.content}</p>
                      <p className="text-[10px] text-mist mt-3">
                        Updated {new Date(item.updatedAt).toLocaleDateString()}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ==================== QUIZ MODE TAB ==================== */}
        <TabsContent value="quiz" className="space-y-6 mt-4">
          {knowledge.length === 0 ? (
            <Card className="bg-graphite border-gunmetal">
              <CardContent className="p-12 text-center">
                <GraduationCap className="h-12 w-12 text-mist mx-auto mb-4" />
                <h3 className="text-lg font-medium text-platinum mb-2">Add knowledge first</h3>
                <p className="text-sm text-silver mb-4">
                  You need at least one knowledge item before the AI can quiz you.
                </p>
                <Button onClick={() => setActiveTab("knowledge")} className="bg-neonblue hover:bg-neonblue/80 text-white">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Go to Knowledge Base
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Quiz Area */}
              <div className="lg:col-span-2 space-y-6">
                {/* Generate / Question */}
                <Card className="bg-graphite border-gunmetal">
                  <CardHeader>
                    <CardTitle className="text-platinum flex items-center gap-2">
                      <HelpCircle className="h-5 w-5 text-automationgreen" />
                      Quiz Question
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {!quizQuestion && !quizLoading ? (
                      <div className="text-center py-6">
                        <GraduationCap className="h-10 w-10 text-mist mx-auto mb-3" />
                        <p className="text-sm text-silver mb-4">
                          Test your knowledge of the company brain. The AI will ask questions based on your uploaded content.
                        </p>
                        <Button
                          onClick={handleGenerateQuiz}
                          className="bg-automationgreen hover:bg-automationgreen/80 text-white"
                        >
                          <Sparkles className="h-4 w-4 mr-2" />
                          Generate Quiz Question
                        </Button>
                      </div>
                    ) : (
                      <>
                        {/* Question Display */}
                        <div className="p-4 bg-onyx rounded-lg border border-gunmetal">
                          {quizLoading && !quizQuestion ? (
                            <div className="flex items-center gap-2 text-mist">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Generating question...
                            </div>
                          ) : (
                            <p className="text-platinum text-sm leading-relaxed">{quizQuestion}</p>
                          )}
                        </div>

                        {/* Answer Input */}
                        {quizQuestion && !quizLoading && !quizFeedback && (
                          <div className="space-y-3">
                            <Textarea
                              value={quizAnswer}
                              onChange={(e) => setQuizAnswer(e.target.value)}
                              placeholder="Type your answer here... be as specific as you can."
                              className="min-h-[120px] bg-onyx border-gunmetal text-platinum placeholder:text-mist focus:border-automationgreen"
                            />
                            <div className="flex items-center gap-3">
                              <Button
                                onClick={handleSubmitQuizAnswer}
                                disabled={!quizAnswer.trim()}
                                className="bg-automationgreen hover:bg-automationgreen/80 text-white"
                              >
                                <Send className="h-4 w-4 mr-2" />
                                Submit Answer
                              </Button>
                              <Button
                                variant="outline"
                                onClick={handleGenerateQuiz}
                                className="border-gunmetal text-silver hover:text-platinum"
                              >
                                <RotateCcw className="h-4 w-4 mr-2" />
                                Skip Question
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Loading Evaluation */}
                        {quizLoading && quizQuestion && (
                          <div className="flex items-center gap-2 text-mist p-4">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Evaluating your answer...
                          </div>
                        )}

                        {/* Feedback */}
                        {quizFeedback && (
                          <div className="space-y-4">
                            {/* Score Badge */}
                            {quizScore !== null && (
                              <div className="flex items-center gap-3">
                                <div className={cn(
                                  "text-3xl font-bold",
                                  quizScore >= 8 ? "text-automationgreen" : quizScore >= 5 ? "text-warningamber" : "text-errorred"
                                )}>
                                  {quizScore}/10
                                </div>
                                <div>
                                  <p className={cn(
                                    "text-sm font-medium",
                                    quizScore >= 8 ? "text-automationgreen" : quizScore >= 5 ? "text-warningamber" : "text-errorred"
                                  )}>
                                    {quizScore >= 8 ? "Excellent!" : quizScore >= 5 ? "Good effort" : "Needs improvement"}
                                  </p>
                                  <p className="text-xs text-mist">Keep practicing to master your knowledge base</p>
                                </div>
                              </div>
                            )}

                            {/* Feedback Content */}
                            <div ref={responseRef} className="prose prose-invert prose-sm max-w-none max-h-[400px] overflow-y-auto p-4 bg-onyx rounded-lg border border-gunmetal prose-headings:text-platinum prose-p:text-gray-200 prose-strong:text-white prose-li:text-gray-200 prose-a:text-neonblue prose-code:text-automationgreen">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>{quizFeedback}</ReactMarkdown>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-3">
                              <Button
                                onClick={() => {
                                  setQuizQuestion("");
                                  setQuizAnswer("");
                                  setQuizFeedback("");
                                  setQuizScore(null);
                                  handleGenerateQuiz();
                                }}
                                className="bg-automationgreen hover:bg-automationgreen/80 text-white"
                              >
                                <RotateCcw className="h-4 w-4 mr-2" />
                                Next Question
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => handleCopy(quizFeedback)}
                                className="border-gunmetal text-silver hover:text-platinum"
                              >
                                {copied ? <Check className="h-4 w-4 mr-1 text-automationgreen" /> : <Copy className="h-4 w-4 mr-1" />}
                                {copied ? "Copied" : "Copy Feedback"}
                              </Button>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Quiz History Sidebar */}
              <div className="space-y-4">
                <Card className="bg-graphite border-gunmetal">
                  <CardHeader>
                    <CardTitle className="text-platinum text-base flex items-center gap-2">
                      <Lightbulb className="h-4 w-4 text-warningamber" />
                      Quiz History
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {quizHistory.length === 0 ? (
                      <p className="text-sm text-mist text-center py-4">No quiz attempts yet</p>
                    ) : (
                      <div className="space-y-3 max-h-[500px] overflow-y-auto">
                        {quizHistory.map((entry, idx) => (
                          <div key={idx} className="p-3 bg-onyx rounded-lg border border-gunmetal">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] text-mist">Question {quizHistory.length - idx}</span>
                              <span className={cn(
                                "text-xs font-bold",
                                entry.score >= 8 ? "text-automationgreen" : entry.score >= 5 ? "text-warningamber" : "text-errorred"
                              )}>
                                {entry.score}/10
                              </span>
                            </div>
                            <p className="text-xs text-silver line-clamp-2">{entry.question}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Average Score */}
                {quizHistory.length > 0 && (
                  <Card className="bg-onyx border-gunmetal">
                    <CardContent className="p-4 text-center">
                      <p className="text-xs text-mist mb-1">Average Score</p>
                      <p className={cn(
                        "text-3xl font-bold",
                        (quizHistory.reduce((s, e) => s + e.score, 0) / quizHistory.length) >= 7
                          ? "text-automationgreen"
                          : "text-warningamber"
                      )}>
                        {(quizHistory.reduce((s, e) => s + e.score, 0) / quizHistory.length).toFixed(1)}/10
                      </p>
                      <p className="text-xs text-mist mt-1">{quizHistory.length} question{quizHistory.length !== 1 ? "s" : ""} attempted</p>
                    </CardContent>
                  </Card>
                )}

                {/* Tips */}
                <Card className="bg-onyx border-gunmetal">
                  <CardContent className="p-4">
                    <h4 className="font-medium text-platinum mb-2 flex items-center gap-2 text-sm">
                      <Lightbulb className="h-4 w-4 text-warningamber" />
                      Quiz Tips
                    </h4>
                    <ul className="space-y-2 text-xs text-silver">
                      <li>- Be specific with numbers and features</li>
                      <li>- Reference exact pricing when applicable</li>
                      <li>- Mention competitive advantages</li>
                      <li>- Include process steps in order</li>
                      <li>- The more knowledge items you add, the better the quizzes</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ==================== TALK TRACK TAB ==================== */}
        <TabsContent value="talktrack" className="space-y-6 mt-4">
          {knowledge.length === 0 ? (
            <Card className="bg-graphite border-gunmetal">
              <CardContent className="p-12 text-center">
                <Mic className="h-12 w-12 text-mist mx-auto mb-4" />
                <h3 className="text-lg font-medium text-platinum mb-2">Add knowledge first</h3>
                <p className="text-sm text-silver mb-4">
                  You need at least one knowledge item to generate talk tracks from.
                </p>
                <Button onClick={() => setActiveTab("knowledge")} className="bg-neonblue hover:bg-neonblue/80 text-white">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Go to Knowledge Base
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Talk Track Generator */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="bg-graphite border-gunmetal">
                  <CardHeader>
                    <CardTitle className="text-platinum flex items-center gap-2">
                      <Mic className="h-5 w-5 text-warningamber" />
                      Generate Talk Track
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Preset Scenarios */}
                    <div>
                      <label className="text-xs text-mist mb-2 block">Select a scenario or write your own</label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {TALK_TRACK_SCENARIOS.map((scenario) => (
                          <button
                            key={scenario}
                            onClick={() => {
                              setTalkTrackScenario(scenario);
                              setTalkTrackCustom("");
                            }}
                            className={cn(
                              "p-3 rounded-lg text-xs text-left transition-all border",
                              talkTrackScenario === scenario && !talkTrackCustom
                                ? "bg-warningamber/10 border-warningamber/30 text-warningamber"
                                : "bg-onyx border-gunmetal text-silver hover:text-platinum hover:border-gunmetal/80"
                            )}
                          >
                            {scenario}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Custom Scenario */}
                    <div>
                      <label className="text-xs text-mist mb-1 block">Or describe a custom scenario</label>
                      <Textarea
                        value={talkTrackCustom}
                        onChange={(e) => {
                          setTalkTrackCustom(e.target.value);
                          if (e.target.value) setTalkTrackScenario("");
                        }}
                        placeholder="e.g., A prospect from a healthcare company is asking about HIPAA compliance and data security for our enterprise plan..."
                        className="min-h-[80px] bg-onyx border-gunmetal text-platinum placeholder:text-mist focus:border-warningamber"
                      />
                    </div>

                    <Button
                      onClick={handleGenerateTalkTrack}
                      disabled={(!talkTrackScenario && !talkTrackCustom.trim()) || talkTrackLoading}
                      className="bg-warningamber hover:bg-warningamber/80 text-obsidian font-medium"
                    >
                      {talkTrackLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Generate Talk Track
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                {/* Talk Track Response */}
                {(talkTrackResponse || talkTrackLoading) && (
                  <Card className="bg-graphite border-gunmetal">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="text-platinum flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-warningamber" />
                        Generated Talk Track
                      </CardTitle>
                      {talkTrackResponse && !talkTrackLoading && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopy(talkTrackResponse)}
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
                      )}
                    </CardHeader>
                    <CardContent>
                      <div ref={responseRef} className="prose prose-invert prose-sm max-w-none max-h-[600px] overflow-y-auto prose-headings:text-platinum prose-p:text-gray-200 prose-strong:text-white prose-li:text-gray-200 prose-td:text-gray-300 prose-th:text-platinum prose-th:bg-onyx prose-a:text-neonblue prose-code:text-automationgreen prose-blockquote:text-gray-300 prose-blockquote:border-neonblue/50">
                        {talkTrackResponse ? (
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{talkTrackResponse}</ReactMarkdown>
                        ) : (
                          <div className="flex items-center gap-2 text-mist">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Generating talk track...
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Scenario Sidebar */}
              <div className="space-y-4">
                <Card className="bg-graphite border-gunmetal">
                  <CardHeader>
                    <CardTitle className="text-platinum text-base flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-neonblue" />
                      Knowledge Used
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-mist mb-3">
                      The talk track will be generated using these {knowledge.length} knowledge items:
                    </p>
                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                      {knowledge.map((item) => (
                        <div key={item.id} className="flex items-center gap-2 p-2 bg-onyx rounded-lg">
                          <Badge className={cn(
                            "text-[9px] px-1.5 py-0 border-0",
                            item.category === "Product" && "bg-neonblue/10 text-neonblue",
                            item.category === "Pricing" && "bg-automationgreen/10 text-automationgreen",
                            item.category === "Competitor" && "bg-errorred/10 text-errorred",
                            item.category === "Process" && "bg-warningamber/10 text-warningamber",
                            item.category === "FAQ" && "bg-purple-400/10 text-purple-400",
                          )}>
                            {item.category}
                          </Badge>
                          <span className="text-xs text-silver truncate">{item.title}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-onyx border-gunmetal">
                  <CardContent className="p-4">
                    <h4 className="font-medium text-platinum mb-2 flex items-center gap-2 text-sm">
                      <Lightbulb className="h-4 w-4 text-warningamber" />
                      Talk Track Tips
                    </h4>
                    <ul className="space-y-2 text-xs text-silver">
                      <li>- Practice the opening out loud multiple times</li>
                      <li>- Customize the key talking points to your style</li>
                      <li>- Memorize the objection responses word-for-word</li>
                      <li>- Always have a clear next step ready</li>
                      <li>- Add more knowledge items for richer talk tracks</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
