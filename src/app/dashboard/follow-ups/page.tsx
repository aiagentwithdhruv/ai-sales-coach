"use client";

import { useState, useRef, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { getAuthToken } from "@/lib/auth-token";
import { saveSession } from "@/lib/session-history";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Mail,
  Send,
  Copy,
  Clock,
  Check,
  Linkedin,
  ArrowRight,
  Loader2,
  Calendar,
  User,
  Building2,
  Sparkles,
  Plus,
  Trash2,
  Edit3,
  FileText,
  MessageSquare,
  ChevronDown,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ===== TYPES =====

type FollowUpType = "thank-you" | "check-in" | "proposal" | "next-steps" | "objection-followup";
type ToneType = "professional" | "friendly" | "assertive" | "consultative";
type ChannelType = "email" | "linkedin";
type QueueStatus = "draft" | "scheduled" | "sent";

interface QueueItem {
  id: string;
  contactName: string;
  company: string;
  followUpType: FollowUpType;
  channel: ChannelType;
  status: QueueStatus;
  subject?: string;
  message: string;
  createdAt: number;
  scheduledFor?: string;
}

// ===== CONSTANTS =====

const FOLLOW_UP_TYPES: { value: FollowUpType; label: string; description: string }[] = [
  { value: "thank-you", label: "Thank You", description: "Post-meeting appreciation" },
  { value: "check-in", label: "Check-in", description: "Friendly status update" },
  { value: "proposal", label: "Proposal", description: "Send or follow up on proposal" },
  { value: "next-steps", label: "Next Steps", description: "Outline action items" },
  { value: "objection-followup", label: "Objection Follow-up", description: "Address concerns raised" },
];

const TONE_OPTIONS: { value: ToneType; label: string; emoji: string }[] = [
  { value: "professional", label: "Professional", emoji: "P" },
  { value: "friendly", label: "Friendly", emoji: "F" },
  { value: "assertive", label: "Assertive", emoji: "A" },
  { value: "consultative", label: "Consultative", emoji: "C" },
];

const CHANNEL_OPTIONS: { value: ChannelType; label: string; icon: typeof Mail }[] = [
  { value: "email", label: "Email", icon: Mail },
  { value: "linkedin", label: "LinkedIn Message", icon: Linkedin },
];

const QUEUE_STORAGE_KEY = "sales-coach-followup-queue";

// ===== HELPER FUNCTIONS =====

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function loadQueue(): QueueItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(QUEUE_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as QueueItem[];
  } catch {
    return [];
  }
}

function persistQueue(items: QueueItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(items));
}

function buildFollowUpPrompt(params: {
  callNotes: string;
  contactName: string;
  company: string;
  callDate: string;
  followUpType: FollowUpType;
  tone: ToneType;
  channel: ChannelType;
}): string {
  const typeLabels: Record<FollowUpType, string> = {
    "thank-you": "Thank You / Post-meeting appreciation",
    "check-in": "Check-in / Friendly status update",
    "proposal": "Proposal follow-up / Send proposal details",
    "next-steps": "Next Steps / Outline agreed action items",
    "objection-followup": "Objection Follow-up / Address concerns and hesitations raised",
  };

  const toneGuidance: Record<ToneType, string> = {
    professional: "Keep the tone formal, polished, and business-appropriate. Use proper salutations and sign-offs.",
    friendly: "Keep the tone warm, personable, and conversational while remaining professional. Use first names freely.",
    assertive: "Keep the tone confident and direct. Clearly state value propositions and create urgency without being pushy.",
    consultative: "Keep the tone advisory and helpful. Position yourself as a trusted advisor who understands their challenges.",
  };

  const channelGuidance = params.channel === "email"
    ? "Format as a professional email. Include a compelling subject line on the FIRST line prefixed with 'Subject: '. Then include the full email body with proper greeting and sign-off. Keep it concise but thorough (150-250 words for the body)."
    : "Format as a LinkedIn message. Keep it shorter and more conversational (80-150 words). No subject line needed. Start with a personalized opening. LinkedIn messages should feel like a natural continuation of a conversation.";

  return `You are an expert sales communication specialist. Generate a ${typeLabels[params.followUpType]} follow-up message.

CONTEXT:
- Contact: ${params.contactName} at ${params.company}
- Call/Meeting Date: ${params.callDate}
- Channel: ${params.channel === "email" ? "Email" : "LinkedIn Message"}
- Follow-up Type: ${typeLabels[params.followUpType]}

CALL NOTES / MEETING SUMMARY:
${params.callNotes}

TONE: ${params.tone}
${toneGuidance[params.tone]}

CHANNEL FORMATTING:
${channelGuidance}

INSTRUCTIONS:
1. Reference specific points from the call notes to make it personalized
2. Include a clear call-to-action or next step
3. Keep it natural — avoid generic templates that feel automated
4. If this is an objection follow-up, address the specific concerns with empathy and provide value
5. Do NOT use placeholder brackets like [Your Name] — write a complete message ready to send
6. Sign off as the sales representative (use "Best regards" or similar)

Generate the follow-up message now.`;
}

function buildVariationsPrompt(params: {
  originalMessage: string;
  contactName: string;
  company: string;
  channel: ChannelType;
}): string {
  const channelNote = params.channel === "email"
    ? "Each variation should include a Subject line."
    : "These are LinkedIn messages — keep them conversational.";

  return `You are an expert sales communication specialist. I have a follow-up message for ${params.contactName} at ${params.company}. Generate 3 variations of this message at different lengths.

ORIGINAL MESSAGE:
${params.originalMessage}

${channelNote}

Generate exactly 3 variations clearly labeled:

## Short Version
(50-80 words, punchy and to-the-point)

## Medium Version
(120-180 words, balanced detail)

## Detailed Version
(200-300 words, comprehensive with additional context and value propositions)

Make each variation feel unique — not just a trimmed or padded version of the same message. Each should take a slightly different angle while maintaining the same core intent and call-to-action.`;
}

// ===== COMPONENT =====

function FollowUpsPageInner() {
  const searchParams = useSearchParams();

  // Form state
  const [callNotes, setCallNotes] = useState("");
  const [contactName, setContactName] = useState("");
  const [company, setCompany] = useState("");
  const [callDate, setCallDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [followUpType, setFollowUpType] = useState<FollowUpType>("thank-you");
  const [tone, setTone] = useState<ToneType>("professional");
  const [channel, setChannel] = useState<ChannelType>("email");

  // AI response state
  const [response, setResponse] = useState("");
  const [variationsResponse, setVariationsResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingVariations, setIsLoadingVariations] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedVariation, setCopiedVariation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showVariations, setShowVariations] = useState(false);

  // Queue state
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [queueFilter, setQueueFilter] = useState<QueueStatus | "all">("all");

  // Model state
  const [selectedModel, setSelectedModel] = useState("gpt-4.1-mini");
  const [showModelPicker, setShowModelPicker] = useState(false);

  // Refs
  const responseRef = useRef<HTMLDivElement>(null);
  const variationsRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const variationsAbortRef = useRef<AbortController | null>(null);

  // AI Models
  const AI_MODELS: { id: string; name: string }[] = [
    { id: "gpt-4.1-mini", name: "GPT-4.1 Mini (Fast)" },
    { id: "kimi-k2.5", name: "Kimi K2.5 (Cheapest)" },
    { id: "google/gemini-3-flash-preview", name: "Gemini 3 Flash" },
    { id: "claude-sonnet-4-5-20250929", name: "Claude Sonnet 4.5" },
    { id: "gpt-4.1", name: "GPT-4.1" },
  ];

  const currentModel = AI_MODELS.find((m) => m.id === selectedModel);

  // Load queue and model from localStorage
  useEffect(() => {
    setQueue(loadQueue());
    const saved = localStorage.getItem("ai_model");
    if (saved && AI_MODELS.some((m) => m.id === saved)) {
      setSelectedModel(saved);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pre-fill from CRM query params
  useEffect(() => {
    const name = searchParams.get("name");
    const comp = searchParams.get("company");
    if (name) setContactName(name);
    if (comp) setCompany(comp);
  }, [searchParams]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
      if (variationsAbortRef.current) variationsAbortRef.current.abort();
    };
  }, []);

  // Auto-scroll response
  useEffect(() => {
    if (responseRef.current) {
      responseRef.current.scrollTop = responseRef.current.scrollHeight;
    }
  }, [response]);

  useEffect(() => {
    if (variationsRef.current) {
      variationsRef.current.scrollTop = variationsRef.current.scrollHeight;
    }
  }, [variationsResponse]);

  // ===== Queue Management =====

  const saveToQueue = useCallback((item: Omit<QueueItem, "id" | "createdAt">) => {
    const newItem: QueueItem = {
      ...item,
      id: generateId(),
      createdAt: Date.now(),
    };
    setQueue((prev) => {
      const updated = [newItem, ...prev];
      persistQueue(updated);
      return updated;
    });
    return newItem;
  }, []);

  const updateQueueItem = useCallback((id: string, updates: Partial<QueueItem>) => {
    setQueue((prev) => {
      const updated = prev.map((item) => (item.id === id ? { ...item, ...updates } : item));
      persistQueue(updated);
      return updated;
    });
  }, []);

  const deleteQueueItem = useCallback((id: string) => {
    setQueue((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      persistQueue(updated);
      return updated;
    });
  }, []);

  const loadQueueItemToForm = useCallback((item: QueueItem) => {
    setContactName(item.contactName);
    setCompany(item.company);
    setFollowUpType(item.followUpType);
    setChannel(item.channel);
    setResponse(item.message);
    setEditingItem(item.id);
  }, []);

  // ===== AI Generation =====

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!callNotes.trim() || !contactName.trim() || isLoading) return;

    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setResponse("");
    setError(null);
    setShowVariations(false);
    setVariationsResponse("");

    const prompt = buildFollowUpPrompt({
      callNotes,
      contactName,
      company,
      callDate,
      followUpType,
      tone,
      channel,
    });

    try {
      const token = await getAuthToken();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/ai/coach", {
        method: "POST",
        headers,
        body: JSON.stringify({
          type: "general",
          message: prompt,
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

      // Save to session history
      saveSession({
        type: "tool",
        toolType: "follow-up",
        title: `Follow-up: ${contactName} at ${company}`,
        input: callNotes,
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

  const handleGenerateVariations = async () => {
    if (!response || isLoadingVariations) return;

    if (variationsAbortRef.current) variationsAbortRef.current.abort();
    variationsAbortRef.current = new AbortController();

    setIsLoadingVariations(true);
    setVariationsResponse("");
    setShowVariations(true);

    const prompt = buildVariationsPrompt({
      originalMessage: response,
      contactName,
      company,
      channel,
    });

    try {
      const token = await getAuthToken();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/ai/coach", {
        method: "POST",
        headers,
        body: JSON.stringify({
          type: "general",
          message: prompt,
          model: selectedModel,
        }),
        signal: variationsAbortRef.current.signal,
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
          setVariationsResponse((prev) => prev + text);
        }
      }

    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      const msg = err instanceof Error ? err.message : "Unknown error";
      setVariationsResponse(`Error: ${msg}`);
    } finally {
      setIsLoadingVariations(false);
    }
  };

  // ===== Action Handlers =====

  const handleCopy = (text: string, key?: string) => {
    navigator.clipboard.writeText(text);
    if (key) {
      setCopiedVariation(key);
      setTimeout(() => setCopiedVariation(null), 2000);
    } else {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSendGmail = () => {
    const subjectMatch = response.match(/^Subject:\s*(.+)$/m);
    const subject = subjectMatch ? subjectMatch[1].trim() : `Follow-up: ${company}`;
    const body = response.replace(/^Subject:\s*.+\n?/m, "").trim();
    const mailto = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailto, "_blank");
  };

  const handleSendOutlook = () => {
    const subjectMatch = response.match(/^Subject:\s*(.+)$/m);
    const subject = subjectMatch ? subjectMatch[1].trim() : `Follow-up: ${company}`;
    const body = response.replace(/^Subject:\s*.+\n?/m, "").trim();
    const outlookUrl = `https://outlook.office.com/mail/deeplink/compose?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(outlookUrl, "_blank");
  };

  const handleSaveToQueue = () => {
    if (!response) return;
    const subjectMatch = response.match(/^Subject:\s*(.+)$/m);

    if (editingItem) {
      updateQueueItem(editingItem, {
        message: response,
        subject: subjectMatch ? subjectMatch[1].trim() : undefined,
      });
      setEditingItem(null);
    } else {
      saveToQueue({
        contactName,
        company,
        followUpType,
        channel,
        status: "draft",
        subject: subjectMatch ? subjectMatch[1].trim() : undefined,
        message: response,
      });
    }
  };

  const handleModelChange = (modelId: string) => {
    setSelectedModel(modelId);
    localStorage.setItem("ai_model", modelId);
    setShowModelPicker(false);
  };

  const handleResetForm = () => {
    setCallNotes("");
    setContactName("");
    setCompany("");
    setCallDate(new Date().toISOString().split("T")[0]);
    setFollowUpType("thank-you");
    setTone("professional");
    setChannel("email");
    setResponse("");
    setVariationsResponse("");
    setShowVariations(false);
    setError(null);
    setEditingItem(null);
  };

  // ===== Queue Filtering =====

  const filteredQueue = queueFilter === "all"
    ? queue
    : queue.filter((item) => item.status === queueFilter);

  const queueCounts = {
    all: queue.length,
    draft: queue.filter((i) => i.status === "draft").length,
    scheduled: queue.filter((i) => i.status === "scheduled").length,
    sent: queue.filter((i) => i.status === "sent").length,
  };

  // ===== Extracted Subject Line from Response =====

  const extractedSubject = response.match(/^Subject:\s*(.+)$/m)?.[1]?.trim();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-platinum flex items-center gap-2">
            <Mail className="h-6 w-6 text-neonblue" />
            Follow-up Autopilot
          </h1>
          <p className="text-silver mt-1">
            Generate personalized follow-up messages from your call notes and meeting summaries
          </p>
        </div>

        {/* Model Selector */}
        <div className="relative">
          <Button
            variant="outline"
            onClick={() => setShowModelPicker(!showModelPicker)}
            className="border-gunmetal text-silver hover:text-platinum gap-2"
          >
            <Sparkles className="h-4 w-4 text-neonblue" />
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
        {/* ===== LEFT: Main Input & Response (2 columns) ===== */}
        <div className="lg:col-span-2 space-y-6">
          {/* Input Form */}
          <Card className="bg-graphite border-gunmetal">
            <CardHeader>
              <CardTitle className="text-platinum flex items-center gap-2">
                <FileText className="h-5 w-5 text-neonblue" />
                Follow-up Details
                {editingItem && (
                  <Badge className="bg-warningamber/20 text-warningamber text-xs ml-2">
                    Editing Draft
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleGenerate} className="space-y-5">
                {/* Call Notes */}
                <div>
                  <label className="text-sm font-medium text-platinum mb-1.5 block">
                    Call Notes / Meeting Summary
                  </label>
                  <Textarea
                    value={callNotes}
                    onChange={(e) => setCallNotes(e.target.value)}
                    placeholder="Paste your call notes, meeting transcript, or key discussion points here..."
                    className="min-h-[120px] bg-onyx border-gunmetal text-platinum placeholder:text-mist focus:border-neonblue resize-none"
                  />
                </div>

                {/* Contact Details Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-platinum mb-1.5 flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-mist" />
                      Contact Name
                    </label>
                    <Input
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="John Smith"
                      className="bg-onyx border-gunmetal text-platinum placeholder:text-mist focus:border-neonblue"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-platinum mb-1.5 flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-mist" />
                      Company
                    </label>
                    <Input
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder="Acme Corp"
                      className="bg-onyx border-gunmetal text-platinum placeholder:text-mist focus:border-neonblue"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-platinum mb-1.5 flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-mist" />
                      Call Date
                    </label>
                    <Input
                      type="date"
                      value={callDate}
                      onChange={(e) => setCallDate(e.target.value)}
                      className="bg-onyx border-gunmetal text-platinum focus:border-neonblue [color-scheme:dark]"
                    />
                  </div>
                </div>

                {/* Follow-up Type */}
                <div>
                  <label className="text-sm font-medium text-platinum mb-2 block">
                    Follow-up Type
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {FOLLOW_UP_TYPES.map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setFollowUpType(type.value)}
                        className={cn(
                          "px-3 py-2 rounded-lg text-sm transition-all border",
                          followUpType === type.value
                            ? "bg-neonblue/15 border-neonblue text-neonblue"
                            : "bg-onyx border-gunmetal text-silver hover:border-neonblue/50 hover:text-platinum"
                        )}
                      >
                        <div className="font-medium">{type.label}</div>
                        <div className="text-xs opacity-70 mt-0.5">{type.description}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tone & Channel Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Tone */}
                  <div>
                    <label className="text-sm font-medium text-platinum mb-2 block">
                      Tone
                    </label>
                    <div className="flex gap-2">
                      {TONE_OPTIONS.map((t) => (
                        <button
                          key={t.value}
                          type="button"
                          onClick={() => setTone(t.value)}
                          className={cn(
                            "flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all border text-center",
                            tone === t.value
                              ? "bg-neonblue/15 border-neonblue text-neonblue"
                              : "bg-onyx border-gunmetal text-silver hover:border-neonblue/50 hover:text-platinum"
                          )}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Channel */}
                  <div>
                    <label className="text-sm font-medium text-platinum mb-2 block">
                      Channel
                    </label>
                    <div className="flex gap-2">
                      {CHANNEL_OPTIONS.map((ch) => (
                        <button
                          key={ch.value}
                          type="button"
                          onClick={() => setChannel(ch.value)}
                          className={cn(
                            "flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all border flex items-center justify-center gap-2",
                            channel === ch.value
                              ? "bg-neonblue/15 border-neonblue text-neonblue"
                              : "bg-onyx border-gunmetal text-silver hover:border-neonblue/50 hover:text-platinum"
                          )}
                        >
                          <ch.icon className="h-4 w-4" />
                          {ch.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <p className="text-sm text-red-400">{error}</p>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2 text-xs text-mist">
                    <Sparkles className="h-3 w-3" />
                    Using: {currentModel?.name}
                  </div>
                  <div className="flex items-center gap-2">
                    {(response || callNotes) && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleResetForm}
                        className="border-gunmetal text-silver hover:text-platinum"
                      >
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Reset
                      </Button>
                    )}
                    <Button
                      type="submit"
                      disabled={!callNotes.trim() || !contactName.trim() || isLoading}
                      className="bg-neonblue hover:bg-neonblue/90 text-white"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Generate Follow-up
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* ===== Response Card ===== */}
          {(response || isLoading) && (
            <Card className="bg-graphite border-gunmetal">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-platinum flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-automationgreen" />
                  Generated Follow-up
                  {extractedSubject && channel === "email" && (
                    <Badge className="bg-neonblue/10 text-neonblue text-xs ml-2 font-normal max-w-[300px] truncate">
                      {extractedSubject}
                    </Badge>
                  )}
                </CardTitle>
                {response && !isLoading && (
                  <div className="flex items-center gap-1 flex-wrap">
                    {/* Copy */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(response)}
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

                    {/* Gmail */}
                    {channel === "email" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleSendGmail}
                        className="text-silver hover:text-platinum"
                      >
                        <Mail className="h-4 w-4 mr-1" />
                        Gmail
                      </Button>
                    )}

                    {/* Outlook */}
                    {channel === "email" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleSendOutlook}
                        className="text-silver hover:text-platinum"
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Outlook
                      </Button>
                    )}

                    {/* LinkedIn */}
                    {channel === "linkedin" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open("https://www.linkedin.com/messaging/", "_blank")}
                        className="text-silver hover:text-platinum"
                      >
                        <Linkedin className="h-4 w-4 mr-1" />
                        Open LinkedIn
                      </Button>
                    )}

                    {/* Save to Queue */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleSaveToQueue}
                      className="text-silver hover:text-platinum"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      {editingItem ? "Update Draft" : "Save to Queue"}
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <div
                  ref={responseRef}
                  className="prose prose-invert prose-sm max-w-none max-h-[500px] overflow-y-auto prose-headings:text-platinum prose-p:text-gray-200 prose-strong:text-white prose-li:text-gray-200 prose-td:text-gray-300 prose-th:text-platinum prose-th:bg-onyx prose-a:text-neonblue prose-code:text-automationgreen prose-blockquote:text-gray-300 prose-blockquote:border-neonblue/50"
                >
                  {response ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{response}</ReactMarkdown>
                  ) : (
                    <div className="flex items-center gap-2 text-mist">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Crafting your follow-up message...
                    </div>
                  )}
                </div>

                {/* Generate Variations Button */}
                {response && !isLoading && !showVariations && (
                  <div className="mt-4 pt-4 border-t border-gunmetal">
                    <Button
                      variant="outline"
                      onClick={handleGenerateVariations}
                      disabled={isLoadingVariations}
                      className="border-gunmetal text-silver hover:text-platinum hover:border-neonblue/50"
                    >
                      <Sparkles className="h-4 w-4 mr-2 text-warningamber" />
                      Generate 3 Variations (Short, Medium, Detailed)
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* ===== Variations Card ===== */}
          {showVariations && (variationsResponse || isLoadingVariations) && (
            <Card className="bg-graphite border-gunmetal">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-platinum flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-warningamber" />
                  Message Variations
                </CardTitle>
                {variationsResponse && !isLoadingVariations && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(variationsResponse, "variations")}
                    className="text-silver hover:text-platinum"
                  >
                    {copiedVariation === "variations" ? (
                      <>
                        <Check className="h-4 w-4 mr-1 text-automationgreen" />
                        Copied All
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-1" />
                        Copy All
                      </>
                    )}
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                <div
                  ref={variationsRef}
                  className="prose prose-invert prose-sm max-w-none max-h-[600px] overflow-y-auto prose-headings:text-platinum prose-p:text-gray-200 prose-strong:text-white prose-li:text-gray-200 prose-td:text-gray-300 prose-th:text-platinum prose-th:bg-onyx prose-a:text-neonblue prose-code:text-automationgreen prose-blockquote:text-gray-300 prose-blockquote:border-neonblue/50"
                >
                  {variationsResponse ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{variationsResponse}</ReactMarkdown>
                  ) : (
                    <div className="flex items-center gap-2 text-mist">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating variations...
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* ===== RIGHT: Follow-up Queue Sidebar (1 column) ===== */}
        <div className="lg:col-span-1 space-y-4">
          {/* Queue Card */}
          <Card className="bg-graphite border-gunmetal">
            <CardHeader>
              <CardTitle className="text-platinum flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-warningamber" />
                  Follow-up Queue
                </span>
                <Badge className="bg-onyx text-silver text-xs">
                  {queue.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Filter Tabs */}
              <div className="flex gap-1 p-1 bg-onyx rounded-lg">
                {(["all", "draft", "scheduled", "sent"] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setQueueFilter(filter)}
                    className={cn(
                      "flex-1 px-2 py-1.5 rounded-md text-xs font-medium transition-colors capitalize",
                      queueFilter === filter
                        ? "bg-graphite text-platinum shadow-sm"
                        : "text-mist hover:text-silver"
                    )}
                  >
                    {filter}
                    {queueCounts[filter] > 0 && (
                      <span className="ml-1 text-[10px] opacity-70">({queueCounts[filter]})</span>
                    )}
                  </button>
                ))}
              </div>

              {/* Queue Items */}
              {filteredQueue.length === 0 ? (
                <div className="py-8 text-center">
                  <Mail className="h-8 w-8 text-mist mx-auto mb-2" />
                  <p className="text-sm text-mist">
                    {queueFilter === "all"
                      ? "No follow-ups yet. Generate one to get started."
                      : `No ${queueFilter} follow-ups.`}
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[calc(100vh-380px)] overflow-y-auto pr-1">
                  {filteredQueue.map((item) => (
                    <div
                      key={item.id}
                      className={cn(
                        "p-3 rounded-lg border transition-all group",
                        editingItem === item.id
                          ? "bg-neonblue/10 border-neonblue"
                          : "bg-onyx border-gunmetal hover:border-gunmetal/80"
                      )}
                    >
                      {/* Item Header */}
                      <div className="flex items-start justify-between mb-1.5">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-platinum truncate">
                            {item.contactName}
                          </h4>
                          <div className="flex items-center gap-1.5 text-xs text-mist mt-0.5">
                            <Building2 className="h-3 w-3 shrink-0" />
                            <span className="truncate">{item.company}</span>
                          </div>
                        </div>
                        <StatusBadge status={item.status} />
                      </div>

                      {/* Item Meta */}
                      <div className="flex items-center gap-2 text-xs text-mist mb-2">
                        <span className="flex items-center gap-1">
                          {item.channel === "email" ? (
                            <Mail className="h-3 w-3" />
                          ) : (
                            <Linkedin className="h-3 w-3" />
                          )}
                          {item.channel === "email" ? "Email" : "LinkedIn"}
                        </span>
                        <span className="text-gunmetal">|</span>
                        <span className="capitalize">
                          {item.followUpType.replace("-", " ")}
                        </span>
                      </div>

                      {/* Subject Preview */}
                      {item.subject && (
                        <p className="text-xs text-silver truncate mb-2 italic">
                          &ldquo;{item.subject}&rdquo;
                        </p>
                      )}

                      {/* Item Actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => loadQueueItemToForm(item)}
                          className="h-7 px-2 text-xs text-silver hover:text-platinum"
                        >
                          <Edit3 className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopy(item.message, item.id)}
                          className="h-7 px-2 text-xs text-silver hover:text-platinum"
                        >
                          {copiedVariation === item.id ? (
                            <Check className="h-3 w-3 mr-1 text-automationgreen" />
                          ) : (
                            <Copy className="h-3 w-3 mr-1" />
                          )}
                          Copy
                        </Button>

                        {/* Status Cycle */}
                        {item.status === "draft" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => updateQueueItem(item.id, { status: "scheduled" })}
                            className="h-7 px-2 text-xs text-silver hover:text-warningamber"
                          >
                            <Clock className="h-3 w-3 mr-1" />
                            Schedule
                          </Button>
                        )}
                        {item.status === "scheduled" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => updateQueueItem(item.id, { status: "sent" })}
                            className="h-7 px-2 text-xs text-silver hover:text-automationgreen"
                          >
                            <Check className="h-3 w-3 mr-1" />
                            Mark Sent
                          </Button>
                        )}

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteQueueItem(item.id)}
                          className="h-7 px-2 text-xs text-silver hover:text-red-400 ml-auto"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>

                      {/* Timestamp */}
                      <p className="text-[10px] text-mist mt-1.5">
                        {new Date(item.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Templates Card */}
          <Card className="bg-graphite border-gunmetal">
            <CardHeader>
              <CardTitle className="text-platinum text-base flex items-center gap-2">
                <ArrowRight className="h-4 w-4 text-neonblue" />
                Quick Templates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                {
                  label: "Post-Demo Thank You",
                  notes: "Had a product demo today. Prospect was interested in the analytics dashboard and team collaboration features. They mentioned they need to present to their VP next week.",
                  type: "thank-you" as FollowUpType,
                },
                {
                  label: "Proposal Follow-up",
                  notes: "Sent proposal last week for annual subscription. Prospect mentioned budget approval takes 2 weeks. They were comparing us with two other vendors. Main concern was onboarding timeline.",
                  type: "proposal" as FollowUpType,
                },
                {
                  label: "Cold Objection Recovery",
                  notes: "Prospect said they're happy with current solution and don't see reason to switch. They mentioned it would be too disruptive. I mentioned our migration support but they were skeptical.",
                  type: "objection-followup" as FollowUpType,
                },
                {
                  label: "Next Steps After Discovery",
                  notes: "Discovery call completed. Identified pain points: manual reporting taking 10+ hours/week, lack of real-time visibility into pipeline. Stakeholders: VP Sales, Director of Ops. Next step: custom demo for their team.",
                  type: "next-steps" as FollowUpType,
                },
              ].map((template) => (
                <button
                  key={template.label}
                  onClick={() => {
                    setCallNotes(template.notes);
                    setFollowUpType(template.type);
                  }}
                  className={cn(
                    "w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all",
                    "bg-onyx border border-gunmetal text-silver",
                    "hover:border-neonblue/50 hover:text-platinum",
                    "flex items-center justify-between group"
                  )}
                >
                  <div>
                    <div className="font-medium">{template.label}</div>
                    <div className="text-xs text-mist mt-0.5 line-clamp-1">
                      {template.notes.slice(0, 60)}...
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-neonblue" />
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Tips Card */}
          <Card className="bg-onyx border-gunmetal">
            <CardContent className="p-4">
              <h4 className="font-medium text-platinum mb-2 flex items-center gap-2 text-sm">
                <Sparkles className="h-4 w-4 text-warningamber" />
                Follow-up Best Practices
              </h4>
              <ul className="space-y-1.5 text-xs text-silver">
                <li className="flex items-start gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-neonblue mt-1.5 shrink-0" />
                  Send within 24 hours of the meeting
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-neonblue mt-1.5 shrink-0" />
                  Reference specific discussion points
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-neonblue mt-1.5 shrink-0" />
                  Include one clear call-to-action
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-neonblue mt-1.5 shrink-0" />
                  Keep emails under 200 words
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-neonblue mt-1.5 shrink-0" />
                  Match the prospect&apos;s communication style
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ===== Sub-Components =====

function StatusBadge({ status }: { status: QueueStatus }) {
  const config: Record<QueueStatus, { bg: string; text: string; label: string }> = {
    draft: { bg: "bg-silver/10", text: "text-silver", label: "Draft" },
    scheduled: { bg: "bg-warningamber/15", text: "text-warningamber", label: "Scheduled" },
    sent: { bg: "bg-automationgreen/15", text: "text-automationgreen", label: "Sent" },
  };

  const c = config[status];

  return (
    <Badge className={cn(c.bg, c.text, "text-[10px] px-1.5 py-0.5")}>
      {c.label}
    </Badge>
  );
}

export default function FollowUpsPage() {
  return (
    <Suspense>
      <FollowUpsPageInner />
    </Suspense>
  );
}
