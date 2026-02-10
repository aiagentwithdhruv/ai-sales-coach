/**
 * AI Coach API Route
 *
 * Handles objection handling requests with model selection and attachments.
 * Includes credit checking for usage limiting.
 */

import { streamText } from "ai";
import { getLanguageModel, getModelByIdSmart } from "@/lib/ai/providers";
import {
  OBJECTION_HANDLER_PROMPT,
  QUICK_COACH_PROMPT,
  generateObjectionPrompt,
} from "@/lib/ai/prompts/coaching";
import { checkCredits, deductCredits } from "@/lib/credits";
import { processAttachmentsForContext, type Attachment } from "@/lib/ai/attachments";

export const runtime = "nodejs";
export const maxDuration = 30;


export async function POST(req: Request) {
  try {
    // Check credits first
    const authHeader = req.headers.get("authorization");
    const creditCheck = await checkCredits(authHeader, 1);

    if (!creditCheck.hasCredits) {
      return new Response(
        JSON.stringify({
          error: creditCheck.error || "Insufficient credits",
          credits: creditCheck.credits,
          code: "INSUFFICIENT_CREDITS",
        }),
        { status: 402, headers: { "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const {
      type,
      message,
      model: modelId,
      context,
      attachments,
    }: {
      type: "objection" | "quick-coach" | "general";
      message: string;
      model?: string;
      context?: {
        industry?: string;
        dealStage?: string;
        productType?: string;
        previousObjections?: string[];
      };
      attachments?: Attachment[];
    } = body;

    // Validate input
    if (!message || typeof message !== "string") {
      return new Response(
        JSON.stringify({ error: "Message is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Process attachments if any
    let attachmentContext = "";
    if (attachments && attachments.length > 0) {
      attachmentContext = await processAttachmentsForContext(attachments);
    }

    // Determine system prompt based on type
    let systemPrompt: string;
    let userMessage: string;

    switch (type) {
      case "objection":
        systemPrompt = OBJECTION_HANDLER_PROMPT;
        userMessage = context
          ? generateObjectionPrompt(message, context)
          : `OBJECTION: "${message}"`;
        break;

      case "quick-coach":
        systemPrompt = QUICK_COACH_PROMPT;
        userMessage = message;
        break;

      default:
        systemPrompt = QUICK_COACH_PROMPT;
        userMessage = message;
    }

    // Add attachment context to user message
    if (attachmentContext) {
      userMessage = `${userMessage}\n\n--- COMPANY/CONTEXT INFORMATION ---${attachmentContext}\n\nUse this context to provide more relevant and specific objection handling advice.`;
    }

    // Deduct credit before making the AI call
    if (creditCheck.userId) {
      const deductResult = await deductCredits(creditCheck.userId, 1);
      if (!deductResult.success) {
        return new Response(
          JSON.stringify({
            error: "Failed to deduct credits",
            code: "CREDIT_DEDUCT_FAILED",
          }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // Get the model - smart selection based on model ID format
    const model = modelId
      ? getModelByIdSmart(modelId)
      : getLanguageModel();

    // Moonshot API only accepts temperature 0 or 1
    const isMoonshot = modelId?.startsWith("kimi-");
    const temperature = isMoonshot ? 1 : 0.6;

    // Models that don't support max_tokens (use max_completion_tokens internally)
    // For these, omit maxTokens entirely — the SDK/API handles limits differently
    const needsNoMaxTokens = modelId && (
      modelId.startsWith("o3") || modelId.startsWith("o1") ||
      modelId === "gpt-5.1" || modelId === "gpt-5.2" ||
      modelId.includes("/o3") || modelId.includes("/o1")
    );

    // Stream the response
    const result = await streamText({
      model,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
      temperature,
      ...(needsNoMaxTokens ? {} : { maxTokens: 1200 }),
    });

    // Return plain text stream
    return new Response(result.textStream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Coach API Error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to process coaching request",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

/**
 * GET endpoint to list common objections
 */
export async function GET() {
  const COMMON_OBJECTIONS = [
    {
      category: "Price",
      objections: ["It's too expensive", "We don't have budget", "Competitor is cheaper"],
    },
    {
      category: "Timing",
      objections: ["Not ready right now", "Call back next quarter", "Not a priority"],
    },
    {
      category: "Authority",
      objections: ["Need to check with boss", "Not the decision maker"],
    },
    {
      category: "Need",
      objections: ["We don't need this", "Don't see the value"],
    },
  ];

  return new Response(JSON.stringify({ objections: COMMON_OBJECTIONS }), {
    headers: { "Content-Type": "application/json" },
  });
}
