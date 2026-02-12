/**
 * Practice Chat API Route
 *
 * Streaming chat endpoint for practice sessions with AI personas.
 * Uses Vercel AI SDK for real-time streaming responses.
 * Includes usage tracking and BYOAPI key resolution.
 */

import { streamText } from "ai";
import { getLanguageModel } from "@/lib/ai/providers";
import {
  getPersonaById,
  generatePracticeSystemPrompt,
  PRACTICE_PERSONAS,
} from "@/lib/ai/prompts/practice-personas";
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

    // Resolve user API keys and get the appropriate model
    const userKeys = await resolveUserKeys(userId);
    const model = getLanguageModel(undefined, userKeys);

    // Increment usage before making the AI call
    await incrementUsage(userId, "coaching_sessions");

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
