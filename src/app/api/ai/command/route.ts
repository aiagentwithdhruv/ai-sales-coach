/**
 * AI Sales Command API
 *
 * POST /api/ai/command
 *
 * The dashboard's AI assistant endpoint. Takes natural language commands
 * and returns actionable responses with suggested next steps.
 *
 * Unlike /api/ai/chat (practice persona), this endpoint acts as a
 * sales operations assistant that understands CRM data, ICP, and
 * can trigger agent actions.
 */

import { streamText } from "ai";
import { getLanguageModel } from "@/lib/ai/providers";
import { resolveUserKeys } from "@/lib/ai/key-resolver";
import { checkUsage, incrementUsage } from "@/lib/usage";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const maxDuration = 60;

const getAdmin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

function buildSystemPrompt(userMeta: Record<string, unknown>, contactCount: number): string {
  return `You are the AI Sales Assistant for QuotaHit — an autonomous AI sales department.
You help the user manage their sales operations, find leads, plan outreach, and close deals.

## User Context
- Product: ${userMeta.product_description || "Not configured yet"}
- Target Customer: ${userMeta.target_customer || "Not configured yet"}
- Website: ${userMeta.website_url || "Not set"}
- Industry: ${userMeta.industry || "Not specified"}
- Channels: ${(userMeta.preferred_channels as string[])?.join(", ") || "Email"}
- Contacts in CRM: ${contactCount}

## Your Capabilities
You can help with:
1. **Lead Discovery** — Finding new leads matching their ICP
2. **Outreach Strategy** — Drafting emails, call scripts, LinkedIn messages
3. **Pipeline Management** — Analyzing deals, suggesting next steps
4. **Campaign Planning** — Setting up calling campaigns, email sequences
5. **Sales Coaching** — Objection handling, pitch improvement
6. **Data Analysis** — CRM insights, conversion rates, pipeline health

## Response Format
- Be concise and action-oriented
- When suggesting actions, format them as clear next steps
- If the user wants to find leads, tell them to use the Scout AI or CRM import
- If the user wants to start calling, guide them to the AI Calling page
- End responses with 1-3 suggested next actions in this format:

**Suggested Actions:**
- [Action description](/dashboard/relevant-page) — Brief explanation`;
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabase = getAdmin();
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check usage
    const usageCheck = await checkUsage(user.id, "coaching_sessions");
    if (!usageCheck.allowed) {
      return new Response(
        JSON.stringify({ error: usageCheck.error, code: "USAGE_LIMIT_REACHED" }),
        { status: 402, headers: { "Content-Type": "application/json" } }
      );
    }

    const { messages } = (await req.json()) as {
      messages: Array<{ role: "user" | "assistant"; content: string }>;
    };

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "Messages array is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get user context for the system prompt
    const meta = user.user_metadata || {};
    const { count } = await supabase
      .from("contacts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    const systemPrompt = buildSystemPrompt(meta, count || 0);

    // Resolve API keys and stream
    const userKeys = await resolveUserKeys(user.id);
    const model = getLanguageModel(undefined, userKeys);

    await incrementUsage(user.id, "coaching_sessions");

    const result = await streamText({
      model,
      system: systemPrompt,
      messages,
      temperature: 0.7,
      maxTokens: 800,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Command API Error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to process command",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
