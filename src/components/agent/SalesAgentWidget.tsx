"use client";

import { useState, useEffect, useCallback } from "react";
import { X } from "lucide-react";
import { SalesAgentChat } from "./SalesAgentChat";

const VISITOR_COOKIE_NAME = "qh_visitor_id";
const AUTO_OPEN_DELAY = 10000; // 10 seconds

function getOrCreateVisitorId(): string {
  if (typeof window === "undefined") return "";

  // Check cookie
  const cookies = document.cookie.split(";");
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split("=");
    if (name === VISITOR_COOKIE_NAME && value) {
      return value;
    }
  }

  // Create new visitor ID
  const id = crypto.randomUUID();
  // Set cookie for 1 year
  const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `${VISITOR_COOKIE_NAME}=${id}; path=/; expires=${expires}; SameSite=Lax`;
  return id;
}

/** Play a gentle two-tone notification chime using Web Audio API */
function playNotificationChime() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const now = ctx.currentTime;

    // First tone (C5 - 523 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.value = 523;
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.15, now + 0.05);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    osc1.connect(gain1).connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.4);

    // Second tone (E5 - 659 Hz, slight delay)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.value = 659;
    gain2.gain.setValueAtTime(0, now + 0.15);
    gain2.gain.linearRampToValueAtTime(0.12, now + 0.2);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc2.connect(gain2).connect(ctx.destination);
    osc2.start(now + 0.15);
    osc2.stop(now + 0.6);

    // Cleanup
    setTimeout(() => ctx.close(), 1000);
  } catch {
    // Audio not available — silently skip
  }
}

const PROACTIVE_GREETING =
  "Hey! I'm Sarah from QuotaHit. Looking at our pricing? I can help you find the perfect plan for your team. What kind of sales tools are you looking for?";

export function SalesAgentWidget({
  pageContext = "pricing",
}: {
  pageContext?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasAutoOpened, setHasAutoOpened] = useState(false);
  const [visitorId, setVisitorId] = useState("");
  const [showPulse, setShowPulse] = useState(true);

  // Initialize visitor ID on mount
  useEffect(() => {
    setVisitorId(getOrCreateVisitorId());
  }, []);

  // Auto-open after delay on pricing page
  useEffect(() => {
    if (hasAutoOpened || pageContext !== "pricing") return;

    const timer = setTimeout(() => {
      setIsOpen(true);
      setHasAutoOpened(true);
      setShowPulse(false);
      playNotificationChime();
    }, AUTO_OPEN_DELAY);

    return () => clearTimeout(timer);
  }, [hasAutoOpened, pageContext]);

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => !prev);
    setShowPulse(false);
  }, []);

  if (!visitorId) return null;

  return (
    <>
      {/* Chat panel */}
      {isOpen && (
        <div
          className="fixed bottom-20 right-4 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[520px] max-h-[70vh] rounded-2xl bg-graphite border border-gunmetal shadow-2xl shadow-black/60 overflow-hidden flex flex-col"
          style={{
            animation: "fadeInUp 0.25s ease-out",
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-onyx border-b border-gunmetal">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <img
                  src="/agent-avatar.svg"
                  alt="Sales Agent"
                  className="h-8 w-8 rounded-full"
                />
                <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 bg-emerald-400 rounded-full border-2 border-onyx" />
              </div>
              <div>
                <p className="text-sm font-semibold text-platinum leading-tight">
                  Sarah from QuotaHit
                </p>
                <p className="text-[10px] text-emerald-400 leading-tight">
                  Online • Usually responds instantly
                </p>
              </div>
            </div>
            <button
              onClick={handleToggle}
              className="p-1.5 rounded-lg hover:bg-gunmetal text-silver hover:text-platinum transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Chat body */}
          <div className="flex-1 overflow-hidden">
            <SalesAgentChat
              visitorId={visitorId}
              pageContext={pageContext}
              proactiveGreeting={PROACTIVE_GREETING}
            />
          </div>

          {/* Footer */}
          <div className="px-3 py-1.5 bg-onyx/50 border-t border-gunmetal">
            <p className="text-[10px] text-mist text-center">
              Powered by QuotaHit AI • Free to chat
            </p>
          </div>
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={handleToggle}
        className="fixed bottom-5 right-5 z-50 group"
        aria-label={isOpen ? "Close chat" : "Chat with sales"}
      >
        <style>{`
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(12px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes agent-border-spin {
            from { --agent-angle: 0deg; }
            to { --agent-angle: 360deg; }
          }
          @keyframes agent-pulse {
            0%, 100% { opacity: 0.3; transform: scale(1); }
            50% { opacity: 0.7; transform: scale(1.08); }
          }
          @property --agent-angle {
            syntax: '<angle>';
            initial-value: 0deg;
            inherits: false;
          }
          .agent-btn-glow {
            animation: agent-border-spin 3s linear infinite;
            background: conic-gradient(
              from var(--agent-angle),
              transparent 0%,
              rgba(0,200,232,0.7) 15%,
              transparent 35%,
              transparent 65%,
              rgba(0,179,255,0.7) 85%,
              transparent 100%
            );
          }
        `}</style>

        {/* Pulse ring (before auto-open) */}
        {showPulse && !isOpen && (
          <div
            className="absolute -inset-3 rounded-2xl"
            style={{
              background: "radial-gradient(circle, rgba(0,200,232,0.2) 0%, transparent 70%)",
              animation: "agent-pulse 2.5s ease-in-out infinite",
            }}
          />
        )}

        {/* Spinning border glow */}
        {!isOpen && (
          <div className="agent-btn-glow absolute -inset-[1.5px] rounded-2xl" />
        )}

        {/* Button body */}
        <div
          className="relative flex items-center gap-2.5 px-4 py-3 rounded-2xl border border-white/[0.08] transition-all group-hover:scale-[1.03]"
          style={{
            background: isOpen ? "#1e1e24" : "#111114",
            boxShadow: isOpen ? "none" : "0 0 20px rgba(0,179,255,0.15)",
          }}
        >
          {isOpen ? (
            <>
              <X className="h-5 w-5 text-silver" />
              <span className="text-sm font-medium text-silver">Close</span>
            </>
          ) : (
            <>
              <div className="relative flex-shrink-0">
                <img
                  src="/agent-avatar.svg"
                  alt="Sales Agent"
                  className="h-9 w-9 rounded-full"
                />
                <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 bg-emerald-400 rounded-full border-2 border-[#111114]" />
              </div>
              <span className="text-sm font-medium text-platinum whitespace-nowrap pr-1">
                Chat with Sarah
              </span>
            </>
          )}
        </div>
      </button>
    </>
  );
}
