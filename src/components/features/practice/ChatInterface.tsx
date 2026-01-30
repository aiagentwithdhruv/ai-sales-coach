"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { useChat } from "ai/react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChatMessage } from "./ChatMessage";
import { VoiceControls, VoiceModeToggle, PermissionRequest } from "./VoiceControls";
import { useAudioPractice, TTSProvider } from "@/hooks/useAudioPractice";
import { useCredits, getAuthToken } from "@/hooks/useCredits";
import { OutOfCredits } from "@/components/features/credits/OutOfCredits";
import { Send, RotateCcw, Pause, Play, Volume2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface Persona {
  id: string;
  name: string;
  title: string;
  company: string;
  difficulty: "easy" | "medium" | "hard";
}

interface ChatInterfaceProps {
  persona: Persona;
  scenario?: string;
  onEndSession?: () => void;
}

export function ChatInterface({
  persona,
  scenario,
  onEndSession,
}: ChatInterfaceProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Credits state
  const { credits, totalUsed, hasCredits, refetch: refetchCredits, isLoading: creditsLoading } = useCredits();
  const [creditsError, setCreditsError] = useState(false);

  // Voice mode state
  const [voiceMode, setVoiceMode] = useState(false);
  const [speakerEnabled, setSpeakerEnabled] = useState(true);
  const [permissionChecked, setPermissionChecked] = useState(false);
  const [ttsProvider, setTtsProvider] = useState<TTSProvider>("openai");

  // Custom fetch with auth token
  const customFetch = useCallback(async (input: RequestInfo | URL, init?: RequestInit) => {
    const token = await getAuthToken();
    const headers = new Headers(init?.headers);
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    return fetch(input, { ...init, headers });
  }, []);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    reload,
    stop,
    setMessages,
    append,
  } = useChat({
    api: "/api/ai/chat",
    body: {
      personaId: persona.id,
      scenario,
    },
    fetch: customFetch,
    initialMessages: [
      {
        id: "welcome",
        role: "assistant",
        content: `*Phone rings* Hello, this is ${persona.name} from ${persona.company}. Who am I speaking with?`,
      },
    ],
    onFinish: async (message) => {
      // Refetch credits after each message
      refetchCredits();
      // Play TTS for AI response in voice mode
      if (voiceMode && speakerEnabled && message.role === "assistant") {
        await playAudio(message.content, persona.id);
      }
    },
    onError: (error) => {
      // Check for insufficient credits error
      if (error.message?.includes("402") || error.message?.includes("INSUFFICIENT_CREDITS")) {
        setCreditsError(true);
        refetchCredits();
      }
    },
  });

  // Track previous speaking state for auto-start
  const wasSpeakingRef = useRef(false);

  // Audio practice hook
  const {
    isRecording,
    isTranscribing,
    isPlaying,
    isSpeaking,
    recordingTime,
    audioLevel,
    handsFreeMode,
    setHandsFreeMode,
    startRecording,
    stopRecording,
    playAudio,
    stopAudio,
    error: audioError,
    clearError,
    hasPermission,
    requestPermission,
  } = useAudioPractice({
    onTranscription: async (text) => {
      if (text.trim()) {
        // Send transcribed text as user message
        await append({
          role: "user",
          content: text,
        });
      }
    },
    onError: (error) => {
      console.error("Audio error:", error);
    },
    ttsProvider,
  });

  // Auto-start recording when AI finishes speaking (hands-free mode)
  useEffect(() => {
    // Detect when speaking transitions from true to false
    if (wasSpeakingRef.current && !isSpeaking) {
      if (handsFreeMode && voiceMode && !isLoading && !isRecording) {
        // Small delay before starting to listen
        const timer = setTimeout(() => {
          startRecording();
        }, 500);
        return () => clearTimeout(timer);
      }
    }
    wasSpeakingRef.current = isSpeaking;
  }, [isSpeaking, handsFreeMode, voiceMode, isLoading, isRecording, startRecording]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input after message (text mode only)
  useEffect(() => {
    if (!isLoading && !voiceMode) {
      inputRef.current?.focus();
    }
  }, [isLoading, voiceMode]);

  // Check permission when voice mode is enabled
  useEffect(() => {
    if (voiceMode && !permissionChecked) {
      requestPermission().then(() => setPermissionChecked(true));
    }
  }, [voiceMode, permissionChecked, requestPermission]);

  const handleReset = useCallback(() => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: `*Phone rings* Hello, this is ${persona.name} from ${persona.company}. Who am I speaking with?`,
      },
    ]);
    clearError();
  }, [persona.name, persona.company, setMessages, clearError]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>);
    }
  };

  const handleVoiceModeToggle = (enabled: boolean) => {
    setVoiceMode(enabled);
    if (enabled && !permissionChecked) {
      requestPermission().then(() => setPermissionChecked(true));
    }
  };

  const handleStartRecording = async () => {
    clearError();
    await startRecording();
  };

  const handleStopRecording = async () => {
    await stopRecording();
  };

  const difficultyColors = {
    easy: "bg-automationgreen/20 text-automationgreen",
    medium: "bg-warningamber/20 text-warningamber",
    hard: "bg-errorred/20 text-errorred",
  };

  return (
    <Card className="flex flex-col h-[calc(100vh-12rem)] bg-graphite border-gunmetal">
      {/* Header */}
      <CardHeader className="border-b border-gunmetal py-3 px-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-onyx flex items-center justify-center text-platinum font-medium">
              {persona.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </div>
            <div>
              <CardTitle className="text-base text-platinum flex items-center gap-2">
                {persona.name}
                <Badge className={cn("text-xs", difficultyColors[persona.difficulty])}>
                  {persona.difficulty}
                </Badge>
              </CardTitle>
              <p className="text-xs text-mist">
                {persona.title} at {persona.company}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* TTS Provider Selector (only show in voice mode) */}
            {voiceMode && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-mist hover:text-platinum gap-1.5 h-8 px-2"
                  >
                    <Volume2 className="h-3.5 w-3.5" />
                    <span className="text-xs">
                      {ttsProvider === "elevenlabs" ? "ElevenLabs" : "OpenAI"}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-graphite border-gunmetal">
                  <DropdownMenuItem
                    onClick={() => setTtsProvider("elevenlabs")}
                    className={cn(
                      "text-silver hover:text-platinum cursor-pointer",
                      ttsProvider === "elevenlabs" && "text-neonblue"
                    )}
                  >
                    ElevenLabs (Natural)
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setTtsProvider("openai")}
                    className={cn(
                      "text-silver hover:text-platinum cursor-pointer",
                      ttsProvider === "openai" && "text-neonblue"
                    )}
                  >
                    OpenAI (Fast)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Voice Mode Toggle */}
            <VoiceModeToggle
              voiceMode={voiceMode}
              onToggle={handleVoiceModeToggle}
              disabled={isLoading || isRecording}
            />

            <Button
              variant="ghost"
              size="icon"
              onClick={handleReset}
              className="text-silver hover:text-platinum"
              title="Reset conversation"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            {isLoading ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={stop}
                className="text-errorred hover:text-errorred"
                title="Stop generating"
              >
                <Pause className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => reload()}
                className="text-silver hover:text-platinum"
                title="Regenerate response"
                disabled={messages.length < 2}
              >
                <Play className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={onEndSession}
              className="border-gunmetal text-silver hover:text-platinum"
            >
              End Session
            </Button>
          </div>
        </div>
      </CardHeader>

      {/* Messages */}
      <CardContent
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-3"
      >
        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            role={message.role as "user" | "assistant"}
            content={message.content}
            personaName={persona.name}
          />
        ))}
        {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
          <ChatMessage
            role="assistant"
            content=""
            personaName={persona.name}
            isLoading
          />
        )}
        {/* Out of Credits Message */}
        {(creditsError || (!hasCredits && !creditsLoading)) && (
          <div className="py-4">
            <OutOfCredits credits={credits} totalUsed={totalUsed} />
          </div>
        )}
      </CardContent>

      {/* Input Area */}
      <div className="border-t border-gunmetal p-4 flex-shrink-0">
        {/* Disabled when out of credits */}
        {(creditsError || (!hasCredits && !creditsLoading)) ? (
          <div className="text-center text-mist py-2">
            <p className="text-sm">You&apos;ve run out of credits. Request more credits to continue practicing.</p>
          </div>
        ) : voiceMode ? (
          // Voice Mode Input
          <>
            {!hasPermission && permissionChecked ? (
              <PermissionRequest
                onRequestPermission={requestPermission}
                error={audioError}
              />
            ) : (
              <VoiceControls
                isRecording={isRecording}
                isTranscribing={isTranscribing}
                isPlaying={isPlaying}
                isSpeaking={isSpeaking}
                recordingTime={recordingTime}
                audioLevel={audioLevel}
                speakerEnabled={speakerEnabled}
                handsFreeMode={handsFreeMode}
                onStartRecording={handleStartRecording}
                onStopRecording={handleStopRecording}
                onToggleSpeaker={() => setSpeakerEnabled(!speakerEnabled)}
                onToggleHandsFree={() => setHandsFreeMode(!handsFreeMode)}
                onStopAudio={stopAudio}
                disabled={isLoading}
              />
            )}
            {audioError && (
              <p className="text-xs text-errorred mt-2 text-center">{audioError}</p>
            )}
            <p className="text-xs text-mist mt-2 text-center">
              {handsFreeMode
                ? "Hands-free: Speak naturally, pause to send. AI will auto-respond."
                : "Click Record to speak, then Stop to send. AI will respond with voice."}
            </p>
          </>
        ) : (
          // Text Mode Input
          <>
            <form onSubmit={handleSubmit} className="flex gap-2">
              <div className="flex-1 relative">
                <Textarea
                  ref={inputRef}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your response..."
                  className="min-h-[44px] max-h-[120px] resize-none bg-onyx border-gunmetal text-platinum placeholder:text-mist focus:border-neonblue"
                  disabled={isLoading}
                />
              </div>
              <Button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="bg-neonblue hover:bg-electricblue text-white px-4"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
            <p className="text-xs text-mist mt-2 text-center">
              Press Enter to send, Shift+Enter for new line
            </p>
          </>
        )}
      </div>
    </Card>
  );
}
