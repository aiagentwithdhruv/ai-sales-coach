/**
 * Practice Chat API Route
 *
 * Streaming chat endpoint for practice sessions with AI personas.
 * Uses Vercel AI SDK for real-time streaming responses.
 * Includes credit checking for usage limiting.
 */

import { streamText } from "ai";
import { getLanguageModel } from "@/lib/ai/providers";
import {
  getPersonaById,
  generatePracticeSystemPrompt,
  PRACTICE_PERSONAS,
} from "@/lib/ai/prompts/practice-personas";
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

    const {
      messages,
      personaId,
      scenario,
      attachments,
      trainingFocus,
    }: {
      messages: Array<{ role: "user" | "assistant"; content: string }>;
      personaId?: string;
      scenario?: string;
      attachments?: Attachment[];
      trainingFocus?: string;
    } = await req.json();

    // Validate messages
    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "Messages array is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get persona (default to first one if not specified)
    const persona = personaId
      ? getPersonaById(personaId)
      : PRACTICE_PERSONAS[0];

    if (!persona) {
      return new Response(
        JSON.stringify({ error: "Invalid persona ID" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Generate system prompt based on persona
    const systemPromptBase = generatePracticeSystemPrompt(persona, scenario);
    const attachmentContext =
      attachments && attachments.length > 0
        ? await processAttachmentsForContext(attachments)
        : "";
    const trainingFocusContext = trainingFocus
      ? `\n\nTRAINING FOCUS: ${trainingFocus}\nEmphasize this focus during role-play.`
      : "";
    const systemPrompt = attachmentContext
      ? `${systemPromptBase}${trainingFocusContext}\n\n--- TRAINING CONTEXT ---${attachmentContext}\n\nUse this context to make the role-play realistic and grounded.`
      : `${systemPromptBase}${trainingFocusContext}`;

    // Get the appropriate model
    const model = getLanguageModel();

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

    // Stream the response
    const result = await streamText({
      model,
      system: systemPrompt,
      messages,
      temperature: 0.8,
      maxTokens: 500,
    });

    // Return the streaming response (compatible with useChat hook)
    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Chat API Error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to process chat request",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

/**
 * GET endpoint to list available personas
 */
export async function GET() {
  const personas = PRACTICE_PERSONAS.map((p) => ({
    id: p.id,
    name: p.name,
    title: p.title,
    company: p.company,
    personality: p.personality,
    difficulty: p.difficulty,
    industry: p.industry,
  }));

  return new Response(JSON.stringify({ personas }), {
    headers: { "Content-Type": "application/json" },
  });
}
