/**
 * Auto-Qualification Agent
 *
 * AI-powered lead qualification using BANT+ framework.
 * Triggered when a lead score exceeds threshold (40+).
 * Evaluates: Budget, Authority, Need, Timeline, Competition.
 *
 * Output: QUALIFIED / NURTURE / DISQUALIFIED + structured BANT scores.
 */

import { inngest } from "../client";
import { createClient } from "@supabase/supabase-js";

const getAdmin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

const QUALIFICATION_SYSTEM_PROMPT = `You are QuotaHit's AI Qualification Agent. Your job is to analyze a lead and determine their qualification status using the BANT+ framework.

Analyze the available data and score each dimension 0-100:
- **Budget**: Can they afford the solution? Look for company size, funding, revenue signals.
- **Authority**: Is this person a decision-maker? Look for title, seniority signals.
- **Need**: Do they have a pain point we solve? Look for industry, tech stack, pain points.
- **Timeline**: How urgent is their need? Look for recent activity, urgency signals.
- **Competition**: Are they already using a competitor? Look for tech stack, existing tools.

Based on the scores, determine:
- QUALIFIED: Average BANT score >= 60 AND at least 3 dimensions >= 50
- NURTURE: Average BANT score 30-59 OR only 1-2 dimensions >= 50
- DISQUALIFIED: Average BANT score < 30 OR critical disqualifiers (do_not_contact, invalid data)

Return ONLY valid JSON:
{
  "outcome": "qualified" | "nurture" | "disqualified",
  "budget": <0-100>,
  "authority": <0-100>,
  "need": <0-100>,
  "timeline": <0-100>,
  "competition": <0-100>,
  "notes": "<1-2 sentence qualification summary>",
  "recommended_action": "<next step recommendation>"
}`;

// ─── Qualify Lead Function ──────────────────────────────────────────────────

export const qualifyLead = inngest.createFunction(
  {
    id: "qualify-lead",
    retries: 2,
    concurrency: {
      limit: 5, // Max 5 concurrent qualification calls
    },
  },
  { event: "lead/scored" },
  async ({ event, step }) => {
    const { contactId, userId, score } = event.data;

    // Only qualify leads scoring 40+
    if (score < 40) {
      return { skipped: true, reason: `Score ${score} below qualification threshold` };
    }

    // Step 1: Fetch full contact data
    const contact = await step.run("fetch-contact-for-qualification", async () => {
      const supabase = getAdmin();
      const { data } = await supabase
        .from("contacts")
        .select("*")
        .eq("id", contactId)
        .eq("user_id", userId)
        .single();
      return data;
    });

    if (!contact) return { skipped: true, reason: "Contact not found" };

    // Skip if already qualified
    const customFields = (contact.custom_fields || {}) as Record<string, unknown>;
    if (customFields.qualification_status === "qualified") {
      return { skipped: true, reason: "Already qualified" };
    }

    // Step 2: Build context for AI qualification
    const contactContext = buildContactContext(contact);

    // Step 3: Call AI for qualification
    const qualification = await step.run("ai-qualify", async () => {
      const apiKey = process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY;
      const isAnthropic = !!process.env.ANTHROPIC_API_KEY;

      if (!apiKey) {
        // Fallback: rule-based qualification
        return ruleBasedQualification(contact, score);
      }

      try {
        if (isAnthropic) {
          return await qualifyWithAnthropic(apiKey, contactContext);
        } else {
          return await qualifyWithOpenAI(apiKey, contactContext);
        }
      } catch {
        // Fallback to rule-based if API fails
        return ruleBasedQualification(contact, score);
      }
    });

    // Step 4: Update contact with qualification data
    await step.run("update-qualification", async () => {
      const supabase = getAdmin();
      await supabase
        .from("contacts")
        .update({
          custom_fields: {
            ...customFields,
            qualification_status: qualification.outcome,
            qualification_bant: {
              budget: qualification.budget,
              authority: qualification.authority,
              need: qualification.need,
              timeline: qualification.timeline,
              competition: qualification.competition,
            },
            qualification_notes: qualification.notes,
            qualification_recommended_action: qualification.recommended_action,
            qualified_at: new Date().toISOString(),
          },
          // Auto-advance stage if qualified
          ...(qualification.outcome === "qualified" &&
            contact.deal_stage === "lead" && { deal_stage: "qualified" }),
        })
        .eq("id", contactId)
        .eq("user_id", userId);
    });

    // Step 5: Log activity
    await step.run("log-qualification", async () => {
      const supabase = getAdmin();
      await supabase.from("activities").insert({
        user_id: userId,
        contact_id: contactId,
        activity_type: "qualification",
        details: {
          outcome: qualification.outcome,
          bant: {
            budget: qualification.budget,
            authority: qualification.authority,
            need: qualification.need,
            timeline: qualification.timeline,
            competition: qualification.competition,
          },
          notes: qualification.notes,
          source: "inngest_auto",
        },
      });
    });

    // Step 6: Emit qualified event for routing
    if (qualification.outcome === "qualified") {
      await step.sendEvent("emit-qualified", {
        name: "lead/qualified",
        data: {
          contactId,
          userId,
          outcome: qualification.outcome,
          bant: {
            budget: qualification.budget,
            authority: qualification.authority,
            need: qualification.need,
            timeline: qualification.timeline,
            competition: qualification.competition,
          },
          notes: qualification.notes,
        },
      });
    }

    return {
      contactId,
      outcome: qualification.outcome,
      bant: {
        budget: qualification.budget,
        authority: qualification.authority,
        need: qualification.need,
        timeline: qualification.timeline,
        competition: qualification.competition,
      },
    };
  }
);

// ─── Helpers ────────────────────────────────────────────────────────────────

function buildContactContext(contact: Record<string, unknown>): string {
  const enrichment = (contact.enrichment_data || {}) as Record<string, unknown>;
  const parts: string[] = [];

  parts.push(`Name: ${contact.first_name} ${contact.last_name || ""}`);
  if (contact.email) parts.push(`Email: ${contact.email}`);
  if (contact.company) parts.push(`Company: ${contact.company}`);
  if (contact.title) parts.push(`Title: ${contact.title}`);
  if (contact.phone) parts.push(`Phone: ${contact.phone}`);
  if (contact.deal_value) parts.push(`Deal Value: $${contact.deal_value}`);
  if (contact.deal_stage) parts.push(`Current Stage: ${contact.deal_stage}`);
  if (contact.lead_score) parts.push(`Lead Score: ${contact.lead_score}/100`);
  if (contact.source) parts.push(`Source: ${contact.source}`);
  if (contact.tags) parts.push(`Tags: ${(contact.tags as string[]).join(", ")}`);

  if (enrichment.company_overview) parts.push(`Company Overview: ${enrichment.company_overview}`);
  if (enrichment.industry) parts.push(`Industry: ${enrichment.industry}`);
  if (enrichment.company_size) parts.push(`Company Size: ${enrichment.company_size}`);
  if (enrichment.funding) parts.push(`Funding: ${enrichment.funding}`);
  if (enrichment.tech_stack) parts.push(`Tech Stack: ${(enrichment.tech_stack as string[]).join(", ")}`);
  if (enrichment.pain_points) parts.push(`Pain Points: ${(enrichment.pain_points as string[]).join("; ")}`);
  if (enrichment.recent_news) parts.push(`Recent News: ${(enrichment.recent_news as string[]).join("; ")}`);

  if (contact.do_not_call) parts.push("FLAG: Do Not Call");
  if (contact.do_not_email) parts.push("FLAG: Do Not Email");

  return parts.join("\n");
}

async function qualifyWithAnthropic(
  apiKey: string,
  context: string
): Promise<QualificationResult> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 500,
      system: QUALIFICATION_SYSTEM_PROMPT,
      messages: [{ role: "user", content: `Qualify this lead:\n\n${context}` }],
    }),
  });

  if (!res.ok) throw new Error(`Anthropic API error: ${res.status}`);
  const data = await res.json();
  const text = data.content?.[0]?.text || "";
  return parseQualificationResponse(text);
}

async function qualifyWithOpenAI(
  apiKey: string,
  context: string
): Promise<QualificationResult> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: QUALIFICATION_SYSTEM_PROMPT },
        { role: "user", content: `Qualify this lead:\n\n${context}` },
      ],
      temperature: 0.3,
      max_tokens: 500,
    }),
  });

  if (!res.ok) throw new Error(`OpenAI API error: ${res.status}`);
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content || "";
  return parseQualificationResponse(text);
}

interface QualificationResult {
  outcome: "qualified" | "nurture" | "disqualified";
  budget: number;
  authority: number;
  need: number;
  timeline: number;
  competition: number;
  notes: string;
  recommended_action: string;
}

function parseQualificationResponse(text: string): QualificationResult {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        outcome: parsed.outcome || "nurture",
        budget: Math.min(100, Math.max(0, parsed.budget || 0)),
        authority: Math.min(100, Math.max(0, parsed.authority || 0)),
        need: Math.min(100, Math.max(0, parsed.need || 0)),
        timeline: Math.min(100, Math.max(0, parsed.timeline || 0)),
        competition: Math.min(100, Math.max(0, parsed.competition || 0)),
        notes: parsed.notes || "",
        recommended_action: parsed.recommended_action || "",
      };
    }
  } catch {
    // Fall through to default
  }

  return {
    outcome: "nurture",
    budget: 50,
    authority: 50,
    need: 50,
    timeline: 50,
    competition: 50,
    notes: "Could not parse AI response, defaulting to nurture",
    recommended_action: "Manual review recommended",
  };
}

function ruleBasedQualification(
  contact: Record<string, unknown>,
  score: number
): QualificationResult {
  const enrichment = (contact.enrichment_data || {}) as Record<string, unknown>;

  // Budget: based on company size, deal value, funding
  let budget = 30;
  if (contact.deal_value && (contact.deal_value as number) > 5000) budget += 30;
  if (enrichment.funding && enrichment.funding !== "Unknown") budget += 20;
  if (enrichment.company_size) budget += 10;

  // Authority: based on title
  let authority = 30;
  const title = ((contact.title as string) || "").toLowerCase();
  if (title.includes("ceo") || title.includes("founder") || title.includes("owner")) authority = 90;
  else if (title.includes("vp") || title.includes("director") || title.includes("head")) authority = 75;
  else if (title.includes("manager")) authority = 55;

  // Need: based on enrichment pain points
  let need = 40;
  if (enrichment.pain_points && (enrichment.pain_points as string[]).length > 0) need += 30;
  if (contact.deal_stage === "contacted" || contact.deal_stage === "qualified") need += 15;

  // Timeline: based on activity recency
  let timeline = 35;
  if (contact.last_contacted_at) {
    const daysSince = (Date.now() - new Date(contact.last_contacted_at as string).getTime()) / 86400000;
    if (daysSince < 7) timeline += 35;
    else if (daysSince < 30) timeline += 15;
  }

  // Competition: based on tech stack
  let competition = 50; // neutral
  if (enrichment.tech_stack) {
    const stack = (enrichment.tech_stack as string[]).map((s) => s.toLowerCase());
    if (stack.some((s) => s.includes("salesforce") || s.includes("hubspot"))) competition = 30;
  }

  budget = Math.min(100, budget);
  authority = Math.min(100, authority);
  need = Math.min(100, need);
  timeline = Math.min(100, timeline);
  competition = Math.min(100, competition);

  const avg = (budget + authority + need + timeline + competition) / 5;
  const above50 = [budget, authority, need, timeline, competition].filter((s) => s >= 50).length;

  let outcome: "qualified" | "nurture" | "disqualified";
  if (avg >= 60 && above50 >= 3) outcome = "qualified";
  else if (avg < 30) outcome = "disqualified";
  else outcome = "nurture";

  return {
    outcome,
    budget,
    authority,
    need,
    timeline,
    competition,
    notes: `Rule-based qualification. Score: ${score}. Average BANT: ${Math.round(avg)}.`,
    recommended_action:
      outcome === "qualified"
        ? "Route to outreach sequence"
        : outcome === "nurture"
          ? "Add to nurture campaign"
          : "Archive or deprioritize",
  };
}
