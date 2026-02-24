/**
 * Item 25: Voice-to-Structured-Data
 *
 * Speak meeting notes → AI extracts structured data:
 *   - BANT scores
 *   - Sentiment analysis
 *   - Key objections
 *   - Next steps
 *   - Contact info updates
 *   - Deal value estimates
 *
 * Use cases:
 *   - After a sales call: dictate notes → auto-updates CRM
 *   - During a meeting: real-time transcription → structured output
 *   - Post-meeting: upload recording → extract everything
 */

import { createClient } from "@supabase/supabase-js";

const getAdmin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

// ─── Types ──────────────────────────────────────────────────────────────────

export interface StructuredMeetingData {
  summary: string;
  sentiment: "positive" | "neutral" | "negative";
  bant: {
    budget: { score: number; notes: string };
    authority: { score: number; notes: string };
    need: { score: number; notes: string };
    timeline: { score: number; notes: string };
  };
  objections: string[];
  nextSteps: string[];
  actionItems: Array<{
    task: string;
    owner: "us" | "them";
    dueDate?: string;
  }>;
  dealInsights: {
    estimatedValue?: number;
    probability?: number;
    competitorsMentioned?: string[];
    decisionMakers?: string[];
  };
  contactUpdates: {
    title?: string;
    phone?: string;
    email?: string;
    company?: string;
    otherFields?: Record<string, string>;
  };
  tags: string[];
}

// ─── Extract Structured Data from Text ──────────────────────────────────────

export async function extractStructuredData(
  text: string,
  context?: {
    contactName?: string;
    company?: string;
    existingNotes?: string;
  }
): Promise<StructuredMeetingData> {
  const apiKey = process.env.ANTHROPIC_API_KEY || process.env.OPENROUTER_API_KEY;
  const isAnthropic = !!process.env.ANTHROPIC_API_KEY;

  const systemPrompt = `You are a sales meeting analysis AI. Extract structured data from meeting notes or call transcripts.

${context ? `Context: Meeting with ${context.contactName || "unknown"} from ${context.company || "unknown company"}.` : ""}
${context?.existingNotes ? `Previous notes: ${context.existingNotes}` : ""}

Extract and return JSON:
{
  "summary": "2-3 sentence summary",
  "sentiment": "positive" | "neutral" | "negative",
  "bant": {
    "budget": { "score": 0-100, "notes": "what was discussed" },
    "authority": { "score": 0-100, "notes": "..." },
    "need": { "score": 0-100, "notes": "..." },
    "timeline": { "score": 0-100, "notes": "..." }
  },
  "objections": ["list of objections raised"],
  "nextSteps": ["list of agreed next steps"],
  "actionItems": [{ "task": "...", "owner": "us"|"them", "dueDate": "YYYY-MM-DD or null" }],
  "dealInsights": {
    "estimatedValue": number or null,
    "probability": 0-100 or null,
    "competitorsMentioned": [],
    "decisionMakers": []
  },
  "contactUpdates": {
    "title": "if mentioned",
    "phone": "if mentioned",
    "email": "if mentioned"
  },
  "tags": ["relevant tags like 'hot-lead', 'needs-follow-up', 'technical-buyer']
}

Be accurate. Only include what was actually discussed. Score 0 for BANT dimensions not mentioned.
Return ONLY valid JSON.`;

  const url = isAnthropic
    ? "https://api.anthropic.com/v1/messages"
    : "https://openrouter.ai/api/v1/chat/completions";

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  let body: string;

  if (isAnthropic) {
    headers["x-api-key"] = apiKey!;
    headers["anthropic-version"] = "2023-06-01";
    body = JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1500,
      system: systemPrompt,
      messages: [{ role: "user", content: text }],
    });
  } else {
    headers["Authorization"] = `Bearer ${apiKey}`;
    body = JSON.stringify({
      model: "anthropic/claude-haiku-4-5-20251001",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: text },
      ],
      max_tokens: 1500,
    });
  }

  try {
    const response = await fetch(url, { method: "POST", headers, body });
    const data = await response.json();
    const content = isAnthropic
      ? data.content?.[0]?.text
      : data.choices?.[0]?.message?.content;

    return JSON.parse(content || "{}") as StructuredMeetingData;
  } catch {
    return {
      summary: "Failed to extract structured data from the provided text.",
      sentiment: "neutral",
      bant: {
        budget: { score: 0, notes: "" },
        authority: { score: 0, notes: "" },
        need: { score: 0, notes: "" },
        timeline: { score: 0, notes: "" },
      },
      objections: [],
      nextSteps: [],
      actionItems: [],
      dealInsights: {},
      contactUpdates: {},
      tags: [],
    };
  }
}

// ─── Process and Save to CRM ────────────────────────────────────────────────

export async function processVoiceNotes(
  userId: string,
  contactId: string,
  transcribedText: string
): Promise<{
  structured: StructuredMeetingData;
  saved: boolean;
  updates: string[];
}> {
  const supabase = getAdmin();

  // Get existing contact info for context
  const { data: contact } = await supabase
    .from("contacts")
    .select("first_name, last_name, company, notes, custom_fields")
    .eq("id", contactId)
    .eq("user_id", userId)
    .single();

  // Extract structured data
  const structured = await extractStructuredData(transcribedText, {
    contactName: contact ? `${contact.first_name} ${contact.last_name}` : undefined,
    company: contact?.company,
    existingNotes: contact?.notes as string | undefined,
  });

  const updates: string[] = [];

  // Apply updates to contact
  const contactUpdates: Record<string, unknown> = {};

  // Update BANT-based lead score
  const bantAvg = (
    structured.bant.budget.score +
    structured.bant.authority.score +
    structured.bant.need.score +
    structured.bant.timeline.score
  ) / 4;

  if (bantAvg > 0) {
    contactUpdates.lead_score = Math.round(bantAvg);
    updates.push(`Lead score updated to ${Math.round(bantAvg)}`);
  }

  // Update deal value
  if (structured.dealInsights.estimatedValue) {
    contactUpdates.deal_value = structured.dealInsights.estimatedValue;
    updates.push(`Deal value set to $${structured.dealInsights.estimatedValue}`);
  }

  // Update tags
  if (structured.tags.length > 0) {
    const existingTags = (contact?.custom_fields as Record<string, string[]>)?.tags || [];
    contactUpdates.tags = [...new Set([...existingTags, ...structured.tags])];
    updates.push(`Tags added: ${structured.tags.join(", ")}`);
  }

  // Apply contact info updates
  if (structured.contactUpdates.title) {
    const cf = (contact?.custom_fields || {}) as Record<string, unknown>;
    contactUpdates.custom_fields = { ...cf, title: structured.contactUpdates.title };
    updates.push(`Title updated to ${structured.contactUpdates.title}`);
  }

  if (Object.keys(contactUpdates).length > 0) {
    await supabase
      .from("contacts")
      .update(contactUpdates)
      .eq("id", contactId)
      .eq("user_id", userId);
  }

  // Save structured meeting notes as activity
  await supabase.from("activities").insert({
    user_id: userId,
    contact_id: contactId,
    activity_type: "voice_notes_processed",
    details: {
      raw_text: transcribedText,
      structured,
      updates_applied: updates,
    },
  });

  // Create action items as tasks (via activities)
  for (const item of structured.actionItems) {
    if (item.owner === "us") {
      await supabase.from("activities").insert({
        user_id: userId,
        contact_id: contactId,
        activity_type: "task_created",
        details: {
          task: item.task,
          due_date: item.dueDate,
          source: "voice_notes",
        },
      });
      updates.push(`Task created: ${item.task}`);
    }
  }

  return { structured, saved: true, updates };
}
