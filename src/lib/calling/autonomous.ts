/**
 * Item 15: Autonomous Cold Calling
 *
 * Turns existing Twilio infra into a fully autonomous outbound calling engine.
 * Uses the conversation pipeline (pipeline.ts) + TTS (tts.ts) + LLM to:
 *   1. Pick up qualified leads → initiate outbound call
 *   2. Conduct AI conversation with real-time speech
 *   3. Handle objections, book meetings, gather intel
 *   4. Log outcome → fire events for downstream agents
 *
 * Integration points:
 *   - Twilio (twilio.ts) for call management
 *   - Pipeline (pipeline.ts) for conversation state
 *   - TTS (tts.ts) for voice synthesis
 *   - Inngest events: lead/routed → autonomous call → call/completed
 */

import { createClient } from "@supabase/supabase-js";
import { isTwilioConfigured, initiateOutboundCall } from "./twilio";
import { initConversation, getAgentGreeting, endConversation, analyzeCallTranscript } from "./pipeline";

const getAdmin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

// ─── Types ──────────────────────────────────────────────────────────────────

export interface AutonomousCallConfig {
  userId: string;
  contactId: string;
  agentId: string;
  priority?: "normal" | "high" | "urgent";
  callWindow?: { startHour: number; endHour: number }; // Respect business hours
  maxAttempts?: number;
  retryDelayMinutes?: number;
}

export interface AutonomousCallResult {
  success: boolean;
  callId?: string;
  callSid?: string;
  error?: string;
  skipped?: boolean;
  skipReason?: string;
}

// ─── Pre-Call Checks ────────────────────────────────────────────────────────

async function preCallChecks(config: AutonomousCallConfig): Promise<{
  pass: boolean;
  reason?: string;
  contact?: Record<string, unknown>;
  agent?: Record<string, unknown>;
}> {
  const supabase = getAdmin();

  // 1. Check Twilio is configured
  if (!isTwilioConfigured()) {
    return { pass: false, reason: "twilio_not_configured" };
  }

  // 2. Get contact details
  const { data: contact } = await supabase
    .from("contacts")
    .select("*")
    .eq("id", config.contactId)
    .eq("user_id", config.userId)
    .single();

  if (!contact) {
    return { pass: false, reason: "contact_not_found" };
  }

  // 3. Check phone number exists
  const phone = contact.phone || contact.custom_fields?.phone;
  if (!phone) {
    return { pass: false, reason: "no_phone_number" };
  }

  // 4. Check do-not-call
  if (contact.custom_fields?.do_not_call || contact.tags?.includes("do-not-call")) {
    return { pass: false, reason: "do_not_call" };
  }

  // 5. Check business hours
  if (config.callWindow) {
    const now = new Date();
    const hour = now.getHours();
    if (hour < config.callWindow.startHour || hour >= config.callWindow.endHour) {
      return { pass: false, reason: "outside_business_hours" };
    }
  }

  // 6. Check call attempts (don't over-call)
  const { count: recentCallCount } = await supabase
    .from("ai_calls")
    .select("id", { count: "exact", head: true })
    .eq("contact_id", config.contactId)
    .eq("user_id", config.userId)
    .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

  const maxAttempts = config.maxAttempts || 3;
  if ((recentCallCount || 0) >= maxAttempts) {
    return { pass: false, reason: "max_daily_attempts_reached" };
  }

  // 7. Get AI agent
  const { data: agent } = await supabase
    .from("ai_agents")
    .select("*")
    .eq("id", config.agentId)
    .eq("user_id", config.userId)
    .eq("is_active", true)
    .single();

  if (!agent) {
    return { pass: false, reason: "agent_not_found_or_inactive" };
  }

  return { pass: true, contact, agent };
}

// ─── Initiate Autonomous Call ───────────────────────────────────────────────

export async function initiateAutonomousCall(
  config: AutonomousCallConfig
): Promise<AutonomousCallResult> {
  const supabase = getAdmin();

  // Pre-call validation
  const checks = await preCallChecks(config);
  if (!checks.pass) {
    // Log the skip reason
    await supabase.from("activities").insert({
      user_id: config.userId,
      contact_id: config.contactId,
      activity_type: "autonomous_call_skipped",
      details: { reason: checks.reason, priority: config.priority },
    });
    return { success: false, skipped: true, skipReason: checks.reason };
  }

  const contact = checks.contact!;
  const agent = checks.agent!;
  const phone = contact.phone || (contact.custom_fields as Record<string, string>)?.phone;

  const webhookBaseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

  try {
    // Create call record
    const { data: callRecord } = await supabase
      .from("ai_calls")
      .insert({
        user_id: config.userId,
        agent_id: config.agentId,
        contact_id: config.contactId,
        direction: "outbound",
        status: "queued",
        phone_number: phone,
        contact_name: `${contact.first_name || ""} ${contact.last_name || ""}`.trim(),
        to_number: phone,
        from_number: process.env.TWILIO_PHONE_NUMBER || null,
        call_type: "autonomous",
      })
      .select("id")
      .single();

    if (!callRecord) {
      return { success: false, error: "Failed to create call record" };
    }

    const callId = callRecord.id;

    // Initialize conversation pipeline
    initConversation(callId, agent as never, {
      name: `${contact.first_name || ""} ${contact.last_name || ""}`.trim(),
      company: contact.company as string | undefined,
      title: (contact.custom_fields as Record<string, string>)?.title,
      previousNotes: contact.notes as string | undefined,
    });

    // Initiate Twilio outbound call
    const twilioResult = await initiateOutboundCall({
      to: phone as string,
      webhookBaseUrl,
      callId,
      agentId: config.agentId,
    });

    // Update call record with Twilio SID
    await supabase
      .from("ai_calls")
      .update({
        twilio_call_sid: twilioResult.callSid,
        status: "ringing",
      })
      .eq("id", callId);

    // Log activity
    await supabase.from("activities").insert({
      user_id: config.userId,
      contact_id: config.contactId,
      activity_type: "autonomous_call_initiated",
      details: {
        call_id: callId,
        call_sid: twilioResult.callSid,
        agent_name: agent.name,
        priority: config.priority,
      },
    });

    return {
      success: true,
      callId,
      callSid: twilioResult.callSid,
    };
  } catch (err) {
    const error = err instanceof Error ? err.message : "Call initiation failed";

    await supabase.from("activities").insert({
      user_id: config.userId,
      contact_id: config.contactId,
      activity_type: "autonomous_call_error",
      details: { error, priority: config.priority },
    });

    return { success: false, error };
  }
}

// ─── Process Call Completion ────────────────────────────────────────────────

export async function processAutonomousCallCompletion(
  callId: string,
  userId: string
): Promise<{
  analyzed: boolean;
  outcome?: string;
  nextAction?: string;
}> {
  const supabase = getAdmin();

  // End conversation and get transcript + costs
  const result = endConversation(callId);
  if (!result) {
    return { analyzed: false };
  }

  // Get call record for agent info
  const { data: callRecord } = await supabase
    .from("ai_calls")
    .select("*, ai_agents(*)")
    .eq("id", callId)
    .single();

  if (!callRecord) {
    return { analyzed: false };
  }

  // Analyze transcript with AI
  let analysis;
  try {
    analysis = await analyzeCallTranscript(
      result.transcript,
      callRecord.ai_agents as never
    );
  } catch {
    analysis = {
      summary: "Call completed. Transcript analysis failed.",
      outcome: "completed",
      sentiment: "neutral",
      score: 50,
      scoreBreakdown: { discovery: 50, rapport: 50, objection_handling: 50, closing: 50, overall: 50 },
      objections: [],
      topics: [],
      nextSteps: "Manual review required.",
    };
  }

  // Update call record with full analysis
  await supabase
    .from("ai_calls")
    .update({
      status: "completed",
      duration: result.duration,
      outcome: analysis.outcome,
      sentiment: analysis.sentiment,
      score: analysis.score,
      score_breakdown: analysis.scoreBreakdown,
      summary: analysis.summary,
      transcript: result.transcript,
      cost_breakdown: result.costBreakdown,
      objections: analysis.objections,
      topics: analysis.topics,
      next_steps: analysis.nextSteps,
    })
    .eq("id", callId);

  // Determine next action based on outcome
  let nextAction = "none";
  const contactId = callRecord.contact_id;

  if (analysis.outcome === "meeting_booked" || analysis.outcome === "interested") {
    nextAction = "move_to_negotiation";
    if (contactId) {
      await supabase
        .from("contacts")
        .update({ deal_stage: "negotiation" })
        .eq("id", contactId)
        .eq("user_id", userId);
    }
  } else if (analysis.outcome === "callback_scheduled") {
    nextAction = "schedule_callback";
  } else if (analysis.outcome === "voicemail" || analysis.outcome === "no_answer") {
    nextAction = "retry_later";
  } else if (analysis.outcome === "not_interested") {
    nextAction = "move_to_nurture";
    if (contactId) {
      await supabase
        .from("contacts")
        .update({ deal_stage: "lost" })
        .eq("id", contactId)
        .eq("user_id", userId);
    }
  }

  return {
    analyzed: true,
    outcome: analysis.outcome,
    nextAction,
  };
}

// ─── Get Call Queue ─────────────────────────────────────────────────────────

export async function getAutonomousCallQueue(
  userId: string,
  limit = 20
): Promise<{
  contacts: Array<{
    contactId: string;
    name: string;
    phone: string;
    score: number;
    company?: string;
    priority: string;
  }>;
  total: number;
}> {
  const supabase = getAdmin();

  // Find contacts eligible for autonomous calling:
  // - Has phone number
  // - In active pipeline stage
  // - Score >= 50 (worth calling)
  // - Not called in last 24 hours
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data: contacts, count } = await supabase
    .from("contacts")
    .select("id, first_name, last_name, phone, lead_score, company, deal_stage, custom_fields", {
      count: "exact",
    })
    .eq("user_id", userId)
    .in("deal_stage", ["lead", "contacted", "qualified"])
    .gte("lead_score", 50)
    .not("phone", "is", null)
    .order("lead_score", { ascending: false })
    .limit(limit);

  // Filter out recently called
  const eligible = [];
  for (const c of contacts || []) {
    const { count: recentCalls } = await supabase
      .from("ai_calls")
      .select("id", { count: "exact", head: true })
      .eq("contact_id", c.id)
      .gte("created_at", oneDayAgo);

    if ((recentCalls || 0) === 0) {
      eligible.push({
        contactId: c.id,
        name: `${c.first_name || ""} ${c.last_name || ""}`.trim(),
        phone: c.phone,
        score: c.lead_score || 0,
        company: c.company,
        priority: (c.lead_score || 0) >= 80 ? "high" : "normal",
      });
    }
  }

  return { contacts: eligible, total: count || 0 };
}
