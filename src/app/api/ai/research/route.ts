/**
 * Research API Route - Perplexity-powered prospect/company research
 * Uses Perplexity Sonar for real-time web search and analysis
 */

import { streamText } from "ai";
import { getPerplexityModel, getModelByIdSmart } from "@/lib/ai/providers";
import { checkCredits, deductCredits } from "@/lib/credits";

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
    const authHeader = req.headers.get("authorization");
    const creditCheck = await checkCredits(authHeader, 1);

    if (!creditCheck.hasCredits) {
      return new Response(
        JSON.stringify({ error: creditCheck.error || "Insufficient credits", code: "INSUFFICIENT_CREDITS" }),
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

    if (creditCheck.userId) {
      const deductResult = await deductCredits(creditCheck.userId, 1);
      if (!deductResult.success) {
        return new Response(
          JSON.stringify({ error: "Failed to deduct credits", code: "CREDIT_DEDUCT_FAILED" }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // Use Perplexity for research (has web search), fallback to regular model
    let model;
    if (process.env.PERPLEXITY_API_KEY) {
      model = getPerplexityModel("sonar-pro");
    } else if (modelId) {
      model = getModelByIdSmart(modelId);
    } else {
      model = getModelByIdSmart("gpt-4.1-mini");
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
