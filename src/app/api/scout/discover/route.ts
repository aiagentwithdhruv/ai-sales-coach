/**
 * Scout Agent — Discover Leads
 *
 * POST /api/scout/discover
 *
 * Uses AI to generate a batch of lead suggestions based on the user's ICP.
 * Leads are saved to the contacts table with source="scout_ai".
 * Returns the created contacts so the dashboard can show immediate value.
 *
 * Input: { count?: number } (defaults to 10, max 50)
 * The ICP is read from user_metadata automatically.
 */

import { NextRequest } from "next/server";
import { generateText } from "ai";
import { getLanguageModel } from "@/lib/ai/providers";
import { resolveUserKeys } from "@/lib/ai/key-resolver";
import { createContact, authenticateUser } from "@/lib/crm/contacts";
import { checkUsage, incrementUsage } from "@/lib/usage";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const maxDuration = 60;

const json = { "Content-Type": "application/json" };

const getAdmin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

interface GeneratedLead {
  first_name: string;
  last_name: string;
  email?: string;
  company: string;
  title: string;
  notes: string;
}

export async function POST(req: NextRequest) {
  try {
    // Auth
    const auth = await authenticateUser(req.headers.get("authorization"));
    if ("error" in auth) {
      return new Response(JSON.stringify({ error: auth.error }), { status: auth.status, headers: json });
    }

    // Check usage
    const body = await req.json().catch(() => ({}));
    const count = Math.min(Math.max(body.count || 10, 1), 50);

    const usage = await checkUsage(auth.userId, "contacts_created", count);
    if (!usage.allowed) {
      return new Response(JSON.stringify({ error: usage.error }), { status: 402, headers: json });
    }

    // Get user's ICP from metadata
    const supabase = getAdmin();
    const { data: { user } } = await supabase.auth.admin.getUserById(auth.userId);
    if (!user) {
      return new Response(JSON.stringify({ error: "User not found" }), { status: 404, headers: json });
    }

    const meta = user.user_metadata || {};
    const productDescription = meta.product_description;
    const targetCustomer = meta.target_customer;
    const websiteUrl = meta.website_url;
    const industry = meta.industry;
    const companySize = meta.company_size;

    if (!productDescription && !targetCustomer) {
      return new Response(
        JSON.stringify({
          error: "No ICP configured. Complete the setup wizard or update your ICP in settings.",
          redirect: "/dashboard",
        }),
        { status: 400, headers: json }
      );
    }

    // Resolve AI keys (BYOAPI)
    const keys = await resolveUserKeys(auth.userId);

    const prompt = `You are a B2B lead generation expert. Based on the following Ideal Customer Profile, generate ${count} realistic potential leads that would be a great fit.

## Ideal Customer Profile
- **Product/Service:** ${productDescription || "Not specified"}
- **Target Customer:** ${targetCustomer || "Not specified"}
- **Website:** ${websiteUrl || "Not specified"}
- **Industry:** ${industry || "Not specified"}
- **Company Size:** ${companySize || "Not specified"}

## Requirements
- Generate realistic but fictional business contacts (do NOT use real people's names)
- Each lead should have a plausible company name, job title, and first/last name
- Companies should match the industry and size profile
- Include a brief note explaining why each lead is a good ICP match
- If an email format is inferable (e.g., firstname@company.com), include it
- Vary the seniority levels and company types for diversity
- Make the leads feel real and actionable

## Output Format
Return ONLY a valid JSON object with this structure (no markdown, no explanation):
{"leads": [{"first_name": "...", "last_name": "...", "email": "...", "company": "...", "title": "...", "notes": "..."}]}`;

    const model = getLanguageModel(undefined, keys);

    const { text } = await generateText({
      model,
      prompt,
    });

    // Parse JSON from AI response
    let leads: GeneratedLead[] = [];
    try {
      const jsonMatch = text.match(/\{[\s\S]*"leads"[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        leads = parsed.leads || [];
      }
    } catch {
      // If JSON parsing fails, return empty leads
      return new Response(
        JSON.stringify({
          success: true,
          count: 0,
          leads: [],
          message: "Scout AI could not generate leads. Try updating your ICP with more detail.",
        }),
        { headers: json }
      );
    }

    const object = { leads };

    // Save leads to contacts table
    const created = [];
    for (const lead of object.leads) {
      const contact = await createContact(auth.userId, {
        first_name: lead.first_name,
        last_name: lead.last_name,
        email: lead.email || undefined,
        company: lead.company,
        title: lead.title,
        notes: `[Scout AI] ${lead.notes}`,
        source: "scout_ai",
        deal_stage: "new",
        tags: ["scout-generated"],
      });
      if (contact) {
        created.push(contact);
      }
    }

    // Increment usage
    if (created.length > 0) {
      await incrementUsage(auth.userId, "contacts_created", created.length);
    }

    return new Response(
      JSON.stringify({
        success: true,
        count: created.length,
        leads: created,
        message: `Scout AI found ${created.length} leads matching your ICP.`,
      }),
      { headers: json }
    );
  } catch (error) {
    console.error("[Scout] Discover error:", error);
    return new Response(
      JSON.stringify({
        error: "Scout AI encountered an error. Please try again.",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: json }
    );
  }
}
