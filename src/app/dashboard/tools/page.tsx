"use client";

import { useState, useRef, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getAuthToken } from "@/lib/auth-token";
import { saveSession } from "@/lib/session-history";
import {
  Mail,
  Target,
  Search,
  Swords,
  ClipboardList,
  Shield,
  Send,
  Loader2,
  Copy,
  Check,
  Sparkles,
  Lightbulb,
  Cpu,
  ChevronDown,
  Volume2,
  Square,
  LucideIcon,
  FileText,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Tool definitions
interface ToolDef {
  id: string;
  name: string;
  shortName: string;
  icon: LucideIcon;
  description: string;
  placeholder: string;
  color: string;
  bgColor: string;
}

const TOOLS: ToolDef[] = [
  {
    id: "email-crafter",
    name: "Email / Message Crafter",
    shortName: "Email",
    icon: Mail,
    description: "Write follow-up emails, cold outreach, and LinkedIn messages",
    placeholder:
      'e.g., "Write a follow-up email to Sarah, VP of Sales at Acme Corp. We had a demo last week where she loved the analytics dashboard but said she needs to check with her CFO about budget."',
    color: "text-neonblue",
    bgColor: "bg-neonblue/10",
  },
  {
    id: "pitch-scorer",
    name: "Pitch Scorer",
    shortName: "Pitch",
    icon: Target,
    description: "Paste your pitch and get scored on clarity, value, urgency, CTA",
    placeholder:
      'e.g., "Our AI-powered platform helps sales teams close 30% more deals by providing real-time coaching during calls. Unlike Gong which only analyzes after the call, we coach you live. Teams see ROI in the first month."',
    color: "text-automationgreen",
    bgColor: "bg-automationgreen/10",
  },
  {
    id: "discovery-questions",
    name: "Discovery Questions",
    shortName: "Discovery",
    icon: Search,
    description: "Generate SPIN framework questions for any sales scenario",
    placeholder:
      'e.g., "I\'m selling an AI-powered CRM to a mid-market SaaS company. Meeting with the VP of Sales. They currently use Salesforce but mentioned it\'s hard to get insights from their data."',
    color: "text-warningamber",
    bgColor: "bg-warningamber/10",
  },
  {
    id: "deal-strategy",
    name: "Deal Strategy Advisor",
    shortName: "Deal",
    icon: ClipboardList,
    description: "MEDDIC analysis, risk assessment, and win strategy",
    placeholder:
      'e.g., "Deal: Acme Corp, $50K ARR. VP Sales is champion. CFO is economic buyer (haven\'t met yet). They\'re evaluating us vs. Competitor X. Demo went well but they said \'need to think about it.\' Timeline: want to decide by end of quarter."',
    color: "text-infocyan",
    bgColor: "bg-infocyan/10",
  },
  {
    id: "call-prep",
    name: "Call Prep Assistant",
    shortName: "Prep",
    icon: ClipboardList,
    description: "Generate a prep sheet before any sales call",
    placeholder:
      'e.g., "Meeting tomorrow with Dr. Sarah Kim, IT Director at Metro Health (500-bed hospital). Discovery call. They\'re evaluating patient management software. Previous vendor failed implementation. HIPAA compliance is critical."',
    color: "text-purple-400",
    bgColor: "bg-purple-400/10",
  },
  {
    id: "battle-cards",
    name: "Battle Cards",
    shortName: "Battle",
    icon: Shield,
    description: "Competitive intelligence against any competitor",
    placeholder:
      'e.g., "Create a battle card for competing against Gong.io. We sell an AI sales coaching tool that offers real-time coaching during calls (not just post-call analysis). Our price is $19/user/month vs their $108-250/user/month."',
    color: "text-errorred",
    bgColor: "bg-errorred/10",
  },
];

// Model selector (reuse from coach page pattern)
type ApiType = "openrouter" | "openai" | "anthropic" | "moonshot";

const AI_MODELS: { id: string; name: string; api: ApiType }[] = [
  { id: "gpt-4.1-mini", name: "GPT-4.1 Mini (Fast)", api: "openai" },
  { id: "kimi-k2.5", name: "Kimi K2.5 (Cheapest)", api: "moonshot" },
  { id: "google/gemini-3-flash-preview", name: "Gemini 3 Flash", api: "openrouter" },
  { id: "claude-sonnet-4-5-20250929", name: "Claude Sonnet 4.5", api: "anthropic" },
  { id: "gpt-4.1", name: "GPT-4.1", api: "openai" },
];

// Email templates for quick use
interface EmailTemplate {
  id: string;
  name: string;
  description: string;
  prompt: string;
}

const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: "demo-booking",
    name: "Demo Booking Request",
    description: "Request a meeting/demo with a new prospect",
    prompt: `Write a compelling demo booking email. Context: I want to book a demo/meeting with a prospect. The email should be friendly, show value upfront, and make it easy to book a time. Include a clear CTA with a calendar link placeholder. Keep it under 100 words.`,
  },
  {
    id: "post-demo-thankyou",
    name: "Post-Demo Thank You",
    description: "Thank you email right after a demo/meeting",
    prompt: `Write a post-demo thank you email. Context: We just finished a product demo. The email should thank them for their time, recap 2-3 key points discussed, address any concerns mentioned, and propose clear next steps. Keep it warm and professional. Under 150 words.`,
  },
  {
    id: "demo-followup",
    name: "Demo Follow-Up (No Reply)",
    description: "Follow up when prospect hasn't replied after demo",
    prompt: `Write a follow-up email for when a prospect hasn't responded after a demo. Context: We did a demo last week but haven't heard back. The email should be friendly (not pushy), reference something specific from the demo, add new value (case study/insight), and give them an easy way to respond. Under 100 words.`,
  },
  {
    id: "new-outreach",
    name: "Cold Outreach / New Contact",
    description: "First-touch email to a brand new prospect",
    prompt: `Write a cold outreach email to a new prospect. Context: This is the first time reaching out. The email must be ultra-concise (under 80 words), start with something relevant to them (not about us), show a clear pain point we solve, include social proof, and end with a simple question (not a meeting request). No attachments, no links.`,
  },
  {
    id: "proposal-followup",
    name: "Proposal / Pricing Follow-Up",
    description: "Follow up after sending a proposal or pricing",
    prompt: `Write a follow-up email after sending a proposal/pricing. Context: We sent a proposal/pricing earlier and want to follow up. The email should reference the proposal, address potential objections preemptively, create gentle urgency, and make it easy to ask questions or schedule a call. Under 120 words.`,
  },
  {
    id: "check-in",
    name: "Quarterly Check-In",
    description: "Re-engage a cold lead or past prospect",
    prompt: `Write a check-in email to re-engage a cold lead. Context: We spoke months ago but the deal went cold. The email should reference our previous conversation, share something new and valuable (industry insight, product update, or relevant news), and open the door without being pushy. Under 100 words.`,
  },
  {
    id: "referral-ask",
    name: "Referral Request",
    description: "Ask a happy customer for a referral",
    prompt: `Write a referral request email to a happy customer. Context: This customer has been using our product successfully. The email should acknowledge their success, make the ask feel natural (not transactional), make it easy to refer (provide a template they can forward), and offer something in return. Under 120 words.`,
  },
  {
    id: "linkedin-connection",
    name: "LinkedIn Connection Message",
    description: "Short LinkedIn connection request message",
    prompt: `Write a LinkedIn connection request message. Context: Reaching out to connect with a potential prospect on LinkedIn. Must be under 300 characters (LinkedIn limit). Should be personal, reference something about them, and NOT sell anything - just connect. Also provide a follow-up message for after they accept.`,
  },
];

// Extract email body from AI response for Gmail/Outlook compose
function extractEmailFromResponse(response: string): { subject: string; body: string } {
  let subject = "";
  let body = response;

  // Try to extract subject line
  const subjectMatch = response.match(/## Subject Line\s*\n+(.+)/i);
  if (subjectMatch) {
    subject = subjectMatch[1].trim();
  }

  // Try to extract email body
  const bodyMatch = response.match(/## Email Body\s*\n+([\s\S]*?)(?=\n## |$)/i);
  if (bodyMatch) {
    body = bodyMatch[1].trim();
  }

  // Clean markdown formatting from body for email
  body = body
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/#{1,3}\s/g, "")
    .trim();

  return { subject, body };
}

function openInGmail(response: string) {
  const { subject, body } = extractEmailFromResponse(response);
  const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.open(gmailUrl, "_blank");
}

function openInOutlook(response: string) {
  const { subject, body } = extractEmailFromResponse(response);
  const outlookUrl = `https://outlook.live.com/mail/0/deeplink/compose?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.open(outlookUrl, "_blank");
}

function openMailto(response: string) {
  const { subject, body } = extractEmailFromResponse(response);
  window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export default function ToolsPage() {
  const [selectedTool, setSelectedTool] = useState(TOOLS[0].id);
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedModel, setSelectedModel] = useState("gpt-4.1-mini");
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const responseRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const tool = TOOLS.find((t) => t.id === selectedTool)!;
  const currentModel = AI_MODELS.find((m) => m.id === selectedModel);

  // Load saved model preference
  useEffect(() => {
    const saved = localStorage.getItem("ai_model");
    if (saved && AI_MODELS.some((m) => m.id === saved)) {
      setSelectedModel(saved);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
      if (audioRef.current) audioRef.current.pause();
    };
  }, []);

  // Auto-scroll response
  useEffect(() => {
    if (responseRef.current) {
      responseRef.current.scrollTop = responseRef.current.scrollHeight;
    }
  }, [response]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setResponse("");
    setError(null);

    try {
      const token = await getAuthToken();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/ai/tools", {
        method: "POST",
        headers,
        body: JSON.stringify({
          type: selectedTool,
          message: input,
          model: selectedModel,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        if (res.status === 402) throw new Error("Usage limit reached. Upgrade your plan to continue.");
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
          setResponse((prev) => prev + text);
        }
      }

      // Auto-save to session history
      saveSession({
        type: "tool",
        toolType: selectedTool,
        title: `${tool.name}: ${input.slice(0, 60)}...`,
        input,
        output: fullResponse,
        model: selectedModel,
      });

    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(msg);
      setResponse(`Error: ${msg}. Try again or switch models.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(response);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleModelChange = (modelId: string) => {
    setSelectedModel(modelId);
    localStorage.setItem("ai_model", modelId);
    setShowModelPicker(false);
  };

  const handleReadAloud = async () => {
    if (!response || isLoadingAudio) return;
    setIsLoadingAudio(true);
    try {
      const res = await fetch("/api/ai/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: response, provider: "openai", openaiVoice: "nova" }),
      });
      if (!res.ok) throw new Error("Failed to generate speech");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
      audioRef.current = new Audio(url);
      audioRef.current.onplay = () => setIsSpeaking(true);
      audioRef.current.onended = () => { setIsSpeaking(false); URL.revokeObjectURL(url); };
      audioRef.current.onerror = () => { setIsSpeaking(false); URL.revokeObjectURL(url); };
      await audioRef.current.play();
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") console.error("TTS Error:", err);
    } finally {
      setIsLoadingAudio(false);
    }
  };

  const handleStopAudio = () => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
    setIsSpeaking(false);
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-platinum flex items-center gap-2">
              <Swords className="h-6 w-6 text-neonblue" />
              Sales Tools
            </h1>
            <p className="text-silver mt-1">
              AI-powered tools for every stage of your sales process
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

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Tool Selector - Left Sidebar */}
          <div className="lg:col-span-1">
            <Card className="bg-graphite border-gunmetal">
              <CardContent className="p-3 space-y-1">
                {TOOLS.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setSelectedTool(t.id);
                      setResponse("");
                      setError(null);
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-all",
                      selectedTool === t.id
                        ? "bg-onyx border border-neonblue/50"
                        : "hover:bg-onyx/50 border border-transparent"
                    )}
                  >
                    <div className={cn("p-2 rounded-lg", t.bgColor)}>
                      <t.icon className={cn("h-4 w-4", t.color)} />
                    </div>
                    <div className="min-w-0">
                      <p className={cn(
                        "text-sm font-medium truncate",
                        selectedTool === t.id ? "text-platinum" : "text-silver"
                      )}>
                        {t.shortName}
                      </p>
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Tool Workspace - Right Area */}
          <div className="lg:col-span-3 space-y-6">
            {/* Tool Header */}
            <div className="flex items-center gap-3">
              <div className={cn("p-3 rounded-lg", tool.bgColor)}>
                <tool.icon className={cn("h-6 w-6", tool.color)} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-platinum">{tool.name}</h2>
                <p className="text-sm text-silver">{tool.description}</p>
              </div>
            </div>

            {/* Email Templates - Only show for email-crafter */}
            {selectedTool === "email-crafter" && (
              <Card className="bg-graphite border-gunmetal">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-platinum flex items-center gap-2">
                    <FileText className="h-4 w-4 text-neonblue" />
                    Quick Templates
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {EMAIL_TEMPLATES.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => {
                          setInput(template.prompt);
                          setResponse("");
                          setError(null);
                        }}
                        className="p-3 rounded-lg bg-onyx border border-gunmetal hover:border-neonblue/50 text-left transition-all group"
                      >
                        <p className="text-xs font-medium text-platinum group-hover:text-neonblue truncate">
                          {template.name}
                        </p>
                        <p className="text-[10px] text-mist mt-1 line-clamp-2">
                          {template.description}
                        </p>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Input Card */}
            <Card className="bg-graphite border-gunmetal">
              <CardHeader>
                <CardTitle className="text-platinum flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-neonblue" />
                  What do you need?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={tool.placeholder}
                    className="min-h-[120px] bg-onyx border-gunmetal text-platinum placeholder:text-mist focus:border-neonblue"
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-mist">
                      <Cpu className="h-3 w-3" />
                      Using: {currentModel?.name}
                    </div>
                    <Button
                      type="submit"
                      disabled={!input.trim() || isLoading}
                      className="bg-neonblue hover:bg-electricblue text-white"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Generate
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Response Card */}
            {(response || isLoading) && (
              <Card className="bg-graphite border-gunmetal">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-platinum flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-warningamber" />
                    Result
                  </CardTitle>
                  {response && !isLoading && (
                    <div className="flex items-center gap-2 flex-wrap">
                      {isSpeaking ? (
                        <Button variant="ghost" size="sm" onClick={handleStopAudio} className="text-errorred hover:text-errorred/80">
                          <Square className="h-4 w-4 mr-1 fill-current" /> Stop
                        </Button>
                      ) : (
                        <Button variant="ghost" size="sm" onClick={handleReadAloud} disabled={isLoadingAudio} className="text-silver hover:text-platinum">
                          {isLoadingAudio ? (
                            <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Loading...</>
                          ) : (
                            <><Volume2 className="h-4 w-4 mr-1" /> Read Aloud</>
                          )}
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={handleCopy} className="text-silver hover:text-platinum">
                        {copied ? (
                          <><Check className="h-4 w-4 mr-1 text-automationgreen" /> Copied</>
                        ) : (
                          <><Copy className="h-4 w-4 mr-1" /> Copy</>
                        )}
                      </Button>
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  <div ref={responseRef} className="prose prose-invert prose-sm max-w-none max-h-[600px] overflow-y-auto prose-headings:text-platinum prose-p:text-gray-200 prose-strong:text-white prose-li:text-gray-200 prose-td:text-gray-300 prose-th:text-platinum prose-th:bg-onyx prose-a:text-neonblue prose-code:text-automationgreen prose-blockquote:text-gray-300 prose-blockquote:border-neonblue/50">
                    {response ? (
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{response}</ReactMarkdown>
                    ) : (
                      <div className="flex items-center gap-2 text-mist">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Generating...
                      </div>
                    )}
                  </div>

                  {/* Send via Gmail/Outlook - Only for email tool */}
                  {selectedTool === "email-crafter" && response && !isLoading && (
                    <div className="mt-6 pt-4 border-t border-gunmetal">
                      <p className="text-xs text-mist mb-3">Send this email directly:</p>
                      <div className="flex items-center gap-3 flex-wrap">
                        <Button
                          onClick={() => openInGmail(response)}
                          size="sm"
                          className="bg-red-600 hover:bg-red-700 text-white gap-2"
                        >
                          <Mail className="h-4 w-4" />
                          Open in Gmail
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                        <Button
                          onClick={() => openInOutlook(response)}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                        >
                          <Mail className="h-4 w-4" />
                          Open in Outlook
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                        <Button
                          onClick={() => openMailto(response)}
                          variant="outline"
                          size="sm"
                          className="border-gunmetal text-silver hover:text-platinum gap-2"
                        >
                          <Mail className="h-4 w-4" />
                          Default Email App
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
