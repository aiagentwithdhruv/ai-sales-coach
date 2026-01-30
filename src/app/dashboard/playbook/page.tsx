"use client";

import { useState, useRef, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Search,
  Send,
  FileText,
  MessageSquare,
  Sparkles,
  ChevronRight,
  Bot,
  User,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Mock playbook sections
const PLAYBOOK_SECTIONS = [
  {
    id: "discovery",
    title: "Discovery Framework",
    icon: "🔍",
    topics: [
      "SPIN Questions",
      "Pain Discovery",
      "Budget Qualification",
      "Timeline Assessment",
    ],
  },
  {
    id: "objections",
    title: "Objection Handling",
    icon: "🛡️",
    topics: [
      "Price Objections",
      "Competitor Comparisons",
      "Timing Concerns",
      "Authority Issues",
    ],
  },
  {
    id: "demos",
    title: "Demo Best Practices",
    icon: "💻",
    topics: [
      "Demo Structure",
      "Feature Presentation",
      "Use Case Stories",
      "Technical Deep Dives",
    ],
  },
  {
    id: "closing",
    title: "Closing Techniques",
    icon: "🤝",
    topics: [
      "Trial Closes",
      "Assumptive Close",
      "Urgency Creation",
      "Negotiation Tactics",
    ],
  },
  {
    id: "followup",
    title: "Follow-up Cadence",
    icon: "📧",
    topics: [
      "Email Templates",
      "Call Scripts",
      "Multi-touch Sequences",
      "Re-engagement",
    ],
  },
];

// Sample suggested questions
const SUGGESTED_QUESTIONS = [
  "What are the best discovery questions for enterprise deals?",
  "How should I handle the 'we're using a competitor' objection?",
  "What's the ideal demo structure for a first meeting?",
  "How do I create urgency without being pushy?",
];

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export default function PlaybookPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Simulate AI response (in production, this would call the RAG API)
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `Based on our sales playbook, here's what I found about "${userMessage.content}":\n\n**Key Points:**\n1. Start with open-ended questions to understand their current situation\n2. Focus on uncovering specific pain points and their business impact\n3. Quantify the problem whenever possible\n4. Connect their challenges to your solution's capabilities\n\n**Example Questions:**\n- "What's your biggest challenge with [relevant area] right now?"\n- "How is this affecting your team's productivity?"\n- "What would it mean for your business if you could solve this?"\n\n**Pro Tip:** Always take notes and mirror their language back to them to show you're listening.`,
      };
      setMessages((prev) => [...prev, aiMessage]);
      setIsLoading(false);
    }, 1500);
  };

  const handleSuggestedQuestion = (question: string) => {
    setInput(question);
  };

  const handleTopicClick = (topic: string) => {
    setInput(`Tell me about ${topic}`);
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-platinum flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-neonblue" />
            Sales Playbook
          </h1>
          <p className="text-silver mt-1">
            AI-powered search through your sales knowledge base
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Playbook Sections Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            <Card className="bg-graphite border-gunmetal">
              <CardHeader className="pb-2">
                <CardTitle className="text-platinum text-base">
                  Playbook Sections
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {PLAYBOOK_SECTIONS.map((section) => (
                  <div key={section.id} className="space-y-1">
                    <div className="flex items-center gap-2 text-sm font-medium text-platinum">
                      <span>{section.icon}</span>
                      <span>{section.title}</span>
                    </div>
                    <div className="pl-6 space-y-1">
                      {section.topics.map((topic) => (
                        <button
                          key={topic}
                          onClick={() => handleTopicClick(topic)}
                          className="w-full text-left text-xs text-silver hover:text-neonblue transition-colors flex items-center gap-1 group"
                        >
                          <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          {topic}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Chat Interface */}
          <div className="lg:col-span-3">
            <Card className="bg-graphite border-gunmetal h-[calc(100vh-14rem)] flex flex-col">
              {/* Chat Header */}
              <CardHeader className="border-b border-gunmetal py-3 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-neonblue/10 flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-neonblue" />
                  </div>
                  <div>
                    <CardTitle className="text-base text-platinum">
                      Playbook Assistant
                    </CardTitle>
                    <p className="text-xs text-mist">
                      Ask anything about sales best practices
                    </p>
                  </div>
                </div>
              </CardHeader>

              {/* Messages Area */}
              <CardContent
                ref={chatRef}
                className="flex-1 overflow-y-auto p-4 space-y-4"
              >
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <BookOpen className="h-12 w-12 text-mist mb-4" />
                    <h3 className="text-lg font-medium text-platinum mb-2">
                      Ask the Playbook
                    </h3>
                    <p className="text-sm text-silver mb-6 max-w-md">
                      Get instant answers from your sales playbook. Ask about
                      discovery techniques, objection handling, or any sales topic.
                    </p>
                    <div className="space-y-2 w-full max-w-md">
                      <p className="text-xs text-mist mb-2">
                        Try asking:
                      </p>
                      {SUGGESTED_QUESTIONS.map((question) => (
                        <button
                          key={question}
                          onClick={() => handleSuggestedQuestion(question)}
                          className="w-full p-3 text-left text-sm text-silver bg-onyx rounded-lg hover:bg-onyx/80 hover:text-platinum transition-colors border border-gunmetal"
                        >
                          {question}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "flex gap-3 p-3 rounded-lg",
                        message.role === "user"
                          ? "bg-onyx/50"
                          : "bg-graphite/50"
                      )}
                    >
                      <div
                        className={cn(
                          "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
                          message.role === "user"
                            ? "bg-neonblue text-white"
                            : "bg-automationgreen/20 text-automationgreen"
                        )}
                      >
                        {message.role === "user" ? (
                          <User className="h-4 w-4" />
                        ) : (
                          <Bot className="h-4 w-4" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-medium text-mist mb-1">
                          {message.role === "user" ? "You" : "Playbook AI"}
                        </p>
                        <div className="text-sm text-platinum whitespace-pre-wrap">
                          {message.content}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                {isLoading && (
                  <div className="flex gap-3 p-3 rounded-lg bg-graphite/50">
                    <div className="h-8 w-8 rounded-full bg-automationgreen/20 flex items-center justify-center shrink-0">
                      <Bot className="h-4 w-4 text-automationgreen" />
                    </div>
                    <div className="flex items-center gap-2 text-sm text-mist">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Searching playbook...
                    </div>
                  </div>
                )}
              </CardContent>

              {/* Input Area */}
              <div className="border-t border-gunmetal p-4 flex-shrink-0">
                <form onSubmit={handleSubmit} className="flex gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask about sales techniques, objection handling, demos..."
                    className="bg-onyx border-gunmetal text-platinum placeholder:text-mist focus:border-neonblue"
                    disabled={isLoading}
                  />
                  <Button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className="bg-neonblue hover:bg-electricblue text-white px-4"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
