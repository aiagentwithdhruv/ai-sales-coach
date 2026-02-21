"use client";

import { useRef, useEffect } from "react";
import { useChat } from "ai/react";
import { Send, Loader2 } from "lucide-react";
import { SalesAgentMessage } from "./SalesAgentMessage";

interface SalesAgentChatProps {
  visitorId: string;
  pageContext?: string;
  proactiveGreeting?: string;
}

export function SalesAgentChat({
  visitorId,
  pageContext = "pricing",
  proactiveGreeting,
}: SalesAgentChatProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { messages, input, handleInputChange, handleSubmit, isLoading, error } =
    useChat({
      api: "/api/agent/sales",
      body: { visitorId, pageContext },
      initialMessages: proactiveGreeting
        ? [
            {
              id: "greeting",
              role: "assistant",
              content: proactiveGreeting,
            },
          ]
        : [],
    });

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-3 py-3 space-y-1 scrollbar-thin scrollbar-thumb-gunmetal"
        style={{ maxHeight: "calc(100% - 56px)" }}
      >
        {messages.map((msg) => (
          <SalesAgentMessage
            key={msg.id}
            role={msg.role as "user" | "assistant"}
            content={msg.content}
          />
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex gap-2 items-center px-1">
            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-neonblue to-electricblue flex items-center justify-center">
              <span className="text-xs font-bold text-white">Q</span>
            </div>
            <div className="flex gap-1 items-center">
              <div className="w-1.5 h-1.5 rounded-full bg-neonblue animate-bounce" style={{ animationDelay: "0ms" }} />
              <div className="w-1.5 h-1.5 rounded-full bg-neonblue animate-bounce" style={{ animationDelay: "150ms" }} />
              <div className="w-1.5 h-1.5 rounded-full bg-neonblue animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}

        {/* Error display */}
        {error && (
          <div className="px-3 py-2 rounded-lg bg-errorred/10 border border-errorred/20 text-xs text-errorred">
            Something went wrong. Please try again.
          </div>
        )}
      </div>

      {/* Input area */}
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 px-3 py-2.5 border-t border-gunmetal bg-onyx/50"
      >
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={handleInputChange}
          placeholder="Ask about pricing, features..."
          className="flex-1 bg-transparent text-sm text-platinum placeholder:text-mist outline-none"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="p-1.5 rounded-lg bg-neonblue/20 hover:bg-neonblue/30 text-neonblue disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>
      </form>
    </div>
  );
}
