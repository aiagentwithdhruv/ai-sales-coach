/**
 * Text Practice API Route
 *
 * Multi-turn conversational practice with AI prospect.
 * Supports two modes:
 * - "chat": Normal conversation turn (streaming)
 * - "score": End-of-session scoring (streaming)
 */

import { streamText } from "ai";
import { getLanguageModel, getModelByIdSmart } from "@/lib/ai/providers";
import {
  generateProspectPrompt,
  PRACTICE_SCORING_PROMPT,
} from "@/lib/ai/prompts/text-practice";
import { checkCredits, deductCredits } from "@/lib/credits";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    // Check credits
    const authHeader = req.headers.get("authorization");
    const creditCheck = await checkCredits(authHeader, 1);

    if (!creditCheck.hasCredits) {
      return new Response(
        JSON.stringify({
          error: creditCheck.error || "Insufficient credits",
          code: "INSUFFICIENT_CREDITS",
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

    // Deduct credit
    if (creditCheck.userId) {
      const deductResult = await deductCredits(creditCheck.userId, 1);
      if (!deductResult.success) {
        return new Response(
          JSON.stringify({ error: "Failed to deduct credits", code: "CREDIT_DEDUCT_FAILED" }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    const model = modelId ? getModelByIdSmart(modelId) : getLanguageModel();
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
