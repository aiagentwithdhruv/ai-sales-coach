"use client";

import { useState, useRef, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { getAuthToken } from "@/lib/auth-token";
import { saveSession } from "@/lib/session-history";
import { PRACTICE_SCENARIOS, type Scenario } from "@/lib/scenarios";
import {
  MessageSquare,
  Send,
  Loader2,
  User,
  Bot,
  Trophy,
  ArrowLeft,
  ChevronRight,
  Cpu,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Personas for text practice
const TEXT_PERSONAS = [
  {
    id: "startup-ceo",
    name: "Alex Rivera",
    title: "CEO & Founder",
    company: "DataPulse",
    industry: "SaaS / Analytics",
    personality: "Friendly but busy. Values efficiency and quick demos.",
    difficulty: "easy",
  },
  {
    id: "enterprise-vp",
    name: "Patricia Chen",
    title: "VP of Operations",
    company: "Atlas Manufacturing",
    industry: "Manufacturing",
    personality: "Analytical, risk-averse. Needs ROI proof and references.",
    difficulty: "medium",
  },
  {
    id: "skeptical-director",
    name: "Jennifer Rodriguez",
    title: "Director of Sales",
    company: "Velocity Consulting",
    industry: "Consulting",
    personality: "Highly skeptical, been burned before. Tests you hard.",
    difficulty: "hard",
  },
  {
    id: "gatekeeper",
    name: "David Park",
    title: "Executive Assistant",
    company: "Apex Financial",
    industry: "Financial Services",
    personality: "Protective gatekeeper. Screens all calls for the CEO.",
    difficulty: "medium",
  },
];

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type ApiType = "openrouter" | "openai" | "anthropic" | "moonshot";

const AI_MODELS: { id: string; name: string; api: ApiType }[] = [
  { id: "gpt-4.1-mini", name: "GPT-4.1 Mini (Fast)", api: "openai" },
  { id: "kimi-k2.5", name: "Kimi K2.5 (Cheapest)", api: "moonshot" },
  { id: "google/gemini-3-flash-preview", name: "Gemini 3 Flash", api: "openrouter" },
  { id: "claude-sonnet-4-5-20250929", name: "Claude Sonnet 4.5", api: "anthropic" },
];

export default function TextPracticePage() {
  const [step, setStep] = useState<"setup" | "chat" | "score">("setup");
  const [selectedPersona, setSelectedPersona] = useState(TEXT_PERSONAS[0]);
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [scoreResponse, setScoreResponse] = useState("");
  const [isScoring, setIsScoring] = useState(false);
  const [selectedModel, setSelectedModel] = useState("gpt-4.1-mini");
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [showScenarios, setShowScenarios] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Load model preference
  useEffect(() => {
    const saved = localStorage.getItem("ai_model");
    if (saved && AI_MODELS.some((m) => m.id === saved)) {
      setSelectedModel(saved);
    }
  }, []);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Cleanup
  useEffect(() => {
    return () => { if (abortRef.current) abortRef.current.abort(); };
  }, []);

  const startSession = async () => {
    setStep("chat");
    setMessages([]);

    // Get initial prospect greeting
    setIsLoading(true);
    try {
      const token = await getAuthToken();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/ai/text-practice", {
        method: "POST",
        headers,
        body: JSON.stringify({
          mode: "chat",
          messages: [{ role: "user", content: "Hello" }],
          persona: selectedPersona,
          scenario: selectedScenario ? {
            situation: selectedScenario.situation,
            objective: selectedScenario.objective,
          } : undefined,
          model: selectedModel,
        }),
      });

      if (!res.ok) throw new Error("Failed to start session");

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let greeting = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          greeting += decoder.decode(value);
          setMessages([{ role: "assistant", content: greeting }]);
        }
      }

    } catch (err) {
      console.error("Start error:", err);
      setMessages([{ role: "assistant", content: `Hello, this is ${selectedPersona.name}. How can I help you?` }]);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    const newMessages: ChatMessage[] = [...messages, { role: "user", content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    try {
      const token = await getAuthToken();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/ai/text-practice", {
        method: "POST",
        headers,
        body: JSON.stringify({
          mode: "chat",
          messages: newMessages,
          persona: selectedPersona,
          scenario: selectedScenario ? {
            situation: selectedScenario.situation,
            objective: selectedScenario.objective,
          } : undefined,
          model: selectedModel,
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to get response");
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMsg = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          assistantMsg += decoder.decode(value);
          setMessages([...newMessages, { role: "assistant", content: assistantMsg }]);
        }
      }

    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      console.error("Chat error:", err);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const endAndScore = async () => {
    if (messages.length < 4) {
      alert("Have at least 2 exchanges before scoring.");
      return;
    }

    setStep("score");
    setIsScoring(true);
    setScoreResponse("");

    try {
      const token = await getAuthToken();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/ai/text-practice", {
        method: "POST",
        headers,
        body: JSON.stringify({
          mode: "score",
          messages,
          persona: selectedPersona,
          model: selectedModel,
        }),
      });

      if (!res.ok) throw new Error("Failed to score");

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullScore = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          fullScore += decoder.decode(value);
          setScoreResponse(fullScore);
        }
      }

      // Save to history
      const conversationText = messages
        .map((m) => `${m.role === "user" ? "You" : selectedPersona.name}: ${m.content}`)
        .join("\n\n");

      saveSession({
        type: "practice",
        title: `Text Practice: ${selectedPersona.name} (${selectedPersona.difficulty})`,
        input: conversationText,
        output: fullScore,
        model: selectedModel,
      });

    } catch (err) {
      console.error("Score error:", err);
      setScoreResponse("Failed to generate score. Please try again.");
    } finally {
      setIsScoring(false);
    }
  };

  const resetSession = () => {
    setStep("setup");
    setMessages([]);
    setScoreResponse("");
    setSelectedScenario(null);
  };

  // ===== SETUP SCREEN =====
  if (step === "setup") {
    return (
      <DashboardLayout>
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-platinum flex items-center gap-2">
                <MessageSquare className="h-6 w-6 text-neonblue" />
                Text Practice
              </h1>
              <p className="text-silver mt-1">
                Practice selling via text chat — cheaper than voice, still effective
              </p>
            </div>

            {/* Model Selector */}
            <div className="relative">
              <Button
                variant="outline"
                onClick={() => setShowModelPicker(!showModelPicker)}
                className="border-gunmetal text-silver hover:text-platinum gap-2"
              >
                <Cpu className="h-4 w-4 text-neonblue" />
                <span className="hidden sm:inline">{AI_MODELS.find(m => m.id === selectedModel)?.name}</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
              {showModelPicker && (
                <div className="absolute right-0 mt-2 w-56 bg-graphite border border-gunmetal rounded-lg shadow-xl z-50">
                  <div className="p-2">
                    {AI_MODELS.map((model) => (
                      <button
                        key={model.id}
                        onClick={() => { setSelectedModel(model.id); setShowModelPicker(false); }}
                        className={cn(
                          "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                          selectedModel === model.id ? "bg-neonblue/10 text-neonblue" : "text-silver hover:text-platinum hover:bg-onyx"
                        )}
                      >
                        {model.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Persona Selection */}
            <Card className="bg-graphite border-gunmetal">
              <CardHeader>
                <CardTitle className="text-platinum">Choose Your Prospect</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {TEXT_PERSONAS.map((persona) => (
                  <button
                    key={persona.id}
                    onClick={() => setSelectedPersona(persona)}
                    className={cn(
                      "w-full p-4 rounded-lg text-left transition-all border",
                      selectedPersona.id === persona.id
                        ? "bg-onyx border-neonblue/50"
                        : "bg-onyx/50 border-gunmetal hover:border-neonblue/30"
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-platinum">{persona.name}</h4>
                      <Badge className={cn(
                        "text-xs",
                        persona.difficulty === "easy" && "bg-automationgreen/20 text-automationgreen",
                        persona.difficulty === "medium" && "bg-warningamber/20 text-warningamber",
                        persona.difficulty === "hard" && "bg-errorred/20 text-errorred"
                      )}>
                        {persona.difficulty}
                      </Badge>
                    </div>
                    <p className="text-sm text-silver">{persona.title} at {persona.company}</p>
                    <p className="text-xs text-mist mt-1">{persona.personality}</p>
                  </button>
                ))}
              </CardContent>
            </Card>

            {/* Scenario Selection */}
            <div className="space-y-6">
              <Card className="bg-graphite border-gunmetal">
                <CardHeader className="cursor-pointer" onClick={() => setShowScenarios(!showScenarios)}>
                  <CardTitle className="text-platinum flex items-center justify-between">
                    <span>Choose a Scenario <span className="text-sm font-normal text-mist">(optional)</span></span>
                    <ChevronRight className={cn("h-5 w-5 text-silver transition-transform", showScenarios && "rotate-90")} />
                  </CardTitle>
                </CardHeader>
                {showScenarios && (
                  <CardContent className="space-y-2 max-h-[400px] overflow-y-auto">
                    {PRACTICE_SCENARIOS.slice(0, 12).map((scenario) => (
                      <button
                        key={scenario.id}
                        onClick={() => setSelectedScenario(selectedScenario?.id === scenario.id ? null : scenario)}
                        className={cn(
                          "w-full p-3 rounded-lg text-left transition-all border",
                          selectedScenario?.id === scenario.id
                            ? "bg-onyx border-neonblue/50"
                            : "border-gunmetal hover:border-neonblue/30"
                        )}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-sm font-medium text-platinum">{scenario.title}</h4>
                          <Badge className={cn(
                            "text-[10px]",
                            scenario.difficulty === "easy" && "bg-automationgreen/20 text-automationgreen",
                            scenario.difficulty === "medium" && "bg-warningamber/20 text-warningamber",
                            scenario.difficulty === "hard" && "bg-errorred/20 text-errorred"
                          )}>
                            {scenario.difficulty}
                          </Badge>
                        </div>
                        <p className="text-xs text-silver line-clamp-2">{scenario.situation}</p>
                      </button>
                    ))}
                  </CardContent>
                )}
              </Card>

              {/* Session Summary */}
              <Card className="bg-graphite border-gunmetal">
                <CardHeader>
                  <CardTitle className="text-platinum">Session Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-xs text-mist">Prospect</p>
                    <p className="text-sm text-platinum">{selectedPersona.name} — {selectedPersona.title}</p>
                  </div>
                  <div>
                    <p className="text-xs text-mist">Company</p>
                    <p className="text-sm text-platinum">{selectedPersona.company}</p>
                  </div>
                  <div>
                    <p className="text-xs text-mist">Difficulty</p>
                    <Badge className={cn(
                      selectedPersona.difficulty === "easy" && "bg-automationgreen/20 text-automationgreen",
                      selectedPersona.difficulty === "medium" && "bg-warningamber/20 text-warningamber",
                      selectedPersona.difficulty === "hard" && "bg-errorred/20 text-errorred"
                    )}>
                      {selectedPersona.difficulty}
                    </Badge>
                  </div>
                  {selectedScenario && (
                    <div>
                      <p className="text-xs text-mist">Scenario</p>
                      <p className="text-sm text-platinum">{selectedScenario.title}</p>
                    </div>
                  )}

                  <Button onClick={startSession} className="w-full bg-neonblue hover:bg-electricblue text-white mt-4">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Start Text Practice
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ===== SCORE SCREEN =====
  if (step === "score") {
    return (
      <DashboardLayout>
        <div className="p-6 space-y-6 max-w-4xl mx-auto">
          <Button variant="ghost" onClick={resetSession} className="text-silver hover:text-platinum">
            <ArrowLeft className="h-4 w-4 mr-2" /> New Session
          </Button>

          <div className="text-center mb-6">
            <Trophy className="h-12 w-12 text-warningamber mx-auto mb-3" />
            <h1 className="text-2xl font-bold text-platinum">Session Complete!</h1>
            <p className="text-silver mt-1">
              {messages.filter(m => m.role === "user").length} messages exchanged with {selectedPersona.name}
            </p>
          </div>

          <Card className="bg-graphite border-gunmetal">
            <CardHeader>
              <CardTitle className="text-platinum flex items-center gap-2">
                <Trophy className="h-5 w-5 text-warningamber" />
                Performance Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-invert prose-sm max-w-none prose-headings:text-platinum prose-p:text-gray-200 prose-strong:text-white prose-li:text-gray-200 prose-td:text-gray-300 prose-th:text-platinum prose-th:bg-onyx prose-a:text-neonblue prose-code:text-automationgreen prose-blockquote:text-gray-300 prose-blockquote:border-neonblue/50">
                {scoreResponse ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{scoreResponse}</ReactMarkdown>
                ) : (
                  <div className="flex items-center gap-2 text-mist">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analyzing your performance...
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Show conversation */}
          <Card className="bg-graphite border-gunmetal">
            <CardHeader>
              <CardTitle className="text-sm text-mist">Conversation Replay</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-h-[400px] overflow-y-auto">
              {messages.map((msg, i) => (
                <div key={i} className={cn("flex gap-3", msg.role === "user" && "flex-row-reverse")}>
                  <div className={cn(
                    "p-1.5 rounded-full h-7 w-7 flex items-center justify-center shrink-0",
                    msg.role === "user" ? "bg-neonblue/10" : "bg-warningamber/10"
                  )}>
                    {msg.role === "user" ? <User className="h-3.5 w-3.5 text-neonblue" /> : <Bot className="h-3.5 w-3.5 text-warningamber" />}
                  </div>
                  <div className={cn(
                    "max-w-[75%] px-4 py-2 rounded-2xl text-sm",
                    msg.role === "user"
                      ? "bg-neonblue text-white rounded-tr-sm"
                      : "bg-onyx text-silver rounded-tl-sm"
                  )}>
                    {msg.content}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  // ===== CHAT SCREEN =====
  return (
    <DashboardLayout>
      <div className="p-6 flex flex-col h-[calc(100vh-2rem)]">
        {/* Chat Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={resetSession} className="text-silver hover:text-platinum">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="h-10 w-10 rounded-full bg-warningamber/10 flex items-center justify-center">
              <Bot className="h-5 w-5 text-warningamber" />
            </div>
            <div>
              <h2 className="font-medium text-platinum">{selectedPersona.name}</h2>
              <p className="text-xs text-silver">{selectedPersona.title} at {selectedPersona.company}</p>
            </div>
            <Badge className={cn(
              "text-xs ml-2",
              selectedPersona.difficulty === "easy" && "bg-automationgreen/20 text-automationgreen",
              selectedPersona.difficulty === "medium" && "bg-warningamber/20 text-warningamber",
              selectedPersona.difficulty === "hard" && "bg-errorred/20 text-errorred"
            )}>
              {selectedPersona.difficulty}
            </Badge>
          </div>
          <Button
            onClick={endAndScore}
            disabled={messages.length < 4 || isScoring}
            className="bg-warningamber hover:bg-warningamber/80 text-black"
          >
            <Trophy className="h-4 w-4 mr-2" />
            End & Score
          </Button>
        </div>

        {/* Messages */}
        <Card className="bg-graphite border-gunmetal flex-1 flex flex-col overflow-hidden">
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={cn("flex gap-3", msg.role === "user" && "flex-row-reverse")}>
                <div className={cn(
                  "p-1.5 rounded-full h-8 w-8 flex items-center justify-center shrink-0",
                  msg.role === "user" ? "bg-neonblue/10" : "bg-warningamber/10"
                )}>
                  {msg.role === "user"
                    ? <User className="h-4 w-4 text-neonblue" />
                    : <Bot className="h-4 w-4 text-warningamber" />
                  }
                </div>
                <div className={cn(
                  "max-w-[75%] px-4 py-3 rounded-2xl text-sm",
                  msg.role === "user"
                    ? "bg-neonblue text-white rounded-tr-sm"
                    : "bg-onyx text-silver rounded-tl-sm"
                )}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3">
                <div className="p-1.5 rounded-full h-8 w-8 flex items-center justify-center bg-warningamber/10">
                  <Bot className="h-4 w-4 text-warningamber" />
                </div>
                <div className="bg-onyx px-4 py-3 rounded-2xl rounded-tl-sm">
                  <Loader2 className="h-4 w-4 animate-spin text-mist" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </CardContent>

          {/* Input */}
          <div className="border-t border-gunmetal p-4">
            <form
              onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
              className="flex items-center gap-3"
            >
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your response..."
                className="flex-1 bg-onyx border-gunmetal text-platinum placeholder:text-mist focus:border-neonblue"
                disabled={isLoading}
              />
              <Button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="bg-neonblue hover:bg-electricblue text-white"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
            <p className="text-[10px] text-mist mt-2 text-center">
              {messages.filter(m => m.role === "user").length} messages sent • Type naturally as if you're on a real sales call
            </p>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
