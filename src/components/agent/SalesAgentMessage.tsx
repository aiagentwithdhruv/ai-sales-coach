"use client";

import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface SalesAgentMessageProps {
  role: "user" | "assistant";
  content: string;
}

export function SalesAgentMessage({ role, content }: SalesAgentMessageProps) {
  const isUser = role === "user";

  return (
    <div className={cn("flex gap-2 mb-3", isUser ? "justify-end" : "justify-start")}>
      {/* Avatar */}
      {!isUser && (
        <div className="flex-shrink-0 h-7 w-7 rounded-full bg-gradient-to-br from-neonblue to-electricblue flex items-center justify-center mt-0.5">
          <span className="text-xs font-bold text-white">Q</span>
        </div>
      )}

      {/* Message bubble */}
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
          isUser
            ? "bg-neonblue/15 text-platinum border border-neonblue/20 rounded-tr-md"
            : "bg-gunmetal/60 text-silver border border-gunmetal rounded-tl-md"
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{content}</p>
        ) : (
          <div className="agent-message prose prose-sm prose-invert max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ children }) => <p className="mb-1.5 last:mb-0">{children}</p>,
                strong: ({ children }) => (
                  <strong className="text-platinum font-semibold">{children}</strong>
                ),
                a: ({ href, children }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-neonblue hover:text-electricblue underline"
                  >
                    {children}
                  </a>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc list-inside mb-1.5 space-y-0.5">{children}</ul>
                ),
                li: ({ children }) => <li className="text-silver">{children}</li>,
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        )}
      </div>

      {/* User avatar */}
      {isUser && (
        <div className="flex-shrink-0 h-7 w-7 rounded-full bg-gunmetal border border-white/10 flex items-center justify-center mt-0.5">
          <span className="text-xs text-silver">You</span>
        </div>
      )}
    </div>
  );
}
