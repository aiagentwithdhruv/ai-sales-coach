"use client";

/**
 * Dashboard Inline Chat
 *
 * A conversational command bar that expands into an inline chat
 * when the user sends a message. Uses /api/ai/command for streaming
 * responses with suggested next actions.
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { useChat } from "ai/react";
import { getAuthToken } from "@/lib/auth-token";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sparkles,
  Send,
  Loader2,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  X,
  Mic,
  Search,
  Users,
  Phone,
  Mail,
  BarChart3,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const SUGGESTION_CHIPS = [
  { label: "Find new leads", icon: Search, command: "Find 20 new leads that match my ICP" },
  { label: "Draft follow-ups", icon: Mail, command: "Draft follow-up emails for my most recent leads" },
  { label: "Pipeline review", icon: BarChart3, command: "Give me a quick pipeline review and suggest next steps" },
  { label: "Call strategy", icon: Phone, command: "Help me plan a calling campaign for this week" },
];

export function DashboardChat() {
  const [expanded, setExpanded] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getAuthToken().then(setToken);
  }, []);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    setInput,
    setMessages,
  } = useChat({
    api: "/api/ai/command",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    onResponse: () => {
      setExpanded(true);
    },
    onError: (err) => {
      console.error("Dashboard chat error:", err);
    },
  });

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleChipClick = useCallback(
    (command: string) => {
      setInput(command);
      // Small delay to let state update, then submit
      setTimeout(() => {
        const form = document.getElementById("dashboard-chat-form") as HTMLFormElement;
        form?.requestSubmit();
      }, 50);
    },
    [setInput]
  );

  const clearChat = () => {
    setMessages([]);
    setExpanded(false);
  };

  // Extract suggested actions from the last assistant message
  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
  const suggestedActions = extractSuggestedActions(lastAssistant?.content || "");

  return (
    <div className="space-y-3">
      {/* Main command bar */}
      <div
        className={cn(
          "glow-card rounded-xl bg-onyx border border-gunmetal transition-all duration-300",
          expanded && "border-neonblue/30"
        )}
        style={{ "--glow-color": "rgba(0, 179, 255, 0.2)" } as React.CSSProperties}
      >
        {/* Chat messages area */}
        {expanded && messages.length > 0 && (
          <div className="border-b border-gunmetal">
            <div className="flex items-center justify-between px-4 pt-3 pb-1">
              <span className="text-xs text-mist font-medium">AI Assistant</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={clearChat}
                  className="text-xs text-mist hover:text-silver transition-colors flex items-center gap-1"
                >
                  <X className="h-3 w-3" /> Clear
                </button>
                <button
                  onClick={() => setExpanded(false)}
                  className="text-mist hover:text-silver transition-colors"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div
              ref={scrollRef}
              className="max-h-80 overflow-y-auto px-4 py-3 space-y-3 scrollbar-thin"
            >
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "text-sm",
                    msg.role === "user"
                      ? "text-platinum bg-graphite rounded-lg px-3 py-2 ml-8"
                      : "text-silver"
                  )}
                >
                  {msg.role === "assistant" ? (
                    <div className="prose prose-sm prose-invert max-w-none [&_a]:text-neonblue [&_a]:no-underline [&_a:hover]:underline [&_strong]:text-platinum [&_li]:text-silver">
                      <AssistantMessage content={msg.content} />
                    </div>
                  ) : (
                    msg.content
                  )}
                </div>
              ))}
              {isLoading && !messages.find((m) => m.role === "assistant" && m.content === "") && (
                <div className="flex items-center gap-2 text-sm text-mist">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Thinking...</span>
                </div>
              )}
            </div>

            {/* Suggested Actions (auto-extracted from response) */}
            {suggestedActions.length > 0 && !isLoading && (
              <div className="px-4 pb-3 flex flex-wrap gap-2">
                {suggestedActions.map((action, i) => (
                  <Link key={i} href={action.href}>
                    <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neonblue/10 border border-neonblue/20 text-xs text-neonblue hover:bg-neonblue/20 transition-colors">
                      <ArrowRight className="h-3 w-3" />
                      {action.label}
                    </button>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Input bar */}
        <form
          id="dashboard-chat-form"
          onSubmit={handleSubmit}
          className="flex items-center gap-3 p-4"
        >
          <Sparkles className="h-5 w-5 text-neonblue shrink-0" />
          <Input
            ref={inputRef}
            type="text"
            placeholder='Tell your AI what to do... "Find 50 SaaS companies in NYC"'
            value={input}
            onChange={handleInputChange}
            className="flex-1 bg-transparent border-0 text-platinum placeholder:text-mist/60 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm"
          />
          {expanded && messages.length > 0 && (
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="text-mist hover:text-silver transition-colors shrink-0"
            >
              {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </button>
          )}
          <Button
            type="submit"
            size="sm"
            disabled={isLoading || !input.trim()}
            className="bg-neonblue hover:bg-electricblue text-white shrink-0"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>

      {/* Suggestion chips — only show when no messages */}
      {messages.length === 0 && (
        <div className="flex flex-wrap gap-2">
          {SUGGESTION_CHIPS.map((chip) => (
            <button
              key={chip.label}
              onClick={() => handleChipClick(chip.command)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-graphite border border-gunmetal text-xs text-silver hover:text-platinum hover:border-neonblue/40 transition-all"
            >
              <chip.icon className="h-3 w-3 text-mist" />
              {chip.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Simple markdown-ish renderer for assistant messages */
function AssistantMessage({ content }: { content: string }) {
  // Split suggested actions section from main content
  const parts = content.split(/\*\*Suggested Actions:\*\*/i);
  const mainContent = parts[0].trim();

  return (
    <div
      className="whitespace-pre-wrap"
      dangerouslySetInnerHTML={{
        __html: simpleMarkdown(mainContent),
      }}
    />
  );
}

function simpleMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>')
    .replace(/^- (.*)/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>\n?)+/g, "<ul>$&</ul>")
    .replace(/\n\n/g, "<br/><br/>")
    .replace(/\n/g, "<br/>");
}

/** Extract suggested action links from the AI response */
function extractSuggestedActions(
  content: string
): Array<{ label: string; href: string }> {
  const actions: Array<{ label: string; href: string }> = [];
  const actionsSection = content.split(/\*\*Suggested Actions:\*\*/i)[1];
  if (!actionsSection) return actions;

  const linkRegex = /\[(.*?)\]\((\/[^\s)]+)\)/g;
  let match;
  while ((match = linkRegex.exec(actionsSection)) !== null) {
    actions.push({ label: match[1], href: match[2] });
  }
  return actions.slice(0, 3); // max 3 actions
}
