/**
 * Unified AI Tools API Route
 *
 * Handles all sales tool requests: email crafter, pitch scorer,
 * discovery questions, deal strategy, call prep, battle cards.
 * Uses streaming text responses with usage tracking and BYOAPI key resolution.
 */

import { streamText } from "ai";
import { getLanguageModel, getModelByIdSmart } from "@/lib/ai/providers";
import { TOOL_PROMPTS, generateToolPrompt } from "@/lib/ai/prompts/tools";
import { checkUsage, incrementUsage } from "@/lib/usage";
import { resolveUserKeys } from "@/lib/ai/key-resolver";
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
    }: {
      type: string;
      message: string;
      model?: string;
      context?: Record<string, string>;
    } = body;

    // Validate input
    if (!message || typeof message !== "string") {
      return new Response(
        JSON.stringify({ error: "Message is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!type || !TOOL_PROMPTS[type]) {
      return new Response(
        JSON.stringify({ error: `Unknown tool type: ${type}` }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Increment usage and resolve user API keys
    await incrementUsage(userId, "coaching_sessions");
    const userKeys = await resolveUserKeys(userId);

    // Get the model
    const model = modelId
      ? getModelByIdSmart(modelId, userKeys)
      : getLanguageModel(undefined, userKeys);

    // Moonshot API only accepts temperature 0 or 1
    const isMoonshot = modelId?.startsWith("kimi-");
    const temperature = isMoonshot ? 1 : 0.6;

    // Build the user message with context
    const userMessage = generateToolPrompt(type, message, context);

    // Stream the response
    const result = await streamText({
      model,
      system: TOOL_PROMPTS[type],
      messages: [{ role: "user", content: userMessage }],
      temperature,
      maxTokens: 1500,
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
    console.error("Tools API Error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to process request",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
