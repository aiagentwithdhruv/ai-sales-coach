/**
 * Sales Agent API Route
 *
 * Streaming chat endpoint for the pricing page sales agent.
 * No auth required — uses anonymous visitor IDs.
 * Platform-managed OpenRouter keys (not BYOAPI).
 */

import { streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { getSalesAgentPrompt } from "@/lib/ai/prompts/sales-agent";
import { getSalesAgentTools } from "@/lib/ai/tools/sales-agent-tools";
import {
  createConversation,
  getActiveConversation,
  saveMessages,
} from "@/lib/agent/conversation-tracker";
import { buildVisitorContextString, getLastConversationMessages } from "@/lib/agent/visitor-memory";

export const runtime = "nodejs";
export const maxDuration = 30;

const AGENT_MODEL = "x-ai/grok-4.1-fast";

function getOpenRouterModel() {
  return createOpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: "https://openrouter.ai/api/v1",
    headers: {
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://www.quotahit.com",
      "X-Title": "QuotaHit Sales Agent",
    },
  })(AGENT_MODEL);
}

export async function POST(req: Request) {
  try {
    const {
      messages,
      visitorId,
      pageContext,
    }: {
      messages: Array<{ role: "user" | "assistant"; content: string }>;
      visitorId: string;
      pageContext?: string;
    } = await req.json();

    if (!messages || !Array.isArray(messages) || !visitorId) {
      return new Response(
        JSON.stringify({ error: "messages array and visitorId are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get or create conversation
    let conversation = await getActiveConversation(visitorId);
    let conversationId = conversation?.id;

    if (!conversationId) {
      conversationId =
        (await createConversation(visitorId, pageContext || "pricing")) ||
        undefined;
    }

    // Build visitor context for returning visitors
    const [visitorContext, previousMessages] = await Promise.all([
      buildVisitorContextString(visitorId),
      getLastConversationMessages(visitorId),
    ]);

    // Build previous conversation summary for context
    let prevConvoContext: string | undefined;
    if (previousMessages && previousMessages.length > 0) {
      const convoLines = previousMessages
        .filter((m) => m.content && m.content.trim())
        .map((m) => `${m.role === "user" ? "Visitor" : "Sarah"}: ${m.content.slice(0, 200)}`)
        .join("\n");
      if (convoLines) {
        prevConvoContext = convoLines;
      }
    }

    // Get system prompt with visitor context + previous conversation
    const systemPrompt = getSalesAgentPrompt(visitorContext, prevConvoContext);

    // Get tools with visitor/conversation context
    const tools = getSalesAgentTools(visitorId, conversationId);

    // Stream the response
    const result = await streamText({
      model: getOpenRouterModel(),
      system: systemPrompt,
      messages,
      tools,
      maxSteps: 5,
      temperature: 0.7,
      onFinish: async ({ text }) => {
        // Persist messages after response completes
        if (conversationId) {
          const updatedMessages = [
            ...messages,
            { role: "assistant" as const, content: text },
          ];
          await saveMessages(conversationId, updatedMessages).catch((err) =>
            console.error("[SalesAgent] Save error:", err)
          );
        }
      },
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("[SalesAgent] Route error:", error);
    return new Response(
      JSON.stringify({
        error: "Sales agent is temporarily unavailable. Please try again.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
