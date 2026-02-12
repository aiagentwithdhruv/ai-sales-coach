"use client";

import { useState, useRef, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAuthToken } from "@/lib/auth-token";
import { saveSession } from "@/lib/session-history";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  MessageSquare,
  Send,
  Sparkles,
  Lightbulb,
  ChevronRight,
  Loader2,
  Copy,
  Check,
  Cpu,
  ChevronDown,
  Paperclip,
  Globe,
  FileText,
  Image as ImageIcon,
  X,
  Upload,
  Volume2,
  VolumeX,
  Square,
  Lock,
  Crown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// API Types
type ApiType = "openrouter" | "openai" | "anthropic" | "moonshot";

// Attachment types
type AttachmentType = "pdf" | "image" | "url";
interface Attachment {
  type: AttachmentType;
  name: string;
  content?: string; // Base64 for files, URL for websites
  url?: string;
}

// Premium model IDs - visible but locked for free users
const PREMIUM_MODEL_IDS = new Set([
  "claude-sonnet-4-5-20250929",
  "claude-opus-4-5-20251101",
  "gpt-5.2",
  "gpt-5.1",
]);

// Available AI Models - Latest 2026 Models
const AI_MODELS: { id: string; name: string; provider: string; api: ApiType; premium: boolean }[] = [
  // ===== DEFAULT - FAST & DIRECT =====
  { id: "gpt-4.1-mini", name: "GPT-4.1 Mini (Recommended)", provider: "OpenAI (Direct)", api: "openai", premium: false },

  // ===== MOONSHOT DIRECT (Cheapest) =====
  { id: "kimi-k2.5", name: "Kimi K2.5 (Direct)", provider: "Moonshot (Direct)", api: "moonshot", premium: false },

  // ===== OPENROUTER (Budget Models) =====
  { id: "google/gemini-3-flash-preview", name: "Gemini 3 Flash", provider: "Google", api: "openrouter", premium: false },
  { id: "google/gemini-2.5-flash-preview", name: "Gemini 2.5 Flash", provider: "Google", api: "openrouter", premium: false },
  { id: "x-ai/grok-4-fast", name: "Grok 4 Fast", provider: "xAI", api: "openrouter", premium: false },
  { id: "openai/gpt-5-mini", name: "GPT-5 Mini", provider: "OpenAI", api: "openrouter", premium: false },

  // ===== ANTHROPIC CLAUDE (Direct API) =====
  { id: "claude-sonnet-4-5-20250929", name: "Claude Sonnet 4.5", provider: "Anthropic (Direct)", api: "anthropic", premium: true },
  { id: "claude-opus-4-5-20251101", name: "Claude Opus 4.5", provider: "Anthropic (Direct)", api: "anthropic", premium: true },
  { id: "claude-haiku-4-5-20251001", name: "Claude Haiku 4.5", provider: "Anthropic (Direct)", api: "anthropic", premium: false },

  // ===== OPENAI (Direct API) =====
  { id: "gpt-5.2", name: "GPT-5.2", provider: "OpenAI (Direct)", api: "openai", premium: true },
  { id: "gpt-5.1", name: "GPT-5.1", provider: "OpenAI (Direct)", api: "openai", premium: true },
  { id: "gpt-5-mini", name: "GPT-5 Mini", provider: "OpenAI (Direct)", api: "openai", premium: false },
  { id: "o3", name: "o3", provider: "OpenAI (Direct)", api: "openai", premium: false },
  { id: "o3-mini", name: "o3 Mini", provider: "OpenAI (Direct)", api: "openai", premium: false },
  { id: "gpt-4.1", name: "GPT-4.1", provider: "OpenAI (Direct)", api: "openai", premium: false },
  { id: "gpt-4.1-mini", name: "GPT-4.1 Mini", provider: "OpenAI (Direct)", api: "openai", premium: false },
];

// API badge styles
const API_INFO: Record<ApiType, { color: string; label: string }> = {
  openrouter: { color: "text-purple-400", label: "via OpenRouter" },
  openai: { color: "text-green-400", label: "Direct API" },
  anthropic: { color: "text-orange-400", label: "Direct API" },
  moonshot: { color: "text-blue-400", label: "Direct API" },
};

// Common objections organized by category
const OBJECTION_CATEGORIES = [
  {
    id: "price",
    name: "Price & Budget",
    icon: "💰",
    objections: [
      "It's too expensive",
      "We don't have budget",
      "Your competitor is cheaper",
      "Can you give us a discount?",
    ],
  },
  {
    id: "timing",
    name: "Timing",
    icon: "⏰",
    objections: [
      "We're not ready right now",
      "Call me back next quarter",
      "This isn't a priority",
      "We just signed with someone else",
    ],
  },
  {
    id: "authority",
    name: "Authority",
    icon: "👤",
    objections: [
      "I need to check with my boss",
      "I'm not the decision maker",
      "We have a buying committee",
      "Let me run this by the team",
    ],
  },
  {
    id: "need",
    name: "Need & Value",
    icon: "🎯",
    objections: [
      "We don't need this",
      "I don't see the value",
      "We're doing fine without it",
      "This doesn't solve our problem",
    ],
  },
  {
    id: "trust",
    name: "Trust & Risk",
    icon: "🛡️",
    objections: [
      "I've never heard of you",
      "We've been burned before",
      "How do I know this works?",
      "Do you have references?",
    ],
  },
];

export default function CoachPage() {
  const [objection, setObjection] = useState("");
  const [response, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedModel, setSelectedModel] = useState("gpt-4.1-mini");
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const responseRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Abort any ongoing requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      // Stop any playing audio
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  // Load saved model preference - migrate old users to Kimi K2.5 default
  useEffect(() => {
    const saved = localStorage.getItem("ai_model");
    const migrated = localStorage.getItem("ai_model_v3");
    if (!migrated) {
      // One-time migration: reset everyone to Kimi K2.5 default
      localStorage.setItem("ai_model", "gpt-4.1-mini");
      localStorage.setItem("ai_model_v3", "true");
      setSelectedModel("gpt-4.1-mini");
    } else if (saved && AI_MODELS.some(m => m.id === saved)) {
      setSelectedModel(saved);
    }
  }, []);

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        const type: AttachmentType = file.type === "application/pdf" ? "pdf" : "image";
        setAttachments((prev) => [
          ...prev,
          { type, name: file.name, content: base64 },
        ]);
      };
      reader.readAsDataURL(file);
    }
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Add website URL
  const handleAddUrl = () => {
    if (!websiteUrl.trim()) return;
    const url = websiteUrl.startsWith("http") ? websiteUrl : `https://${websiteUrl}`;
    setAttachments((prev) => [
      ...prev,
      { type: "url", name: new URL(url).hostname, url },
    ]);
    setWebsiteUrl("");
    setShowUrlInput(false);
  };

  // Remove attachment
  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  // Auto-scroll response as it streams
  useEffect(() => {
    if (responseRef.current) {
      responseRef.current.scrollTop = responseRef.current.scrollHeight;
    }
  }, [response]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!objection.trim() || isLoading) return;

    // Cancel any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new AbortController for this request
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setResponse("");
    setError(null);

    try {
      // Get auth token for credit deduction
      const token = await getAuthToken();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch("/api/ai/coach", {
        method: "POST",
        headers,
        body: JSON.stringify({
          type: "objection",
          message: objection,
          model: selectedModel,
          attachments: attachments.length > 0 ? attachments : undefined,
        }),
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

      // Auto-save to session history
      saveSession({
        type: "coach",
        title: `Objection: ${objection.slice(0, 60)}${objection.length > 60 ? "..." : ""}`,
        input: objection,
        output: fullResponse,
        model: selectedModel,
      });

    } catch (err) {
      // Don't show error if request was aborted (user navigated away or cancelled)
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('Request aborted');
        return;
      }

      console.error("Error:", err);
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      setResponse(`Sorry, there was an error: ${errorMessage}. Please try again or select a different model.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickObjection = (obj: string) => {
    setObjection(obj);
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

  // Read response aloud using OpenAI TTS
  const handleReadAloud = async () => {
    if (!response || isLoadingAudio) return;

    setIsLoadingAudio(true);
    try {
      const res = await fetch("/api/ai/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: response,
          provider: "openai",
          openaiVoice: "nova",
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to generate speech");
      }

      const audioBlob = await res.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      // Stop any existing audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      audioRef.current = new Audio(audioUrl);
      audioRef.current.onplay = () => setIsSpeaking(true);
      audioRef.current.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
      };
      audioRef.current.onerror = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
      };

      await audioRef.current.play();
    } catch (err) {
      // Don't log error if it's just an abort
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error("TTS Error:", err);
      }
    } finally {
      setIsLoadingAudio(false);
    }
  };

  // Stop audio playback
  const handleStopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsSpeaking(false);
  };

  const currentModel = AI_MODELS.find((m) => m.id === selectedModel);

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-platinum flex items-center gap-2">
              <MessageSquare className="h-6 w-6 text-neonblue" />
              AI Objection Coach
            </h1>
            <p className="text-silver mt-1">
              Get AI-powered responses to handle any sales objection
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
              <div className="absolute right-0 mt-2 w-72 bg-graphite border border-gunmetal rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
                <div className="p-2">
                  <p className="text-xs text-mist px-2 py-1">Select AI Model</p>
                  {AI_MODELS.map((model) => {
                    const isLocked = model.premium && typeof window !== "undefined" && (localStorage.getItem("user_plan") || "free") === "free";
                    return (
                      <button
                        key={model.id}
                        onClick={() => {
                          if (isLocked) return;
                          handleModelChange(model.id);
                        }}
                        className={cn(
                          "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between",
                          isLocked
                            ? "text-mist cursor-not-allowed opacity-60"
                            : selectedModel === model.id
                              ? "bg-neonblue/10 text-neonblue"
                              : "text-silver hover:text-platinum hover:bg-onyx"
                        )}
                      >
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            {model.name}
                            <span className={cn("text-[10px] font-normal", API_INFO[model.api].color)}>
                              {API_INFO[model.api].label}
                            </span>
                            {model.premium && (
                              <span className="text-[10px] font-normal text-warningamber flex items-center gap-0.5">
                                <Crown className="h-2.5 w-2.5" />
                                Pro
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-mist">{model.provider}</div>
                        </div>
                        {isLocked ? (
                          <Lock className="h-3.5 w-3.5 text-warningamber" />
                        ) : selectedModel === model.id ? (
                          <Check className="h-4 w-4" />
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Input & Response Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Input Card */}
            <Card className="bg-graphite border-gunmetal">
              <CardHeader>
                <CardTitle className="text-platinum flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-neonblue" />
                  What objection are you facing?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Textarea
                    value={objection}
                    onChange={(e) => setObjection(e.target.value)}
                    placeholder='e.g., "Your product is too expensive for our budget..."'
                    className="min-h-[100px] bg-onyx border-gunmetal text-platinum placeholder:text-mist focus:border-neonblue"
                  />

                  {/* Attachments Preview */}
                  {attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {attachments.map((att, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 px-3 py-1.5 bg-onyx border border-gunmetal rounded-lg text-sm"
                        >
                          {att.type === "pdf" && <FileText className="h-4 w-4 text-red-400" />}
                          {att.type === "image" && <ImageIcon className="h-4 w-4 text-blue-400" />}
                          {att.type === "url" && <Globe className="h-4 w-4 text-green-400" />}
                          <span className="text-silver truncate max-w-[150px]">{att.name}</span>
                          <button
                            type="button"
                            onClick={() => removeAttachment(idx)}
                            className="text-mist hover:text-red-400 transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Attachment Controls */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* File Upload */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,image/*"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="border-gunmetal text-silver hover:text-platinum text-xs gap-1"
                    >
                      <Upload className="h-3 w-3" />
                      PDF/Image
                    </Button>

                    {/* URL Input Toggle */}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowUrlInput(!showUrlInput)}
                      className="border-gunmetal text-silver hover:text-platinum text-xs gap-1"
                    >
                      <Globe className="h-3 w-3" />
                      Website URL
                    </Button>

                    {/* URL Input Field */}
                    {showUrlInput && (
                      <div className="flex items-center gap-2 flex-1">
                        <Input
                          type="url"
                          value={websiteUrl}
                          onChange={(e) => setWebsiteUrl(e.target.value)}
                          placeholder="https://company.com"
                          className="h-8 text-xs bg-onyx border-gunmetal text-platinum"
                          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddUrl())}
                        />
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleAddUrl}
                          className="h-8 bg-neonblue hover:bg-electricblue text-white text-xs"
                        >
                          Add
                        </Button>
                      </div>
                    )}

                    <span className="text-xs text-mist ml-auto">
                      Add company context for better responses
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-mist">
                      <Cpu className="h-3 w-3" />
                      Using: {currentModel?.name} {currentModel && <span className={API_INFO[currentModel.api].color}>({API_INFO[currentModel.api].label})</span>}
                    </div>
                    <Button
                      type="submit"
                      disabled={!objection.trim() || isLoading}
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
                          Get Coaching
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
                    AI Coaching Response
                  </CardTitle>
                  {response && !isLoading && (
                    <div className="flex items-center gap-2">
                      {/* Read Aloud Button */}
                      {isSpeaking ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleStopAudio}
                          className="text-errorred hover:text-errorred/80"
                        >
                          <Square className="h-4 w-4 mr-1 fill-current" />
                          Stop
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleReadAloud}
                          disabled={isLoadingAudio}
                          className="text-silver hover:text-platinum"
                        >
                          {isLoadingAudio ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                              Loading...
                            </>
                          ) : (
                            <>
                              <Volume2 className="h-4 w-4 mr-1" />
                              Read Aloud
                            </>
                          )}
                        </Button>
                      )}

                      {/* Copy Button */}
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
                        Analyzing objection...
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Quick Objections Sidebar */}
          <div className="space-y-4">
            <Card className="bg-graphite border-gunmetal">
              <CardHeader>
                <CardTitle className="text-platinum text-base">
                  Quick Objections
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {OBJECTION_CATEGORIES.map((category) => (
                  <div key={category.id}>
                    <div className="flex items-center gap-2 mb-2">
                      <span>{category.icon}</span>
                      <span className="text-sm font-medium text-platinum">
                        {category.name}
                      </span>
                    </div>
                    <div className="space-y-1">
                      {category.objections.map((obj) => (
                        <button
                          key={obj}
                          onClick={() => handleQuickObjection(obj)}
                          className={cn(
                            "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                            "text-silver hover:text-platinum hover:bg-onyx",
                            "flex items-center justify-between group"
                          )}
                        >
                          <span className="truncate">{obj}</span>
                          <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Tips Card */}
            <Card className="bg-onyx border-gunmetal">
              <CardContent className="p-4">
                <h4 className="font-medium text-platinum mb-2 flex items-center gap-2">
                  💡 Pro Tips
                </h4>
                <ul className="space-y-2 text-xs text-silver">
                  <li>• Acknowledge the objection first</li>
                  <li>• Ask clarifying questions</li>
                  <li>• Reframe the concern</li>
                  <li>• Provide social proof</li>
                  <li>• Aim for a clear next step</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
