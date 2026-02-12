/**
 * AI Coach API Route
 *
 * Handles objection handling requests with model selection and attachments.
 * Includes usage tracking and BYOAPI key resolution.
 */

import { streamText } from "ai";
import { getLanguageModel, getModelByIdSmart } from "@/lib/ai/providers";
import {
  OBJECTION_HANDLER_PROMPT,
  QUICK_COACH_PROMPT,
  generateObjectionPrompt,
} from "@/lib/ai/prompts/coaching";
import { checkUsage, incrementUsage } from "@/lib/usage";
import { resolveUserKeys } from "@/lib/ai/key-resolver";
import { processAttachmentsForContext, type Attachment } from "@/lib/ai/attachments";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const maxDuration = 30;


export async function POST(req: Request) {
  try {
    // Authenticate user
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
    }
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401, headers: { "Content-Type": "application/json" } });
    }
    const userId = user.id;

    // Check usage
    const usageCheck = await checkUsage(userId, "coaching_sessions");
    if (!usageCheck.allowed) {
      return new Response(
        JSON.stringify({
          error: usageCheck.error,
          code: "USAGE_LIMIT_REACHED",
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

    // Increment usage before making the AI call
    await incrementUsage(userId, "coaching_sessions");

    // Resolve user API keys and get the model
    const userKeys = await resolveUserKeys(userId);
    const model = modelId
      ? getModelByIdSmart(modelId, userKeys)
      : getLanguageModel(undefined, userKeys);

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
