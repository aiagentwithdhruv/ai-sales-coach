"use client";

import { useState, useRef, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getAuthToken, useCredits } from "@/hooks/useCredits";
import { saveSession } from "@/lib/session-history";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  FileText,
  Send,
  Loader2,
  Copy,
  Check,
  Lightbulb,
  Sparkles,
  Download,
  ClipboardList,
  Cpu,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { exportToPDF } from "@/lib/export-pdf";

type ApiType = "openrouter" | "openai" | "anthropic" | "moonshot";

const AI_MODELS: { id: string; name: string; api: ApiType }[] = [
  { id: "gpt-4.1-mini", name: "GPT-4.1 Mini (Fast)", api: "openai" },
  { id: "kimi-k2.5", name: "Kimi K2.5 (Cheapest)", api: "moonshot" },
  { id: "google/gemini-3-flash-preview", name: "Gemini 3 Flash", api: "openrouter" },
  { id: "claude-sonnet-4-5-20250929", name: "Claude Sonnet 4.5", api: "anthropic" },
  { id: "gpt-4.1", name: "GPT-4.1", api: "openai" },
];

export default function MeetingNotesPage() {
  const [notes, setNotes] = useState("");
  const [summary, setSummary] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState("gpt-4.1-mini");
  const [showModelPicker, setShowModelPicker] = useState(false);
  const responseRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const { refetch: refetchCredits } = useCredits();
  const currentModel = AI_MODELS.find((m) => m.id === selectedModel);

  useEffect(() => {
    const saved = localStorage.getItem("ai_model");
    if (saved && AI_MODELS.some((m) => m.id === saved)) {
      setSelectedModel(saved);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  useEffect(() => {
    if (responseRef.current) {
      responseRef.current.scrollTop = responseRef.current.scrollHeight;
    }
  }, [summary]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notes.trim() || isLoading) return;

    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setSummary("");
    setError(null);

    try {
      const token = await getAuthToken();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/ai/summarize", {
        method: "POST",
        headers,
        body: JSON.stringify({
          notes,
          model: selectedModel,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        if (res.status === 402) throw new Error("Out of credits!");
        throw new Error(errorData.details || errorData.error || `Request failed (${res.status})`);
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullResponse = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const text = decoder.decode(value);
          fullResponse += text;
          setSummary((prev) => prev + text);
        }
      }

      saveSession({
        type: "tool",
        toolType: "meeting-notes",
        title: `Meeting Notes: ${notes.slice(0, 60)}...`,
        input: notes,
        output: fullResponse,
        model: selectedModel,
      });

      refetchCredits();
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(msg);
      setSummary(`Error: ${msg}. Try again or switch models.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportTxt = () => {
    const blob = new Blob([summary], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `meeting-summary-${new Date().toISOString().split("T")[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = () => {
    exportToPDF({
      title: "Meeting Summary",
      content: summary,
      subtitle: `Summarized with ${currentModel?.name || selectedModel}`,
      metadata: {
        Date: new Date().toLocaleDateString(),
        "Input Length": `${notes.length} characters`,
      },
    });
  };

  const handleModelChange = (modelId: string) => {
    setSelectedModel(modelId);
    localStorage.setItem("ai_model", modelId);
    setShowModelPicker(false);
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-platinum flex items-center gap-2">
              <ClipboardList className="h-6 w-6 text-neonblue" />
              Meeting Notes Summarizer
            </h1>
            <p className="text-silver mt-1">
              Paste your meeting notes or transcript and get an AI-powered summary with action items
            </p>
          </div>

          <div className="relative">
            <Button
              variant="outline"
              onClick={() => setShowModelPicker(!showModelPicker)}
              className="border-gunmetal text-silver hover:text-platinum gap-2"
            >
              <Cpu className="h-4 w-4 text-neonblue" />
              <span className="hidden sm:inline">{currentModel?.name}</span>
              <ChevronDown className="h-4 w-4" />
            </Button>

            {showModelPicker && (
              <div className="absolute right-0 mt-2 w-64 bg-graphite border border-gunmetal rounded-lg shadow-xl z-50">
                <div className="p-2">
                  <p className="text-xs text-mist px-2 py-1">Select AI Model</p>
                  {AI_MODELS.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => handleModelChange(model.id)}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                        selectedModel === model.id
                          ? "bg-neonblue/10 text-neonblue"
                          : "text-silver hover:text-platinum hover:bg-onyx"
                      )}
                    >
                      <div className="font-medium">{model.name}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-graphite border-gunmetal">
              <CardHeader>
                <CardTitle className="text-platinum flex items-center gap-2">
                  <FileText className="h-5 w-5 text-neonblue" />
                  Meeting Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Paste your meeting notes, transcript, or call recording transcript here..."
                    className="min-h-[200px] bg-onyx border-gunmetal text-platinum placeholder:text-mist focus:border-neonblue"
                  />
                  {error && (
                    <p className="text-sm text-errorred">{error}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-mist">
                      <Cpu className="h-3 w-3" />
                      Using: {currentModel?.name}
                    </div>
                    <Button
                      type="submit"
                      disabled={!notes.trim() || isLoading}
                      className="bg-neonblue hover:bg-electricblue text-white"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Summarizing...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Summarize
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {(summary || isLoading) && (
              <Card className="bg-graphite border-gunmetal">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-platinum flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-warningamber" />
                    Summary
                  </CardTitle>
                  {summary && !isLoading && (
                    <div className="flex items-center gap-2">
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
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleExportTxt}
                        className="text-silver hover:text-platinum"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        TXT
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleExportPDF}
                        className="text-silver hover:text-platinum"
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        PDF
                      </Button>
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  <div
                    ref={responseRef}
                    className="prose prose-invert prose-sm max-w-none max-h-[600px] overflow-y-auto prose-headings:text-platinum prose-p:text-gray-200 prose-strong:text-white prose-li:text-gray-200 prose-td:text-gray-300 prose-th:text-platinum prose-th:bg-onyx prose-a:text-neonblue prose-code:text-automationgreen prose-blockquote:text-gray-300 prose-blockquote:border-neonblue/50"
                  >
                    {summary ? (
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {summary}
                      </ReactMarkdown>
                    ) : (
                      <div className="flex items-center gap-2 text-mist">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Summarizing your meeting notes...
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="lg:col-span-1">
            <Card className="bg-graphite border-gunmetal">
              <CardHeader>
                <CardTitle className="text-platinum flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-warningamber" />
                  Quick Tips
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-mist">For best results:</p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2 text-sm text-silver">
                    <div className="h-1.5 w-1.5 rounded-full bg-neonblue mt-1.5 shrink-0" />
                    Include attendee names
                  </li>
                  <li className="flex items-start gap-2 text-sm text-silver">
                    <div className="h-1.5 w-1.5 rounded-full bg-neonblue mt-1.5 shrink-0" />
                    Include timestamps if available
                  </li>
                  <li className="flex items-start gap-2 text-sm text-silver">
                    <div className="h-1.5 w-1.5 rounded-full bg-neonblue mt-1.5 shrink-0" />
                    Note any decisions made
                  </li>
                  <li className="flex items-start gap-2 text-sm text-silver">
                    <div className="h-1.5 w-1.5 rounded-full bg-neonblue mt-1.5 shrink-0" />
                    Include any action items mentioned
                  </li>
                </ul>
                <div className="pt-3 border-t border-gunmetal">
                  <p className="text-xs text-mist">
                    The AI will extract key decisions, action items with owners, buying signals, red flags, and draft a follow-up email.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
