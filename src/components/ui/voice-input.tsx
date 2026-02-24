"use client";

/**
 * Universal VoiceInput Component
 *
 * Level 1 (Transcribe): Raw speech-to-text into any text field.
 * Level 2 (Instruct): AI interprets voice command using CRM context
 *   e.g., "send follow-up to Sarah" → AI composes email with contact data.
 *
 * Props:
 *   mode: "transcribe" | "instruct" — default "transcribe"
 *   onTranscript: (text: string) => void — Level 1 callback
 *   onInstruction: (result: InstructionResult) => void — Level 2 callback
 *   crmContext?: Record<string, unknown> — CRM data for Level 2
 *   confirmBeforeAction?: boolean — require user confirmation for actions
 *   className?: string
 */

import { useState, useRef, useCallback, useEffect } from "react";
import { Mic, MicOff, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export interface InstructionResult {
  action: string; // e.g., "compose_email", "update_contact", "create_task"
  parameters: Record<string, unknown>;
  displayText: string; // Human-readable summary
  requiresConfirmation: boolean;
}

interface VoiceInputProps {
  mode?: "transcribe" | "instruct";
  onTranscript?: (text: string) => void;
  onInstruction?: (result: InstructionResult) => void;
  crmContext?: Record<string, unknown>;
  confirmBeforeAction?: boolean;
  placeholder?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

type ListeningState = "idle" | "listening" | "processing";

export function VoiceInput({
  mode = "transcribe",
  onTranscript,
  onInstruction,
  crmContext,
  confirmBeforeAction = true,
  placeholder,
  className,
  size = "md",
}: VoiceInputProps) {
  const [state, setState] = useState<ListeningState>("idle");
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isSupported = typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const startListening = useCallback(() => {
    if (!isSupported) {
      setError("Speech recognition not supported in this browser");
      return;
    }

    setError(null);
    setTranscript("");

    const SpeechRecognitionAPI =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognitionAPI();

    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setState("listening");
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = "";
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      setTranscript(finalTranscript || interimTranscript);

      if (finalTranscript) {
        handleFinalTranscript(finalTranscript);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error !== "aborted") {
        setError(`Speech error: ${event.error}`);
      }
      setState("idle");
    };

    recognition.onend = () => {
      if (state === "listening") {
        setState("idle");
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [isSupported, state]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setState("idle");
  }, []);

  const handleFinalTranscript = useCallback(
    async (text: string) => {
      if (mode === "transcribe") {
        // Level 1: Just pass the raw transcript
        onTranscript?.(text);
        setState("idle");
      } else {
        // Level 2: Send to AI for instruction parsing
        setState("processing");
        try {
          const result = await parseInstruction(text, crmContext);
          if (confirmBeforeAction) {
            result.requiresConfirmation = true;
          }
          onInstruction?.(result);
        } catch {
          setError("Failed to process voice command");
        }
        setState("idle");
      }
    },
    [mode, onTranscript, onInstruction, crmContext, confirmBeforeAction]
  );

  const toggleListening = useCallback(() => {
    if (state === "listening") {
      stopListening();
    } else if (state === "idle") {
      startListening();
    }
  }, [state, startListening, stopListening]);

  // Size variants
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
  };

  const iconSizes = {
    sm: "h-3.5 w-3.5",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  if (!isSupported) return null;

  return (
    <div className={cn("relative inline-flex items-center", className)}>
      <button
        type="button"
        onClick={toggleListening}
        disabled={state === "processing"}
        className={cn(
          "rounded-lg flex items-center justify-center transition-all duration-200",
          sizeClasses[size],
          state === "idle" &&
            "bg-onyx border border-gunmetal text-mist hover:text-neonblue hover:border-neonblue/50",
          state === "listening" &&
            "bg-red-500/20 border border-red-500/50 text-red-400 animate-pulse",
          state === "processing" &&
            "bg-neonblue/20 border border-neonblue/50 text-neonblue cursor-wait"
        )}
        title={
          state === "idle"
            ? placeholder || (mode === "instruct" ? "Voice command" : "Voice input")
            : state === "listening"
              ? "Stop listening"
              : "Processing..."
        }
      >
        {state === "idle" && (
          mode === "instruct" ? (
            <Sparkles className={iconSizes[size]} />
          ) : (
            <Mic className={iconSizes[size]} />
          )
        )}
        {state === "listening" && <MicOff className={iconSizes[size]} />}
        {state === "processing" && (
          <Loader2 className={cn(iconSizes[size], "animate-spin")} />
        )}
      </button>

      {/* Live transcript indicator */}
      {state === "listening" && transcript && (
        <div className="absolute left-full ml-2 px-3 py-1.5 rounded-lg bg-onyx border border-gunmetal text-xs text-silver max-w-[200px] truncate whitespace-nowrap z-50">
          {transcript}
        </div>
      )}

      {/* Error tooltip */}
      {error && (
        <div className="absolute left-full ml-2 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400 max-w-[200px] z-50">
          {error}
        </div>
      )}
    </div>
  );
}

// ─── Level 2: AI Instruction Parser ─────────────────────────────────────────

async function parseInstruction(
  text: string,
  crmContext?: Record<string, unknown>
): Promise<InstructionResult> {
  try {
    const response = await fetch("/api/ai/voice-command", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, context: crmContext }),
    });

    if (!response.ok) throw new Error("API error");

    return await response.json();
  } catch {
    // Fallback: simple keyword-based parsing
    return localParseInstruction(text);
  }
}

function localParseInstruction(text: string): InstructionResult {
  const lower = text.toLowerCase();

  if (lower.includes("send") && (lower.includes("email") || lower.includes("follow"))) {
    const nameMatch = text.match(/to\s+(\w+)/i);
    return {
      action: "compose_email",
      parameters: { recipientName: nameMatch?.[1] || "contact", originalText: text },
      displayText: `Compose follow-up email${nameMatch ? ` to ${nameMatch[1]}` : ""}`,
      requiresConfirmation: true,
    };
  }

  if (lower.includes("call") || lower.includes("phone")) {
    const nameMatch = text.match(/call\s+(\w+)/i);
    return {
      action: "initiate_call",
      parameters: { contactName: nameMatch?.[1] || "contact", originalText: text },
      displayText: `Call ${nameMatch?.[1] || "contact"}`,
      requiresConfirmation: true,
    };
  }

  if (lower.includes("update") || lower.includes("change") || lower.includes("set")) {
    return {
      action: "update_contact",
      parameters: { originalText: text },
      displayText: `Update contact: "${text}"`,
      requiresConfirmation: true,
    };
  }

  if (lower.includes("note") || lower.includes("add note")) {
    return {
      action: "add_note",
      parameters: { note: text, originalText: text },
      displayText: `Add note: "${text}"`,
      requiresConfirmation: false,
    };
  }

  // Default: treat as note/transcription
  return {
    action: "transcribe",
    parameters: { text },
    displayText: text,
    requiresConfirmation: false,
  };
}

// ─── Web Speech API Type Declarations ───────────────────────────────────────

interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  [index: number]: { transcript: string; confidence: number };
}

interface SpeechRecognitionResultList {
  readonly length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: ((this: SpeechRecognition, ev: Event) => void) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null;
  onend: ((this: SpeechRecognition, ev: Event) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionConstructor;
    webkitSpeechRecognition: SpeechRecognitionConstructor;
  }
}
