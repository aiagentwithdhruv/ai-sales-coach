/**
 * Item 17: Voice Commands Engine — Level 3
 *
 * Natural language voice → CRM actions.
 * Three levels:
 *   L1: Transcription (voice → text) — Web Speech API / Deepgram fallback
 *   L2: Intent parsing (AI interprets → structured action)
 *   L3: Orchestration (voice → multi-step agent chain)
 *
 * Example commands:
 *   "Add a contact named John Doe from Acme Corp"
 *   "Move the deal with Sarah to negotiation"
 *   "Send a follow-up email to all qualified leads"
 *   "Start the outreach sequence for leads scoring above 70"
 *   "Show me today's pipeline summary"
 *
 * Safety: Destructive actions require confirmation before execution.
 */

import { createClient } from "@supabase/supabase-js";

const getAdmin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

// ─── Types ──────────────────────────────────────────────────────────────────

export interface VoiceIntent {
  action: string;
  entity: string;
  params: Record<string, unknown>;
  confidence: number;
  requiresConfirmation: boolean;
  originalText: string;
}

export interface VoiceCommandResult {
  success: boolean;
  action: string;
  message: string; // Human-readable response
  data?: unknown;
  requiresConfirmation?: boolean;
  confirmationPrompt?: string;
}

// Actions that need user confirmation before executing
const DESTRUCTIVE_ACTIONS = [
  "delete_contact",
  "delete_deal",
  "send_bulk_email",
  "start_campaign",
  "mark_as_lost",
  "unsubscribe",
];

// ─── Intent Parser (L2) ────────────────────────────────────────────────────

export async function parseVoiceIntent(
  text: string,
  userId: string
): Promise<VoiceIntent> {
  // Use LLM to parse natural language into structured intent
  const apiKey = process.env.ANTHROPIC_API_KEY || process.env.OPENROUTER_API_KEY;
  const isAnthropic = !!process.env.ANTHROPIC_API_KEY;

  const systemPrompt = `You are a CRM voice command parser. Parse the user's spoken command into a structured action.

Available actions:
- create_contact: Create a new contact (params: first_name, last_name, email, phone, company)
- update_contact: Update contact fields (params: contact_query, field, value)
- move_deal: Move a deal to a new stage (params: contact_query, stage)
- send_email: Send an email to a contact (params: contact_query, subject, body)
- send_followup: Send follow-up to a contact (params: contact_query, channel)
- start_sequence: Start outreach sequence (params: contact_query, sequence_type)
- start_campaign: Start calling campaign (params: filter_query)
- schedule_call: Schedule a call (params: contact_query, time)
- search_contacts: Search contacts (params: query, filters)
- get_pipeline: Get pipeline summary (params: filter)
- get_stats: Get performance stats (params: period)
- mark_as_won: Mark deal as won (params: contact_query, deal_value)
- mark_as_lost: Mark deal as lost (params: contact_query, reason)
- add_note: Add a note to a contact (params: contact_query, note)
- add_tag: Add a tag to a contact (params: contact_query, tag)
- delete_contact: Delete a contact (params: contact_query)

Return JSON with: { action, entity, params, confidence (0-1) }
Return ONLY valid JSON.`;

  const url = isAnthropic
    ? "https://api.anthropic.com/v1/messages"
    : "https://openrouter.ai/api/v1/chat/completions";

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  let body: string;

  if (isAnthropic) {
    headers["x-api-key"] = apiKey!;
    headers["anthropic-version"] = "2023-06-01";
    body = JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
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
      max_tokens: 300,
      temperature: 0.1,
    });
  }

  const response = await fetch(url, { method: "POST", headers, body });
  const data = await response.json();

  const content = isAnthropic
    ? data.content?.[0]?.text
    : data.choices?.[0]?.message?.content;

  try {
    const parsed = JSON.parse(content || "{}");
    return {
      action: parsed.action || "unknown",
      entity: parsed.entity || "contact",
      params: parsed.params || {},
      confidence: parsed.confidence || 0.5,
      requiresConfirmation: DESTRUCTIVE_ACTIONS.includes(parsed.action),
      originalText: text,
    };
  } catch {
    return {
      action: "unknown",
      entity: "unknown",
      params: {},
      confidence: 0,
      requiresConfirmation: false,
      originalText: text,
    };
  }
}

// ─── Command Executor (L3) ──────────────────────────────────────────────────

export async function executeVoiceCommand(
  intent: VoiceIntent,
  userId: string,
  confirmed = false
): Promise<VoiceCommandResult> {
  // Safety check for destructive actions
  if (intent.requiresConfirmation && !confirmed) {
    return {
      success: false,
      action: intent.action,
      message: `This action requires confirmation.`,
      requiresConfirmation: true,
      confirmationPrompt: getConfirmationPrompt(intent),
    };
  }

  const supabase = getAdmin();

  switch (intent.action) {
    case "create_contact": {
      const p = intent.params;
      const { data, error } = await supabase
        .from("contacts")
        .insert({
          user_id: userId,
          first_name: p.first_name as string || "",
          last_name: p.last_name as string || "",
          email: p.email as string || null,
          phone: p.phone as string || null,
          company: p.company as string || null,
          source: "voice_command",
          deal_stage: "lead",
        })
        .select("id, first_name, last_name")
        .single();

      if (error) {
        return { success: false, action: intent.action, message: `Failed to create contact: ${error.message}` };
      }
      return {
        success: true,
        action: intent.action,
        message: `Created contact ${data.first_name} ${data.last_name}.`,
        data,
      };
    }

    case "move_deal": {
      const query = intent.params.contact_query as string;
      const stage = intent.params.stage as string;

      const contact = await findContact(userId, query);
      if (!contact) {
        return { success: false, action: intent.action, message: `Could not find contact matching "${query}".` };
      }

      await supabase
        .from("contacts")
        .update({ deal_stage: stage })
        .eq("id", contact.id)
        .eq("user_id", userId);

      return {
        success: true,
        action: intent.action,
        message: `Moved ${contact.first_name} ${contact.last_name} to ${stage} stage.`,
        data: { contactId: contact.id, newStage: stage },
      };
    }

    case "add_note": {
      const query = intent.params.contact_query as string;
      const note = intent.params.note as string;

      const contact = await findContact(userId, query);
      if (!contact) {
        return { success: false, action: intent.action, message: `Could not find contact matching "${query}".` };
      }

      await supabase.from("activities").insert({
        user_id: userId,
        contact_id: contact.id,
        activity_type: "note_added",
        details: { note, source: "voice_command" },
      });

      return {
        success: true,
        action: intent.action,
        message: `Added note to ${contact.first_name} ${contact.last_name}.`,
      };
    }

    case "add_tag": {
      const query = intent.params.contact_query as string;
      const tag = intent.params.tag as string;

      const contact = await findContact(userId, query);
      if (!contact) {
        return { success: false, action: intent.action, message: `Could not find contact matching "${query}".` };
      }

      const currentTags = contact.tags || [];
      if (!currentTags.includes(tag)) {
        currentTags.push(tag);
      }

      await supabase
        .from("contacts")
        .update({ tags: currentTags })
        .eq("id", contact.id)
        .eq("user_id", userId);

      return {
        success: true,
        action: intent.action,
        message: `Added tag "${tag}" to ${contact.first_name} ${contact.last_name}.`,
      };
    }

    case "mark_as_won": {
      const query = intent.params.contact_query as string;
      const dealValue = intent.params.deal_value as number || 0;

      const contact = await findContact(userId, query);
      if (!contact) {
        return { success: false, action: intent.action, message: `Could not find contact matching "${query}".` };
      }

      await supabase
        .from("contacts")
        .update({ deal_stage: "won", deal_value: dealValue })
        .eq("id", contact.id)
        .eq("user_id", userId);

      return {
        success: true,
        action: intent.action,
        message: `Marked ${contact.first_name} ${contact.last_name} as won${dealValue ? ` ($${dealValue})` : ""}.`,
        data: { contactId: contact.id, dealValue },
      };
    }

    case "mark_as_lost": {
      const query = intent.params.contact_query as string;
      const reason = intent.params.reason as string || "";

      const contact = await findContact(userId, query);
      if (!contact) {
        return { success: false, action: intent.action, message: `Could not find contact matching "${query}".` };
      }

      await supabase
        .from("contacts")
        .update({ deal_stage: "lost" })
        .eq("id", contact.id)
        .eq("user_id", userId);

      return {
        success: true,
        action: intent.action,
        message: `Marked ${contact.first_name} ${contact.last_name} as lost${reason ? ` (${reason})` : ""}.`,
      };
    }

    case "search_contacts": {
      const query = intent.params.query as string || "";
      const { data: contacts } = await supabase
        .from("contacts")
        .select("id, first_name, last_name, company, deal_stage, lead_score")
        .eq("user_id", userId)
        .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,company.ilike.%${query}%`)
        .limit(10);

      return {
        success: true,
        action: intent.action,
        message: `Found ${(contacts || []).length} contacts matching "${query}".`,
        data: contacts,
      };
    }

    case "get_pipeline": {
      const { data: stages } = await supabase
        .from("contacts")
        .select("deal_stage")
        .eq("user_id", userId);

      const pipeline: Record<string, number> = {};
      for (const c of stages || []) {
        pipeline[c.deal_stage || "unknown"] = (pipeline[c.deal_stage || "unknown"] || 0) + 1;
      }

      const total = Object.values(pipeline).reduce((a, b) => a + b, 0);

      return {
        success: true,
        action: intent.action,
        message: `Pipeline: ${total} total contacts. ${pipeline.lead || 0} leads, ${pipeline.qualified || 0} qualified, ${pipeline.negotiation || 0} in negotiation, ${pipeline.won || 0} won.`,
        data: pipeline,
      };
    }

    case "get_stats": {
      const period = intent.params.period as string || "week";
      const daysMap: Record<string, number> = { today: 1, week: 7, month: 30, quarter: 90 };
      const days = daysMap[period] || 7;
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

      const [{ count: newContacts }, { count: activitiesCount }, { count: callsCount }] = await Promise.all([
        supabase.from("contacts").select("id", { count: "exact", head: true }).eq("user_id", userId).gte("created_at", since),
        supabase.from("activities").select("id", { count: "exact", head: true }).eq("user_id", userId).gte("created_at", since),
        supabase.from("ai_calls").select("id", { count: "exact", head: true }).eq("user_id", userId).gte("created_at", since),
      ]);

      return {
        success: true,
        action: intent.action,
        message: `This ${period}: ${newContacts || 0} new contacts, ${activitiesCount || 0} activities, ${callsCount || 0} calls.`,
        data: { newContacts, activities: activitiesCount, calls: callsCount, period },
      };
    }

    case "start_sequence": {
      const query = intent.params.contact_query as string;
      const sequenceType = intent.params.sequence_type as string || "standard_b2b";

      const contact = await findContact(userId, query);
      if (!contact) {
        return { success: false, action: intent.action, message: `Could not find contact matching "${query}".` };
      }

      // We'll fire an Inngest event for this
      return {
        success: true,
        action: intent.action,
        message: `Starting ${sequenceType} outreach sequence for ${contact.first_name} ${contact.last_name}.`,
        data: {
          event: "outreach/enroll",
          contactId: contact.id,
          sequenceTemplate: sequenceType,
        },
      };
    }

    default:
      return {
        success: false,
        action: intent.action,
        message: `I'm not sure how to handle that command. Try something like "add a contact" or "show me the pipeline".`,
      };
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

async function findContact(
  userId: string,
  query: string
): Promise<{ id: string; first_name: string; last_name: string; tags?: string[] } | null> {
  const supabase = getAdmin();

  // Try exact name match first
  const parts = query.trim().split(/\s+/);

  if (parts.length >= 2) {
    const { data } = await supabase
      .from("contacts")
      .select("id, first_name, last_name, tags")
      .eq("user_id", userId)
      .ilike("first_name", parts[0])
      .ilike("last_name", parts.slice(1).join(" "))
      .limit(1)
      .single();

    if (data) return data;
  }

  // Fuzzy search
  const { data } = await supabase
    .from("contacts")
    .select("id, first_name, last_name, tags")
    .eq("user_id", userId)
    .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,company.ilike.%${query}%`)
    .limit(1)
    .single();

  return data;
}

function getConfirmationPrompt(intent: VoiceIntent): string {
  switch (intent.action) {
    case "delete_contact":
      return `Are you sure you want to delete the contact "${intent.params.contact_query}"? This cannot be undone.`;
    case "send_bulk_email":
      return `This will send emails to multiple contacts. Confirm to proceed.`;
    case "start_campaign":
      return `This will start a calling campaign. Confirm to proceed.`;
    case "mark_as_lost":
      return `Mark deal as lost for "${intent.params.contact_query}"? Confirm to proceed.`;
    default:
      return `Confirm this action: ${intent.action}?`;
  }
}

// ─── Voice-to-Action Pipeline (Full L3) ─────────────────────────────────────

export async function processVoiceCommand(
  transcribedText: string,
  userId: string,
  autoConfirm = false
): Promise<VoiceCommandResult> {
  // Step 1: Parse intent from natural language
  const intent = await parseVoiceIntent(transcribedText, userId);

  if (intent.confidence < 0.3) {
    return {
      success: false,
      action: "unknown",
      message: "I couldn't understand that command. Could you try rephrasing?",
    };
  }

  // Step 2: Execute the action
  const result = await executeVoiceCommand(intent, userId, autoConfirm);

  // Step 3: If the result triggers an Inngest event, return event data
  if (result.success && result.data && typeof result.data === "object" && "event" in (result.data as Record<string, unknown>)) {
    result.message += " The action has been queued.";
  }

  return result;
}
