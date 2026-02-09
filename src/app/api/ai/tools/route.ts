/**
 * Unified AI Tools API Route
 *
 * Handles all sales tool requests: email crafter, pitch scorer,
 * discovery questions, deal strategy, call prep, battle cards.
 * Uses streaming text responses with credit checking.
 */

import { streamText } from "ai";
import { getLanguageModel, getModelByIdSmart } from "@/lib/ai/providers";
import { TOOL_PROMPTS, generateToolPrompt } from "@/lib/ai/prompts/tools";
import { checkCredits, deductCredits } from "@/lib/credits";

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

    // Get the model
    const model = modelId
      ? getModelByIdSmart(modelId)
      : getLanguageModel();

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
