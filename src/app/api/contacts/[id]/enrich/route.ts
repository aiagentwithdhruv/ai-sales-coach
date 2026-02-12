import { NextRequest } from "next/server";
import { authenticateUser, getContact, updateContact } from "@/lib/crm/contacts";
import { logActivity } from "@/lib/crm/activities";
import { checkUsage, incrementUsage } from "@/lib/usage";
import { resolveUserKeys } from "@/lib/ai/key-resolver";

const jsonHeaders = { "Content-Type": "application/json" };

const ENRICH_PROMPT = `You are a sales intelligence researcher. Given a person and company, research and return a JSON object with the following fields. Be concise and factual. If you can't find information for a field, use null.

Return ONLY valid JSON, no markdown fences:
{
  "company_overview": "1-2 sentence company description",
  "industry": "Industry category",
  "company_size": "Approximate employee count or range",
  "website": "Company website URL",
  "linkedin_url": "Company LinkedIn URL if findable",
  "funding": "Latest funding info or 'Unknown'",
  "recent_news": ["Recent news item 1", "Recent news item 2"],
  "pain_points": ["Likely pain point 1", "Likely pain point 2", "Likely pain point 3"],
  "tech_stack": ["Technology 1", "Technology 2"],
  "conversation_starters": ["Opener 1", "Opener 2", "Opener 3"],
  "key_people": [{"name": "Name", "title": "Title", "insight": "Brief insight"}]
}`;

// POST /api/contacts/:id/enrich — AI-enrich a contact
export async function POST(
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

  // Mark as enriching
  await updateContact(auth.userId, id, { enrichment_status: "enriching" });

  // Build research query
  const personInfo = [
    contact.first_name,
    contact.last_name,
    contact.title ? `(${contact.title})` : "",
  ]
    .filter(Boolean)
    .join(" ");

  const companyInfo = contact.company || "unknown company";
  const query = `${personInfo} at ${companyInfo}${contact.email ? ` (${contact.email})` : ""}`;

  try {
    // Resolve user API keys
    const userKeys = await resolveUserKeys(auth.userId);

    // Use OpenRouter/Perplexity for research
    const apiKey =
      process.env.PERPLEXITY_API_KEY || userKeys.openrouter || process.env.OPENROUTER_API_KEY;
    const isPerplexity = !!process.env.PERPLEXITY_API_KEY;

    const baseUrl = isPerplexity
      ? "https://api.perplexity.ai"
      : "https://openrouter.ai/api/v1";
    const model = isPerplexity
      ? "sonar"
      : "perplexity/sonar";

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        ...(isPerplexity ? {} : { "HTTP-Referer": "https://www.quotahit.com" }),
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: ENRICH_PROMPT },
          {
            role: "user",
            content: `Research this sales prospect: ${query}`,
          },
        ],
        temperature: 0.3,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Parse JSON from response
    let enrichmentData;
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      enrichmentData = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    } catch {
      enrichmentData = { company_overview: content };
    }

    // Increment usage
    await incrementUsage(auth.userId, "analyses_run");

    // Update contact with enrichment data
    const updated = await updateContact(auth.userId, id, {
      enrichment_data: enrichmentData,
      enrichment_status: "enriched",
      enriched_at: new Date().toISOString(),
    });

    // Log activity
    await logActivity(
      auth.userId,
      id,
      "enrichment",
      "AI enrichment completed",
      `Researched ${companyInfo}`,
      { fields_found: Object.keys(enrichmentData).length }
    );

    return new Response(JSON.stringify(updated), { headers: jsonHeaders });
  } catch (error) {
    console.error("[CRM] Enrichment error:", error);

    await updateContact(auth.userId, id, { enrichment_status: "failed" });

    return new Response(
      JSON.stringify({
        error: "Enrichment failed",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: jsonHeaders }
    );
  }
}
