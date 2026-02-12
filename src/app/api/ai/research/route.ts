/**
 * Research API Route - Perplexity-powered prospect/company research
 * Uses Perplexity Sonar for real-time web search and analysis
 * Includes usage tracking and BYOAPI key resolution.
 */

import { streamText } from "ai";
import { getPerplexityModel, getModelByIdSmart } from "@/lib/ai/providers";
import { checkUsage, incrementUsage } from "@/lib/usage";
import { resolveUserKeys } from "@/lib/ai/key-resolver";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const maxDuration = 30;

const RESEARCH_PROMPT = `You are a sales intelligence analyst. Research the given company or prospect and provide actionable intelligence for a sales conversation.

FORMAT YOUR RESPONSE EXACTLY LIKE THIS:

## Company Overview
Brief overview of the company, what they do, size, and market position.

## Key People
| Name | Title | LinkedIn-worthy insight |
|------|-------|------------------------|
| [Name] | [Title] | [Something useful for outreach] |

## Recent News & Events
- [Recent development and what it means for sales approach]
- [Another key event]
- [Industry trend affecting them]

## Likely Pain Points
1. **[Pain point]**: Why this matters and how to bring it up
2. **[Pain point]**: Why this matters and how to bring it up
3. **[Pain point]**: Why this matters and how to bring it up

## Technology Stack (if applicable)
What tools/platforms they likely use and competitive implications.

## Conversation Starters
3 specific, personalized opening lines based on your research:
1. "[Opener referencing recent news]"
2. "[Opener referencing a pain point]"
3. "[Opener referencing an achievement]"

## Competitive Landscape
Who else is likely selling to them and how to differentiate.

Be specific and factual. Use real, current information.`;

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
    const { query, model: modelId }: { query: string; model?: string } = body;

    if (!query) {
      return new Response(
        JSON.stringify({ error: "Research query is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Increment usage and resolve user API keys
    await incrementUsage(userId, "analyses_run");
    const userKeys = await resolveUserKeys(userId);

    // Use Perplexity for research (has web search), fallback to regular model
    let model;
    if (process.env.PERPLEXITY_API_KEY) {
      model = getPerplexityModel("sonar-pro");
    } else if (modelId) {
      model = getModelByIdSmart(modelId, userKeys);
    } else {
      model = getModelByIdSmart("gpt-4.1-mini", userKeys);
    }

    const result = await streamText({
      model,
      system: RESEARCH_PROMPT,
      messages: [{ role: "user", content: `Research this for an upcoming sales conversation:\n\n${query}` }],
      temperature: 0.5,
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
    console.error("Research API Error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to process research request",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
