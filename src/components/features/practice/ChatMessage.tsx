"use client";

import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Bot } from "lucide-react";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  personaName?: string;
  personaAvatar?: string;
  isLoading?: boolean;
}

export function ChatMessage({
  role,
  content,
  personaName = "AI Coach",
  personaAvatar,
  isLoading = false,
}: ChatMessageProps) {
  const isUser = role === "user";

  return (
    <div
      className={cn(
        "flex gap-3 p-4 rounded-lg",
        isUser ? "bg-onyx/50" : "bg-graphite/50"
      )}
    >
      <Avatar className="h-8 w-8 shrink-0">
        {isUser ? (
          <>
            <AvatarFallback className="bg-neonblue text-white">
              <User className="h-4 w-4" />
            </AvatarFallback>
          </>
        ) : (
          <>
            <AvatarImage src={personaAvatar} alt={personaName} />
            <AvatarFallback className="bg-automationgreen/20 text-automationgreen">
              <Bot className="h-4 w-4" />
            </AvatarFallback>
          </>
        )}
      </Avatar>
      <div className="flex-1 space-y-1">
        <p className="text-xs font-medium text-mist">
          {isUser ? "You" : personaName}
        </p>
        <div className="text-sm text-platinum leading-relaxed">
          {isLoading ? (
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-mist rounded-full animate-bounce [animation-delay:-0.3s]" />
              <span className="w-2 h-2 bg-mist rounded-full animate-bounce [animation-delay:-0.15s]" />
              <span className="w-2 h-2 bg-mist rounded-full animate-bounce" />
            </div>
          ) : (
            <p className="whitespace-pre-wrap">{content}</p>
          )}
        </div>
      </div>
    </div>
  );
}
