"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChatMessage } from "./ChatMessage";
import { useRealtimeVoice } from "@/hooks/useRealtimeVoice";
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  RotateCcw,
  Loader2,
  FileText,
  Globe,
  Image as ImageIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface Persona {
  id: string;
  name: string;
  title: string;
  company: string;
  difficulty: "easy" | "medium" | "hard";
  systemPrompt?: string;
}

interface RealtimeVoiceChatProps {
  persona: Persona;
  scenario?: string;
  attachments?: {
    type: "pdf" | "image" | "url";
    name: string;
    content?: string;
    url?: string;
  }[];
  trainingFocus?: string;
  scriptText?: string;
  onEndSession?: () => void;
}

export function RealtimeVoiceChat({
  persona,
  scenario,
  attachments = [],
  trainingFocus,
  scriptText,
  onEndSession,
}: RealtimeVoiceChatProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentUserText, setCurrentUserText] = useState("");
  const [currentAIText, setCurrentAIText] = useState("");
  const [coachMode, setCoachMode] = useState(false);
  const messageIdRef = useRef(0);

  const attachmentList =
    attachments.length > 0
      ? attachments.map((att) => `${att.name} (${att.type})`).join(", ")
      : "None";

  const coachPrompt = `You are a real-time sales coach. The user is the sales rep practicing a live call.
Use the provided script to guide them and give short, actionable feedback after each rep utterance.
Keep responses very concise (1-2 sentences), direct, and focused on what to say next.
Do NOT role-play as the prospect. Do NOT ask the user to upload anything.`;

  // Build system prompt
  const systemPrompt = coachMode && scriptText
    ? `${coachPrompt}

SCRIPT:
${scriptText}

${scenario ? `CURRENT SCENARIO: ${scenario}` : ""}
${trainingFocus ? `TRAINING FOCUS: ${trainingFocus}` : ""}
MATERIALS PROVIDED: ${attachmentList}`
    : `${persona.systemPrompt || `You are ${persona.name}, ${persona.title} at ${persona.company}.`}

${scenario ? `CURRENT SCENARIO: ${scenario}` : ""}
${trainingFocus ? `TRAINING FOCUS: ${trainingFocus}` : ""}
MATERIALS PROVIDED: ${attachmentList}

IMPORTANT: You are in a live voice conversation. Keep responses SHORT (1-3 sentences) and conversational. Wait for the person to finish speaking before responding. Be natural and react to what they say.`;

  const {
    isConnected,
    isListening,
    isSpeaking,
    userTranscript,
    aiTranscript,
    connect,
    disconnect,
    startListening,
    stopListening,
    error,
  } = useRealtimeVoice({
    systemPrompt,
    voice: "alloy",
    trainingFocus,
    attachments,
    onTranscript: (text, isFinal) => {
      if (isFinal && text.trim()) {
        // Add user message
        setMessages(prev => [...prev, {
          id: `user-${++messageIdRef.current}`,
          role: "user",
          content: text
        }]);
        setCurrentUserText("");
      } else {
        setCurrentUserText(text);
      }
    },
    onAIResponse: (text) => {
      if (text.trim()) {
        // Add AI message
        setMessages(prev => [...prev, {
          id: `ai-${++messageIdRef.current}`,
          role: "assistant",
          content: text
        }]);
        setCurrentAIText("");
      }
    },
    onError: (err) => {
      console.error("Realtime error:", err);
    },
  });

  // Update current transcripts
  useEffect(() => {
    setCurrentUserText(userTranscript);
  }, [userTranscript]);

  useEffect(() => {
    setCurrentAIText(aiTranscript);
  }, [aiTranscript]);

  useEffect(() => {
    if (!scriptText) {
      setCoachMode(false);
    }
  }, [scriptText]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, currentUserText, currentAIText]);

  const handleStartCall = async () => {
    await connect();
  };

  const handleEndCall = () => {
    disconnect();
  };

  const handleToggleMic = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleReset = () => {
    setMessages([]);
    setCurrentUserText("");
    setCurrentAIText("");
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
              {persona.name.split(" ").map((n) => n[0]).join("")}
            </div>
            <div>
              <CardTitle className="text-base text-platinum flex items-center gap-2">
                {persona.name}
                <Badge className={cn("text-xs", difficultyColors[persona.difficulty])}>
                  {persona.difficulty}
                </Badge>
                {isConnected && (
                  <Badge className="text-xs bg-automationgreen/20 text-automationgreen animate-pulse">
                    LIVE
                  </Badge>
                )}
              </CardTitle>
              <p className="text-xs text-mist">
                {persona.title} at {persona.company}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleReset}
              className="text-silver hover:text-platinum"
              title="Reset conversation"
              disabled={isConnected}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
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
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {attachments.map((att, idx) => (
              <div
                key={`${att.type}-${att.name}-${idx}`}
                className="flex items-center gap-2 px-3 py-1.5 bg-onyx border border-gunmetal rounded-lg text-xs"
              >
                {att.type === "pdf" && <FileText className="h-3 w-3 text-red-400" />}
                {att.type === "image" && <ImageIcon className="h-3 w-3 text-blue-400" />}
                {att.type === "url" && <Globe className="h-3 w-3 text-green-400" />}
                <span className="text-silver truncate max-w-[180px]">{att.name}</span>
              </div>
            ))}
          </div>
        )}
        {/* Initial message */}
        {messages.length === 0 && !isConnected && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Phone className="h-12 w-12 text-mist mb-4" />
            <h3 className="text-lg font-medium text-platinum mb-2">
              Real-time Voice Call
            </h3>
            <p className="text-sm text-silver max-w-sm mb-4">
              Start a live voice conversation with {persona.name}.
              Speak naturally and they&apos;ll respond in real-time.
            </p>
          </div>
        )}

        {/* Message history */}
        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            role={message.role}
            content={message.content}
            personaName={persona.name}
          />
        ))}

        {/* Current user transcript (while speaking) */}
        {currentUserText && (
          <ChatMessage
            role="user"
            content={currentUserText}
            personaName={persona.name}
            isLoading
          />
        )}

        {/* Current AI transcript (while responding) */}
        {currentAIText && (
          <ChatMessage
            role="assistant"
            content={currentAIText}
            personaName={persona.name}
            isLoading
          />
        )}
      </CardContent>

      {/* Call Controls */}
      <div className="border-t border-gunmetal p-4 flex-shrink-0">
        {error && (
          <div className="mb-3 p-3 bg-errorred/10 border border-errorred/30 rounded-lg">
            <p className="text-xs text-errorred text-center font-medium">{error}</p>
            {error.includes('Claude API key') && (
              <p className="text-[10px] text-mist text-center mt-1">
                Get your OpenAI API key at: https://platform.openai.com/api-keys
              </p>
            )}
          </div>
        )}

        <div className="flex items-center justify-center gap-4">
          {!isConnected ? (
            // Start call button
            <div className="flex flex-col items-center gap-3">
              {scriptText && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCoachMode(!coachMode)}
                  className={cn(
                    "border-gunmetal text-silver hover:text-platinum",
                    coachMode && "bg-neonblue/10 border-neonblue text-neonblue"
                  )}
                >
                  {coachMode ? "Script Coaching: ON" : "Enable Script Coaching"}
                </Button>
              )}
              <Button
                onClick={handleStartCall}
                className="bg-automationgreen hover:bg-automationgreen/80 text-white gap-2 px-8 py-6 text-lg"
              >
                <Phone className="h-5 w-5" />
                {coachMode ? "Start Live Coaching" : "Start Call"}
              </Button>
            </div>
          ) : (
            // In-call controls
            <>
              {/* Mic toggle */}
              <Button
                variant="outline"
                size="lg"
                onClick={handleToggleMic}
                className={cn(
                  "rounded-full h-14 w-14",
                  isListening
                    ? "bg-neonblue border-neonblue text-white"
                    : "border-gunmetal text-silver"
                )}
              >
                {isListening ? (
                  <Mic className="h-6 w-6" />
                ) : (
                  <MicOff className="h-6 w-6" />
                )}
              </Button>

              {/* Speaking indicator */}
              {isSpeaking && (
                <div className="flex items-center gap-2 px-4 py-2 bg-onyx rounded-full">
                  <Volume2 className="h-4 w-4 text-neonblue animate-pulse" />
                  <span className="text-sm text-silver">AI Speaking...</span>
                </div>
              )}

              {/* Listening indicator */}
              {isListening && !isSpeaking && (
                <div className="flex items-center gap-2 px-4 py-2 bg-onyx rounded-full">
                  <div className="flex gap-1">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="w-1 h-4 bg-automationgreen rounded-full animate-pulse"
                        style={{ animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-silver">Listening...</span>
                </div>
              )}

              {/* End call button */}
              <Button
                onClick={handleEndCall}
                className="bg-errorred hover:bg-errorred/80 text-white rounded-full h-14 w-14"
              >
                <PhoneOff className="h-6 w-6" />
              </Button>
            </>
          )}
        </div>

        <p className="text-xs text-mist mt-3 text-center">
          {isConnected
            ? isListening
              ? "Speak naturally - AI will respond in real-time"
              : "Click mic to start talking"
            : "Click 'Start Call' for live voice conversation"}
        </p>
      </div>
    </Card>
  );
}
