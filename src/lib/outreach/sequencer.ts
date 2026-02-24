/**
 * Item 8: Multi-Channel Sequencer
 *
 * Orchestrates sequences across email → LinkedIn → WhatsApp → call.
 * Each step fires via Inngest with configurable delays.
 * Auto-selects channel based on contact data availability.
 * Pauses on positive reply.
 */

import { createClient } from "@supabase/supabase-js";
import { inngest } from "@/inngest/client";

const getAdmin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

// ─── Types ─────────────────────────────────────────────────────────────────

export type OutreachChannel = "email" | "linkedin" | "whatsapp" | "call" | "sms";

export interface SequenceStep {
  day: number; // days from enrollment
  channel: OutreachChannel;
  template: string; // template name or "ai_generated"
  subject?: string; // for email only
  fallbackChannel?: OutreachChannel; // if primary channel unavailable
}

export interface OutreachSequence {
  id: string;
  user_id: string;
  name: string;
  steps: SequenceStep[];
  is_active: boolean;
  created_at: string;
}

export interface SequenceEnrollment {
  id: string;
  user_id: string;
  contact_id: string;
  sequence_id: string;
  current_step: number;
  status: "active" | "paused" | "completed" | "replied" | "bounced" | "unsubscribed";
  enrolled_at: string;
  paused_at?: string;
  completed_at?: string;
  pause_reason?: string;
}

// ─── Preset Sequences ──────────────────────────────────────────────────────

export const PRESET_SEQUENCES: Record<string, { name: string; steps: SequenceStep[] }> = {
  standard_b2b: {
    name: "Standard B2B Outreach",
    steps: [
      { day: 0, channel: "email", template: "intro", subject: "ai_generated" },
      { day: 2, channel: "linkedin", template: "connection_request" },
      { day: 5, channel: "email", template: "followup_1", subject: "ai_generated" },
      { day: 7, channel: "whatsapp", template: "casual_checkin", fallbackChannel: "sms" },
      { day: 10, channel: "email", template: "value_add", subject: "ai_generated" },
      { day: 14, channel: "call", template: "discovery_call" },
      { day: 21, channel: "email", template: "breakup", subject: "ai_generated" },
    ],
  },
  aggressive: {
    name: "Aggressive (High-Intent Leads)",
    steps: [
      { day: 0, channel: "email", template: "intro", subject: "ai_generated" },
      { day: 1, channel: "linkedin", template: "connection_request" },
      { day: 2, channel: "call", template: "discovery_call" },
      { day: 3, channel: "whatsapp", template: "casual_checkin", fallbackChannel: "sms" },
      { day: 5, channel: "email", template: "followup_1", subject: "ai_generated" },
      { day: 7, channel: "call", template: "followup_call" },
      { day: 10, channel: "email", template: "breakup", subject: "ai_generated" },
    ],
  },
  nurture: {
    name: "Nurture (Low-Score Leads)",
    steps: [
      { day: 0, channel: "email", template: "value_add", subject: "ai_generated" },
      { day: 7, channel: "email", template: "case_study", subject: "ai_generated" },
      { day: 14, channel: "linkedin", template: "connection_request" },
      { day: 21, channel: "email", template: "value_add_2", subject: "ai_generated" },
      { day: 30, channel: "email", template: "checkin", subject: "ai_generated" },
    ],
  },
  re_engagement: {
    name: "Re-engagement (Lost/Stalled Deals)",
    steps: [
      { day: 0, channel: "email", template: "re_engage", subject: "ai_generated" },
      { day: 5, channel: "linkedin", template: "reconnect" },
      { day: 10, channel: "email", template: "new_value", subject: "ai_generated" },
      { day: 15, channel: "whatsapp", template: "casual_reconnect", fallbackChannel: "sms" },
    ],
  },
};

// ─── Sequence CRUD ─────────────────────────────────────────────────────────

export async function createSequence(
  userId: string,
  name: string,
  steps: SequenceStep[]
): Promise<OutreachSequence | null> {
  const supabase = getAdmin();
  const { data, error } = await supabase
    .from("outreach_sequences")
    .insert({
      user_id: userId,
      name,
      steps,
      is_active: true,
    })
    .select()
    .single();
  return error ? null : data;
}

export async function getSequences(userId: string): Promise<OutreachSequence[]> {
  const supabase = getAdmin();
  const { data } = await supabase
    .from("outreach_sequences")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return data || [];
}

// ─── Enrollment ────────────────────────────────────────────────────────────

export async function enrollContact(
  userId: string,
  contactId: string,
  sequenceTemplate: string
): Promise<SequenceEnrollment | null> {
  const supabase = getAdmin();

  // Check if already enrolled in an active sequence
  const { data: existing } = await supabase
    .from("outreach_enrollments")
    .select("id")
    .eq("contact_id", contactId)
    .eq("user_id", userId)
    .eq("status", "active")
    .single();

  if (existing) return null; // already enrolled

  // Resolve sequence: preset or custom
  let sequenceId: string;
  let steps: SequenceStep[];

  if (PRESET_SEQUENCES[sequenceTemplate]) {
    // Create sequence from preset
    const preset = PRESET_SEQUENCES[sequenceTemplate];
    const seq = await createSequence(userId, preset.name, preset.steps);
    if (!seq) return null;
    sequenceId = seq.id;
    steps = preset.steps;
  } else {
    // Use existing custom sequence
    const { data: seq } = await supabase
      .from("outreach_sequences")
      .select("*")
      .eq("id", sequenceTemplate)
      .eq("user_id", userId)
      .single();
    if (!seq) return null;
    sequenceId = seq.id;
    steps = seq.steps as SequenceStep[];
  }

  // Create enrollment
  const { data: enrollment, error } = await supabase
    .from("outreach_enrollments")
    .insert({
      user_id: userId,
      contact_id: contactId,
      sequence_id: sequenceId,
      current_step: 0,
      status: "active",
    })
    .select()
    .single();

  if (error || !enrollment) return null;

  // Schedule first step immediately
  if (steps.length > 0) {
    await scheduleStep(enrollment.id, 0, steps[0], contactId, userId);
  }

  return enrollment;
}

// ─── Step Execution ────────────────────────────────────────────────────────

async function scheduleStep(
  enrollmentId: string,
  stepIndex: number,
  step: SequenceStep,
  contactId: string,
  userId: string
): Promise<void> {
  // Calculate delay from enrollment
  const delayMs = step.day * 24 * 60 * 60 * 1000;
  const sendAt = new Date(Date.now() + delayMs);

  // Check if contact has the required channel info
  const supabase = getAdmin();
  const { data: contact } = await supabase
    .from("contacts")
    .select("email, phone, custom_fields")
    .eq("id", contactId)
    .eq("user_id", userId)
    .single();

  let channel = step.channel;

  // Fallback channel if primary unavailable
  if (contact) {
    if (channel === "email" && !contact.email && step.fallbackChannel) channel = step.fallbackChannel;
    if ((channel === "whatsapp" || channel === "sms" || channel === "call") && !contact.phone && step.fallbackChannel) channel = step.fallbackChannel;
  }

  // Emit Inngest event for the step
  await inngest.send({
    name: "outreach/step.due",
    data: {
      sequenceId: enrollmentId,
      stepIndex,
      contactId,
      userId,
      channel,
    },
    // Inngest handles delay via step.sleepUntil in the function
  });
}

export async function executeStep(
  enrollmentId: string,
  stepIndex: number,
  channel: OutreachChannel,
  contactId: string,
  userId: string
): Promise<{ sent: boolean; channel: OutreachChannel; reason?: string }> {
  const supabase = getAdmin();

  // Check enrollment is still active
  const { data: enrollment } = await supabase
    .from("outreach_enrollments")
    .select("*")
    .eq("id", enrollmentId)
    .eq("status", "active")
    .single();

  if (!enrollment) {
    return { sent: false, channel, reason: "Enrollment not active" };
  }

  // Check daily channel limits
  const withinLimit = await checkChannelLimit(userId, channel);
  if (!withinLimit) {
    return { sent: false, channel, reason: `Daily limit reached for ${channel}` };
  }

  // Get sequence to find the step config
  const { data: sequence } = await supabase
    .from("outreach_sequences")
    .select("steps")
    .eq("id", enrollment.sequence_id)
    .single();

  const steps = (sequence?.steps || []) as SequenceStep[];
  const step = steps[stepIndex];
  if (!step) {
    return { sent: false, channel, reason: "Step not found" };
  }

  // Get contact data for template generation
  const { data: contact } = await supabase
    .from("contacts")
    .select("*")
    .eq("id", contactId)
    .eq("user_id", userId)
    .single();

  if (!contact) {
    return { sent: false, channel, reason: "Contact not found" };
  }

  // Send via the appropriate channel
  try {
    switch (channel) {
      case "email": {
        const { sendColdEmail } = await import("@/lib/channels/cold-email");
        await sendColdEmail(contact, userId, step.template, step.subject);
        break;
      }
      case "whatsapp": {
        const { sendWhatsApp } = await import("@/lib/channels/whatsapp");
        await sendWhatsApp(contact, userId, step.template);
        break;
      }
      case "linkedin": {
        const { sendLinkedIn } = await import("@/lib/channels/linkedin");
        await sendLinkedIn(contact, userId, step.template);
        break;
      }
      case "sms": {
        // Use existing Twilio SMS
        const twilio = await import("twilio");
        const client = twilio.default(
          process.env.TWILIO_ACCOUNT_SID!,
          process.env.TWILIO_AUTH_TOKEN!
        );
        const { generateWhatsAppMessage } = await import("@/lib/outreach/templates");
        const template = await generateWhatsAppMessage(contact, "casual", step.template as "intro" | "followup" | "value_add" | "breakup" | "connection_request" | "meeting_request");
        await client.messages.create({
          to: contact.phone,
          from: process.env.TWILIO_PHONE_NUMBER!,
          body: template.body,
        });
        break;
      }
      case "call": {
        // Trigger autonomous call via Twilio
        const { initiateOutboundCall } = await import("@/lib/calling/twilio");
        const webhookBaseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.quotahit.com";
        const callId = crypto.randomUUID();
        await initiateOutboundCall({
          to: contact.phone,
          webhookBaseUrl,
          callId,
          agentId: "default",
        });
        break;
      }
    }

    // Increment channel usage
    await incrementChannelUsage(userId, channel);

    // Update enrollment progress
    const nextStep = stepIndex + 1;
    if (nextStep >= steps.length) {
      // Sequence complete
      await supabase
        .from("outreach_enrollments")
        .update({ status: "completed", current_step: nextStep, completed_at: new Date().toISOString() })
        .eq("id", enrollmentId);

      await inngest.send({
        name: "outreach/sequence.completed",
        data: { sequenceId: enrollmentId, contactId, userId, outcome: "completed" },
      });
    } else {
      // Schedule next step
      await supabase
        .from("outreach_enrollments")
        .update({ current_step: nextStep })
        .eq("id", enrollmentId);

      await scheduleStep(enrollmentId, nextStep, steps[nextStep], contactId, userId);
    }

    // Log activity
    await supabase.from("activities").insert({
      user_id: userId,
      contact_id: contactId,
      activity_type: "outreach_sent",
      details: {
        channel,
        step_index: stepIndex,
        sequence_id: enrollment.sequence_id,
        template: step.template,
      },
    });

    return { sent: true, channel };
  } catch (err) {
    return { sent: false, channel, reason: err instanceof Error ? err.message : "Send failed" };
  }
}

// ─── Pause / Resume ────────────────────────────────────────────────────────

export async function pauseSequence(
  enrollmentId: string,
  reason: string = "manual"
): Promise<boolean> {
  const supabase = getAdmin();
  const { error } = await supabase
    .from("outreach_enrollments")
    .update({ status: "paused", paused_at: new Date().toISOString(), pause_reason: reason })
    .eq("id", enrollmentId)
    .eq("status", "active");
  return !error;
}

export async function handleReply(
  contactId: string,
  userId: string,
  channel: OutreachChannel,
  sentiment: "positive" | "neutral" | "negative" = "positive"
): Promise<void> {
  const supabase = getAdmin();

  // Find active enrollment for this contact
  const { data: enrollment } = await supabase
    .from("outreach_enrollments")
    .select("id, sequence_id")
    .eq("contact_id", contactId)
    .eq("user_id", userId)
    .eq("status", "active")
    .single();

  if (enrollment) {
    // Pause the sequence on reply
    await supabase
      .from("outreach_enrollments")
      .update({
        status: "replied",
        paused_at: new Date().toISOString(),
        pause_reason: `${sentiment} reply via ${channel}`,
      })
      .eq("id", enrollment.id);

    // Emit events for downstream processing
    await inngest.send({
      name: "outreach/reply.received",
      data: { contactId, userId, channel, sentiment },
    });

    await inngest.send({
      name: "outreach/sequence.completed",
      data: {
        sequenceId: enrollment.id,
        contactId,
        userId,
        outcome: "replied",
      },
    });
  }

  // Log activity
  await supabase.from("activities").insert({
    user_id: userId,
    contact_id: contactId,
    activity_type: "outreach_reply",
    details: { channel, sentiment },
  });
}

// ─── Progress ──────────────────────────────────────────────────────────────

export async function getSequenceProgress(enrollmentId: string): Promise<{
  enrollment: SequenceEnrollment | null;
  totalSteps: number;
  completedSteps: number;
}> {
  const supabase = getAdmin();
  const { data: enrollment } = await supabase
    .from("outreach_enrollments")
    .select("*")
    .eq("id", enrollmentId)
    .single();

  if (!enrollment) return { enrollment: null, totalSteps: 0, completedSteps: 0 };

  const { data: sequence } = await supabase
    .from("outreach_sequences")
    .select("steps")
    .eq("id", enrollment.sequence_id)
    .single();

  const steps = (sequence?.steps || []) as SequenceStep[];

  return {
    enrollment,
    totalSteps: steps.length,
    completedSteps: enrollment.current_step,
  };
}

// ─── Channel Limits ────────────────────────────────────────────────────────

async function checkChannelLimit(userId: string, channel: OutreachChannel): Promise<boolean> {
  const supabase = getAdmin();
  const { data } = await supabase
    .from("outreach_channels")
    .select("daily_limit, sent_today, last_reset_at")
    .eq("user_id", userId)
    .eq("channel", channel)
    .eq("is_active", true)
    .single();

  if (!data) return true; // No limit configured = allow

  // Reset counter if new day
  const lastReset = new Date(data.last_reset_at);
  const now = new Date();
  if (lastReset.toDateString() !== now.toDateString()) {
    await supabase
      .from("outreach_channels")
      .update({ sent_today: 0, last_reset_at: now.toISOString() })
      .eq("user_id", userId)
      .eq("channel", channel);
    return true;
  }

  return data.sent_today < data.daily_limit;
}

async function incrementChannelUsage(userId: string, channel: OutreachChannel): Promise<void> {
  const supabase = getAdmin();
  // Upsert channel record
  const { data: existing } = await supabase
    .from("outreach_channels")
    .select("id, sent_today")
    .eq("user_id", userId)
    .eq("channel", channel)
    .single();

  if (existing) {
    await supabase
      .from("outreach_channels")
      .update({ sent_today: existing.sent_today + 1 })
      .eq("id", existing.id);
  } else {
    await supabase.from("outreach_channels").insert({
      user_id: userId,
      channel,
      sent_today: 1,
      is_active: true,
      daily_limit: channel === "email" ? 50 : channel === "linkedin" ? 25 : 100,
    });
  }
}
