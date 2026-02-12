/**
 * Text Practice API Route
 *
 * Multi-turn conversational practice with AI prospect.
 * Supports two modes:
 * - "chat": Normal conversation turn (streaming)
 * - "score": End-of-session scoring (streaming)
 * Includes usage tracking and BYOAPI key resolution.
 */

import { streamText } from "ai";
import { getLanguageModel, getModelByIdSmart } from "@/lib/ai/providers";
import {
  generateProspectPrompt,
  PRACTICE_SCORING_PROMPT,
} from "@/lib/ai/prompts/text-practice";
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
      mode,
      messages,
      persona,
      scenario,
      model: modelId,
    }: {
      mode: "chat" | "score";
      messages: { role: "user" | "assistant"; content: string }[];
      persona: {
        name: string;
        title: string;
        company: string;
        industry: string;
        personality: string;
        difficulty: string;
      };
      scenario?: {
        situation?: string;
        objective?: string;
      };
      model?: string;
    } = body;

    if (!messages || !persona) {
      return new Response(
        JSON.stringify({ error: "Messages and persona are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Increment usage and resolve user API keys
    await incrementUsage(userId, "coaching_sessions");
    const userKeys = await resolveUserKeys(userId);

    const model = modelId ? getModelByIdSmart(modelId, userKeys) : getLanguageModel(undefined, userKeys);
    const isMoonshot = modelId?.startsWith("kimi-");
    const temperature = isMoonshot ? 1 : 0.7;

    let systemPrompt: string;
    let chatMessages = messages;

    if (mode === "score") {
      // Score mode: send full conversation history for analysis
      systemPrompt = PRACTICE_SCORING_PROMPT;
      const conversationText = messages
        .map((m) => `${m.role === "user" ? "Sales Rep" : "Prospect"}: ${m.content}`)
        .join("\n\n");
      chatMessages = [
        {
          role: "user" as const,
          content: `Score this practice sales conversation:\n\n${conversationText}`,
        },
      ];
    } else {
      // Chat mode: prospect roleplay
      systemPrompt = generateProspectPrompt({
        personaName: persona.name,
        personaTitle: persona.title,
        company: persona.company,
        industry: persona.industry,
        personality: persona.personality,
        difficulty: persona.difficulty,
        scenario: scenario?.situation,
        objective: scenario?.objective,
      });
    }

    const result = await streamText({
      model,
      system: systemPrompt,
      messages: chatMessages,
      temperature,
      maxTokens: mode === "score" ? 1500 : 300,
    });

    return new Response(result.textStream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Text Practice API Error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to process request",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
