"use client";

import { useState, useRef, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
} from "lucide-react";
import { cn } from "@/lib/utils";

// API Types
type ApiType = "openrouter" | "openai" | "anthropic" | "perplexity";

// Attachment types
type AttachmentType = "pdf" | "image" | "url";
interface Attachment {
  type: AttachmentType;
  name: string;
  content?: string; // Base64 for files, URL for websites
  url?: string;
}

// Available AI Models - Latest 2025/2026
const AI_MODELS: { id: string; name: string; provider: string; api: ApiType }[] = [
  // ===== DIRECT API (Lower latency) =====
  // Direct Anthropic
  { id: "claude-opus-4-5-20251101", name: "Claude Opus 4.5", provider: "Anthropic (Direct)", api: "anthropic" },
  { id: "claude-sonnet-4-5-20250929", name: "Claude Sonnet 4.5", provider: "Anthropic (Direct)", api: "anthropic" },
  { id: "claude-haiku-4-5-20251001", name: "Claude Haiku 4.5", provider: "Anthropic (Direct)", api: "anthropic" },
  // Direct OpenAI
  { id: "gpt-4.1", name: "GPT-4.1", provider: "OpenAI (Direct)", api: "openai" },
  { id: "gpt-4.1-mini", name: "GPT-4.1 Mini", provider: "OpenAI (Direct)", api: "openai" },
  { id: "o3-mini", name: "o3 Mini", provider: "OpenAI (Direct)", api: "openai" },

  // ===== VIA OPENROUTER (100+ models) =====
  // Anthropic
  { id: "anthropic/claude-opus-4.5", name: "Claude Opus 4.5", provider: "Anthropic", api: "openrouter" },
  { id: "anthropic/claude-sonnet-4", name: "Claude Sonnet 4", provider: "Anthropic", api: "openrouter" },
  { id: "anthropic/claude-haiku-4-5", name: "Claude Haiku 4.5", provider: "Anthropic", api: "openrouter" },
  // OpenAI
  { id: "openai/gpt-5", name: "GPT-5", provider: "OpenAI", api: "openrouter" },
  { id: "openai/gpt-5-mini", name: "GPT-5 Mini", provider: "OpenAI", api: "openrouter" },
  { id: "openai/gpt-4.1", name: "GPT-4.1", provider: "OpenAI", api: "openrouter" },
  { id: "openai/gpt-4.1-mini", name: "GPT-4.1 Mini", provider: "OpenAI", api: "openrouter" },
  { id: "openai/o3", name: "o3", provider: "OpenAI", api: "openrouter" },
  { id: "openai/o3-mini", name: "o3 Mini", provider: "OpenAI", api: "openrouter" },
  // Google
  { id: "google/gemini-3-pro", name: "Gemini 3 Pro", provider: "Google", api: "openrouter" },
  { id: "google/gemini-3-flash", name: "Gemini 3 Flash", provider: "Google", api: "openrouter" },
  { id: "google/gemini-2.5-flash", name: "Gemini 2.5 Flash", provider: "Google", api: "openrouter" },
  // Meta
  { id: "meta-llama/llama-4-maverick", name: "Llama 4 Maverick", provider: "Meta", api: "openrouter" },
  { id: "meta-llama/llama-4-scout", name: "Llama 4 Scout", provider: "Meta", api: "openrouter" },
  // Perplexity
  { id: "perplexity/sonar-pro", name: "Sonar Pro", provider: "Perplexity", api: "openrouter" },
  { id: "perplexity/sonar", name: "Sonar", provider: "Perplexity", api: "openrouter" },
];

// API badge styles
const API_INFO: Record<ApiType, { color: string; label: string }> = {
  openrouter: { color: "text-purple-400", label: "via OpenRouter" },
  openai: { color: "text-green-400", label: "Direct OpenAI" },
  anthropic: { color: "text-orange-400", label: "Direct Claude" },
  perplexity: { color: "text-cyan-400", label: "via Perplexity" },
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
  const [selectedModel, setSelectedModel] = useState("anthropic/claude-sonnet-4");
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

  // Load saved model preference
  useEffect(() => {
    const saved = localStorage.getItem("ai_model");
    if (saved && AI_MODELS.some(m => m.id === saved)) {
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

    setIsLoading(true);
    setResponse("");
    setError(null);

    try {
      const res = await fetch("/api/ai/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "objection",
          message: objection,
          model: selectedModel,
          attachments: attachments.length > 0 ? attachments : undefined,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.details || errorData.error || `Request failed with status ${res.status}`);
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const text = decoder.decode(value);
          setResponse((prev) => prev + text);
        }
      }
    } catch (err) {
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
      console.error("TTS Error:", err);
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
                  {AI_MODELS.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => handleModelChange(model.id)}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between",
                        selectedModel === model.id
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
                        </div>
                        <div className="text-xs text-mist">{model.provider}</div>
                      </div>
                      {selectedModel === model.id && (
                        <Check className="h-4 w-4" />
                      )}
                    </button>
                  ))}
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
                    className="prose prose-invert prose-sm max-w-none max-h-[500px] overflow-y-auto"
                  >
                    {response ? (
                      <div className="text-silver whitespace-pre-wrap">
                        {response}
                      </div>
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
