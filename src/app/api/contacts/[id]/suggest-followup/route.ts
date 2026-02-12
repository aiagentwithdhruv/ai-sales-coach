import { NextRequest } from "next/server";
import { authenticateUser, getContact } from "@/lib/crm/contacts";
import { getActivities } from "@/lib/crm/activities";
import { checkUsage, incrementUsage } from "@/lib/usage";
import { resolveUserKeys } from "@/lib/ai/key-resolver";
import { STAGE_CONFIG } from "@/types/crm";

const jsonHeaders = { "Content-Type": "application/json" };

// GET /api/contacts/:id/suggest-followup — AI follow-up suggestion
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Authenticate user
  const auth = await authenticateUser(req.headers.get("authorization"));
  if ("error" in auth) {
    return new Response(JSON.stringify({ error: auth.error }), {
      status: auth.status,
      headers: jsonHeaders,
    });
  }

  // Check usage
  const usageCheck = await checkUsage(auth.userId, "analyses_run");
  if (!usageCheck.allowed) {
    return new Response(
      JSON.stringify({
        error: usageCheck.error,
        code: "USAGE_LIMIT_REACHED",
      }),
      { status: 402, headers: jsonHeaders }
    );
  }

  const { id } = await params;
  const contact = await getContact(auth.userId, id);
  if (!contact) {
    return new Response(
      JSON.stringify({ error: "Contact not found" }),
      { status: 404, headers: jsonHeaders }
    );
  }

  const { activities } = await getActivities(id, { limit: 5 });

  // Build context
  const daysSinceContact = contact.last_contacted_at
    ? Math.floor(
        (Date.now() - new Date(contact.last_contacted_at).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : null;

  const stageLabel = STAGE_CONFIG[contact.deal_stage]?.label || contact.deal_stage;
  const enrichment = contact.enrichment_data || {};
  const painPoints = enrichment.pain_points?.join(", ") || "unknown";
  const recentActivity = activities
    .slice(0, 3)
    .map((a) => `${a.type}: ${a.title}`)
    .join("; ");

  const prompt = `You are an AI sales coach. Suggest the best follow-up action for this contact.

Contact: ${contact.first_name} ${contact.last_name || ""} at ${contact.company || "unknown company"}
Title: ${contact.title || "unknown"}
Deal Stage: ${stageLabel}
Deal Value: $${contact.deal_value || 0}
Days Since Last Contact: ${daysSinceContact ?? "never contacted"}
Pain Points: ${painPoints}
Recent Activity: ${recentActivity || "none"}

Return ONLY valid JSON:
{
  "urgency": "high" | "medium" | "low",
  "reason": "Brief reason for follow-up",
  "suggested_action": "What to do",
  "suggested_channel": "email" | "linkedin" | "call",
  "draft_message": "A short draft message (2-3 sentences)"
}`;

  try {
    // Resolve user API keys
    const userKeys = await resolveUserKeys(auth.userId);

    const apiKey = userKeys.openrouter || process.env.OPENROUTER_API_KEY || userKeys.openai || process.env.OPENAI_API_KEY;
    const isOpenRouter = !!(userKeys.openrouter || process.env.OPENROUTER_API_KEY);
    const baseUrl = isOpenRouter
      ? "https://openrouter.ai/api/v1"
      : "https://api.openai.com/v1";
    const model = isOpenRouter ? "moonshotai/kimi-k2.5" : "gpt-4o-mini";

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        ...(isOpenRouter ? { "HTTP-Referer": "https://www.quotahit.com" } : {}),
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.5,
        max_tokens: 500,
      }),
    });

    if (!response.ok) throw new Error(`API returned ${response.status}`);

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Increment usage
    await incrementUsage(auth.userId, "analyses_run");

    let suggestion;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      suggestion = jsonMatch ? JSON.parse(jsonMatch[0]) : { reason: content };
    } catch {
      suggestion = { reason: content, urgency: "medium", suggested_channel: "email" };
    }

    return new Response(JSON.stringify(suggestion), { headers: jsonHeaders });
  } catch (error) {
    console.error("[CRM] Suggest follow-up error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate suggestion" }),
      { status: 500, headers: jsonHeaders }
    );
  }
}
