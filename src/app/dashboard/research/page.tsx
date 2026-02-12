"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getAuthToken } from "@/lib/auth-token";
import { saveSession } from "@/lib/session-history";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Globe,
  Search,
  Send,
  Loader2,
  Copy,
  Check,
  Lightbulb,
  Sparkles,
  Building,
  UserSearch,
  FileDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { exportToPDF } from "@/lib/export-pdf";

const RESEARCH_TEMPLATES = [
  {
    label: "Company Research",
    icon: Building,
    prompt: "Research [Company Name] for an upcoming sales call",
  },
  {
    label: "Decision Makers",
    icon: UserSearch,
    prompt: "Find key decision makers at [Company]",
  },
  {
    label: "Latest News",
    icon: Globe,
    prompt: "What are the latest news about [Company]?",
  },
  {
    label: "Industry Trends",
    icon: Lightbulb,
    prompt: "Industry trends in [Industry] that affect buying decisions",
  },
  {
    label: "Competitive Landscape",
    icon: Search,
    prompt: "Competitive landscape for [Product Category]",
  },
];

function ResearchPageInner() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const responseRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Pre-fill from CRM query params
  useEffect(() => {
    const company = searchParams.get("company");
    if (company) {
      setQuery(`Research ${company} for an upcoming sales call. I need to know their recent funding, key executives, tech stack, and any pain points I can address.`);
    }
  }, [searchParams]);

  useEffect(() => {
    if (responseRef.current) {
      responseRef.current.scrollTop = responseRef.current.scrollHeight;
    }
  }, [response]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setResponse("");
    setError(null);

    try {
      const token = await getAuthToken();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch("/api/ai/research", {
        method: "POST",
        headers,
        body: JSON.stringify({ query }),
        signal: abortControllerRef.current.signal,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        if (res.status === 402) {
          throw new Error("Usage limit reached. Upgrade your plan to continue.");
        }
        throw new Error(errorData.details || errorData.error || `Request failed with status ${res.status}`);
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
          setResponse((prev) => prev + text);
        }
      }

      saveSession({
        type: "tool",
        toolType: "research",
        title: `Research: ${query.slice(0, 60)}${query.length > 60 ? "..." : ""}`,
        input: query,
        output: fullResponse,
      });

    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      setResponse(`Sorry, there was an error: ${errorMessage}. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTemplateClick = (prompt: string) => {
    setQuery(prompt);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(response);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-platinum flex items-center gap-2">
            <Globe className="h-6 w-6 text-neonblue" />
            Prospect & Company Research
          </h1>
          <p className="text-silver mt-1">
            AI-powered research using Perplexity to prep for any sales conversation
          </p>
        </div>

        <Card className="bg-graphite border-gunmetal">
          <CardHeader>
            <CardTitle className="text-platinum flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-neonblue" />
              Quick Research Templates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {RESEARCH_TEMPLATES.map((template) => (
                <button
                  key={template.label}
                  onClick={() => handleTemplateClick(template.prompt)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-all",
                    "bg-onyx border border-gunmetal text-silver",
                    "hover:border-neonblue/50 hover:text-platinum hover:bg-onyx/80"
                  )}
                >
                  <template.icon className="h-4 w-4 text-neonblue" />
                  {template.label}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-graphite border-gunmetal">
          <CardHeader>
            <CardTitle className="text-platinum flex items-center gap-2">
              <Search className="h-5 w-5 text-neonblue" />
              Research Query
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder='e.g., "Research Acme Corp for an upcoming sales call. I need to know their recent funding, key executives, tech stack, and any pain points I can address..."'
                className="min-h-[120px] bg-onyx border-gunmetal text-platinum placeholder:text-mist focus:border-neonblue resize-none"
              />
              {error && (
                <p className="text-sm text-errorred">{error}</p>
              )}
              <div className="flex items-center justify-between">
                <p className="text-xs text-mist flex items-center gap-1">
                  <Globe className="h-3 w-3" />
                  Powered by Perplexity AI with live web search
                </p>
                <Button
                  type="submit"
                  disabled={!query.trim() || isLoading}
                  className="bg-neonblue hover:bg-electricblue text-white"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Researching...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Research
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {(response || isLoading) && (
          <Card className="bg-graphite border-gunmetal">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-platinum flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-warningamber" />
                Research Results
              </CardTitle>
              {response && !isLoading && (
                <div className="flex items-center gap-1">
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
                    onClick={() =>
                      exportToPDF({
                        title: `Research: ${query.slice(0, 50)}`,
                        content: response,
                        subtitle: "Perplexity AI Research Report",
                        metadata: { Date: new Date().toLocaleDateString() },
                      })
                    }
                    className="text-silver hover:text-platinum"
                  >
                    <FileDown className="h-4 w-4 mr-1" />
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
                {response ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{response}</ReactMarkdown>
                ) : (
                  <div className="flex items-center gap-2 text-mist">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Searching the web and analyzing results...
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

export default function ResearchPage() {
  return (
    <Suspense>
      <ResearchPageInner />
    </Suspense>
  );
}
