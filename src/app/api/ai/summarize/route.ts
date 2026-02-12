/**
 * Meeting Notes Summarizer API Route
 * Upload meeting notes/transcript and get AI summary with action items
 * Includes usage tracking and BYOAPI key resolution.
 */

import { streamText } from "ai";
import { getModelByIdSmart, getLanguageModel } from "@/lib/ai/providers";
import { checkUsage, incrementUsage } from "@/lib/usage";
import { resolveUserKeys } from "@/lib/ai/key-resolver";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const maxDuration = 30;

const SUMMARIZE_PROMPT = `You are a top sales operations analyst who summarizes meetings to maximize follow-through and deal velocity.

FORMAT YOUR RESPONSE EXACTLY LIKE THIS:

## Meeting Summary
2-3 sentence overview of what was discussed and the outcome.

## Key Decisions Made
- [Decision 1]
- [Decision 2]

## Action Items

| Owner | Action Item | Deadline |
|-------|------------|----------|
| [Us/Them/Name] | [Specific action] | [Suggested deadline] |
| [Us/Them/Name] | [Specific action] | [Suggested deadline] |

## Buying Signals Detected
- [Signal 1] — What it means
- [Signal 2] — What it means

## Red Flags / Concerns
- [Concern 1] — How to address it
- [Concern 2] — How to address it

## Deal Stage Assessment
Current stage and recommended next steps.

## Follow-Up Email Draft
Write a brief follow-up email that references the meeting and confirms next steps.

Be specific. Extract every actionable detail. Don't miss anything important.`;

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
    const usageCheck = await checkUsage(userId, "analyses_run");
    if (!usageCheck.allowed) {
      return new Response(
        JSON.stringify({ error: usageCheck.error, code: "USAGE_LIMIT_REACHED" }),
        { status: 402, headers: { "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { notes, model: modelId }: { notes: string; model?: string } = body;

    if (!notes) {
      return new Response(
        JSON.stringify({ error: "Meeting notes are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Increment usage and resolve user API keys
    await incrementUsage(userId, "analyses_run");
    const userKeys = await resolveUserKeys(userId);

    const model = modelId ? getModelByIdSmart(modelId, userKeys) : getLanguageModel(undefined, userKeys);
    const isMoonshot = modelId?.startsWith("kimi-");

    const result = await streamText({
      model,
      system: SUMMARIZE_PROMPT,
      messages: [{ role: "user", content: `Summarize these meeting notes:\n\n${notes}` }],
      temperature: isMoonshot ? 1 : 0.5,
      maxTokens: 2000,
    });

    return new Response(result.textStream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Summarize API Error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to summarize meeting notes",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
