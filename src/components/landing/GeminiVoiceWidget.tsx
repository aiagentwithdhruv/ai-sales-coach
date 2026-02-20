"use client";

import { useState } from "react";
import { Mic, MicOff, PhoneOff, ArrowRight, X } from "lucide-react";
import { useGeminiLiveVoice } from "@/hooks/useGeminiLiveVoice";
import Link from "next/link";

const SALES_COACH_PROMPT = `You are QuotaHit's AI Sales Coach — a live demo running on our website.
This is a short 2-minute demo to show visitors what AI sales coaching feels like.

RULES:
- Keep responses SHORT (2-3 sentences max). This is voice, not text.
- Be energetic, warm, and encouraging.
- Sound natural and conversational, like a real coach.

FLOW:
1. Start with a brief greeting: "Hey! I'm your AI sales coach from QuotaHit. What do you sell?"
2. After they answer, give them a realistic buyer objection for their industry.
3. Let them respond to the objection.
4. Give quick, specific coaching feedback on their response (what was good, one thing to improve).
5. If time allows, do one more round.
6. End with: "Nice work! If you want unlimited practice sessions with detailed scoring, sign up free at QuotaHit. No credit card needed."

STYLE:
- Talk like a supportive coach, not a robot
- Use their name if they mention it
- Reference their specific product/industry in objections
- Be honest but encouraging in feedback`;

export function GeminiVoiceWidget() {
  const [showPanel, setShowPanel] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);

  const { state, isListening, isSpeaking, error, duration, connect, disconnect } =
    useGeminiLiveVoice({
      systemPrompt: SALES_COACH_PROMPT,
      maxDuration: 120,
      onSessionEnd: () => setSessionEnded(true),
      onError: (err) => console.error("[Widget]", err),
    });

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handleStart = async () => {
    setShowPanel(true);
    setSessionEnded(false);
    await connect();
  };

  const handleEnd = () => {
    disconnect();
    setSessionEnded(true);
  };

  const handleClose = () => {
    disconnect();
    setShowPanel(false);
    setSessionEnded(false);
  };

  // Idle state — floating button
  if (!showPanel) {
    return (
      <button
        onClick={handleStart}
        className="fixed bottom-6 right-6 z-50 group"
        aria-label="Try AI Sales Coach"
      >
        <style>{`
          @keyframes border-spin {
            from { --angle: 0deg; }
            to { --angle: 360deg; }
          }
          @keyframes glow-pulse {
            0%, 100% { opacity: 0.4; }
            50% { opacity: 0.8; }
          }
          @property --angle {
            syntax: '<angle>';
            initial-value: 0deg;
            inherits: false;
          }
          .voice-widget-btn {
            animation: border-spin 3s linear infinite;
            background: conic-gradient(
              from var(--angle),
              transparent 0%,
              rgba(255,255,255,0.7) 10%,
              rgba(0,200,232,0.8) 20%,
              transparent 40%,
              transparent 60%,
              rgba(0,179,255,0.8) 80%,
              rgba(255,255,255,0.5) 90%,
              transparent 100%
            );
          }
        `}</style>
        {/* Soft pulsing glow underneath */}
        <div
          className="absolute -inset-3 rounded-2xl"
          style={{
            background: "radial-gradient(circle, rgba(0,179,255,0.25) 0%, transparent 70%)",
            animation: "glow-pulse 2.5s ease-in-out infinite",
          }}
        />
        {/* Animated spinning border — the premium glow ring */}
        <div className="voice-widget-btn absolute -inset-[1.5px] rounded-2xl" />
        {/* Button body — dark with subtle border like footer tabs */}
        <div
          className="relative flex items-center gap-2.5 px-4 py-3 rounded-2xl border border-white/[0.08] transition-all group-hover:scale-[1.03]"
          style={{
            background: "#111114",
            boxShadow: "0 0 20px rgba(0,179,255,0.15)",
          }}
        >
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-neonblue to-electricblue flex items-center justify-center flex-shrink-0">
            <Mic className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-medium text-platinum whitespace-nowrap pr-1">
            Try AI Coach
          </span>
        </div>
      </button>
    );
  }

  // Active panel
  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 rounded-2xl bg-graphite border border-gunmetal shadow-2xl shadow-black/50 overflow-hidden animate-fade-in-up" style={{ animationDuration: "0.3s" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-onyx border-b border-gunmetal">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-full bg-gradient-to-br from-neonblue to-electricblue flex items-center justify-center">
            <Mic className="h-3 w-3 text-white" />
          </div>
          <span className="text-sm font-semibold text-platinum">
            AI Sales Coach
          </span>
        </div>
        <div className="flex items-center gap-2">
          {state === "connected" && (
            <span className="text-xs font-mono text-silver">
              {formatTime(duration)}
            </span>
          )}
          <button
            onClick={handleClose}
            className="p-1 rounded-md hover:bg-gunmetal text-silver hover:text-platinum transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="px-4 py-5">
        {/* Connecting */}
        {state === "connecting" && (
          <div className="text-center py-4">
            <div className="h-16 w-16 mx-auto rounded-full bg-neonblue/10 border border-neonblue/30 flex items-center justify-center mb-3">
              <div className="h-8 w-8 rounded-full border-2 border-neonblue border-t-transparent animate-spin" />
            </div>
            <p className="text-sm text-silver">Connecting to AI coach...</p>
          </div>
        )}

        {/* Error */}
        {state === "error" && (
          <div className="text-center py-4">
            <p className="text-sm text-errorred mb-3">{error || "Connection failed"}</p>
            <button
              onClick={handleStart}
              className="px-4 py-2 rounded-lg bg-neonblue hover:bg-electricblue text-white text-sm font-medium transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Connected — voice active */}
        {state === "connected" && !sessionEnded && (
          <div className="text-center">
            {/* Voice visualization */}
            <div className="relative h-20 w-20 mx-auto mb-4">
              {/* Outer ring — pulses when AI speaks */}
              <div
                className={`absolute inset-0 rounded-full transition-all duration-300 ${
                  isSpeaking
                    ? "bg-automationgreen/15 border-2 border-automationgreen/40 scale-110"
                    : isListening
                    ? "bg-neonblue/15 border-2 border-neonblue/40"
                    : "bg-gunmetal/50 border-2 border-gunmetal"
                }`}
              />
              {/* Sound wave bars */}
              <div className="absolute inset-0 flex items-center justify-center gap-1">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`w-1 rounded-full transition-all ${
                      isSpeaking
                        ? "bg-automationgreen animate-pulse"
                        : isListening
                        ? "bg-neonblue animate-pulse"
                        : "bg-gunmetal"
                    }`}
                    style={{
                      height: isSpeaking || isListening
                        ? `${12 + Math.random() * 20}px`
                        : "8px",
                      animationDelay: `${i * 0.1}s`,
                      animationDuration: "0.6s",
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Status text */}
            <p className="text-sm text-silver mb-1">
              {isSpeaking ? (
                <span className="text-automationgreen">AI Coach is speaking...</span>
              ) : isListening ? (
                <span className="text-neonblue">Listening to you...</span>
              ) : (
                "Connecting audio..."
              )}
            </p>
            <p className="text-xs text-mist mb-4">
              {120 - duration > 0
                ? `${Math.floor((120 - duration) / 60)}:${((120 - duration) % 60).toString().padStart(2, "0")} remaining`
                : "Session ending..."}
            </p>

            {/* End call button */}
            <button
              onClick={handleEnd}
              className="px-5 py-2.5 rounded-full bg-errorred/90 hover:bg-errorred text-white text-sm font-medium transition-colors flex items-center gap-2 mx-auto"
            >
              <PhoneOff className="h-4 w-4" />
              End Session
            </button>
          </div>
        )}

        {/* Session ended — CTA */}
        {sessionEnded && (
          <div className="text-center py-2">
            <div className="h-12 w-12 mx-auto rounded-full bg-automationgreen/10 border border-automationgreen/30 flex items-center justify-center mb-3">
              <Mic className="h-5 w-5 text-automationgreen" />
            </div>
            <p className="text-sm font-medium text-platinum mb-1">
              Nice work!
            </p>
            <p className="text-xs text-silver mb-4">
              Want unlimited practice with detailed scoring?
            </p>
            <Link href="/signup">
              <button className="w-full px-4 py-2.5 rounded-lg bg-neonblue hover:bg-electricblue text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                Sign Up Free — No Credit Card
                <ArrowRight className="h-4 w-4" />
              </button>
            </Link>
            <button
              onClick={() => {
                setSessionEnded(false);
                handleStart();
              }}
              className="mt-2 text-xs text-silver hover:text-neonblue transition-colors"
            >
              Try another session
            </button>
          </div>
        )}
      </div>

      {/* Footer — branding */}
      <div className="px-4 py-2 bg-onyx/50 border-t border-gunmetal">
        <p className="text-[10px] text-mist text-center">
          Powered by Gemini AI — Free demo limited to 2 minutes
        </p>
      </div>
    </div>
  );
}
