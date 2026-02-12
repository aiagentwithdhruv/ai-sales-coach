/**
 * Follow-Up Automation Engine
 *
 * Manages sequences (rules) and messages (scheduled queue).
 * After a call completes, matching sequences create scheduled messages.
 * A cron/periodic check sends due messages via Resend (email) or Twilio (SMS).
 */

import { createClient } from "@supabase/supabase-js";
import type { FollowUpSequence, FollowUpMessage, FollowUpStep } from "@/types/teams";

const getAdmin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

// ─── Sequence CRUD ──────────────────────────────────────────────────────────

export async function getSequences(userId: string): Promise<FollowUpSequence[]> {
  const supabase = getAdmin();
  const { data } = await supabase
    .from("follow_up_sequences")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return data || [];
}

export async function getSequence(userId: string, id: string): Promise<FollowUpSequence | null> {
  const supabase = getAdmin();
  const { data } = await supabase
    .from("follow_up_sequences")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .single();
  return data;
}

export async function createSequence(
  userId: string,
  input: { name: string; trigger: string; steps: FollowUpStep[] }
): Promise<FollowUpSequence | null> {
  const supabase = getAdmin();
  const { data, error } = await supabase
    .from("follow_up_sequences")
    .insert({
      user_id: userId,
      name: input.name,
      trigger: input.trigger,
      steps: input.steps,
      is_active: true,
    })
    .select()
    .single();
  return error ? null : data;
}

export async function updateSequence(
  userId: string,
  id: string,
  updates: Partial<{ name: string; trigger: string; steps: FollowUpStep[]; is_active: boolean }>
): Promise<FollowUpSequence | null> {
  const supabase = getAdmin();
  const { data, error } = await supabase
    .from("follow_up_sequences")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();
  return error ? null : data;
}

export async function deleteSequence(userId: string, id: string): Promise<boolean> {
  const supabase = getAdmin();
  const { error } = await supabase
    .from("follow_up_sequences")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  return !error;
}

// ─── Trigger Follow-Ups After Call ──────────────────────────────────────────

export async function triggerFollowUps(params: {
  userId: string;
  contactId: string;
  callId: string;
  outcome: string;
  contactName: string;
  contactEmail?: string | null;
  contactPhone?: string | null;
  callSummary: string;
  nextSteps: string;
  agentName: string;
}): Promise<number> {
  const supabase = getAdmin();

  // Find matching active sequences
  const { data: sequences } = await supabase
    .from("follow_up_sequences")
    .select("*")
    .eq("user_id", params.userId)
    .eq("is_active", true)
    .or(`trigger.eq.${params.outcome},trigger.eq.any_completed`);

  if (!sequences || sequences.length === 0) return 0;

  let messagesCreated = 0;

  for (const seq of sequences) {
    const steps = (seq.steps || []) as FollowUpStep[];

    for (const step of steps) {
      // Check if contact has the required channel info
      if (step.channel === "email" && !params.contactEmail) continue;
      if ((step.channel === "sms" || step.channel === "whatsapp") && !params.contactPhone) continue;

      // Interpolate template variables
      const body = interpolateTemplate(step.template, {
        contact_name: params.contactName,
        call_summary: params.callSummary,
        next_steps: params.nextSteps,
        agent_name: params.agentName,
      });

      const subject = step.subject
        ? interpolateTemplate(step.subject, {
            contact_name: params.contactName,
            call_summary: params.callSummary,
            next_steps: params.nextSteps,
            agent_name: params.agentName,
          })
        : null;

      const sendAt = new Date(Date.now() + step.delay_minutes * 60 * 1000);

      const { error } = await supabase.from("follow_up_messages").insert({
        user_id: params.userId,
        sequence_id: seq.id,
        contact_id: params.contactId,
        call_id: params.callId,
        channel: step.channel,
        status: "pending",
        subject,
        body,
        send_at: sendAt.toISOString(),
        metadata: {
          outcome: params.outcome,
          contact_email: params.contactEmail,
          contact_phone: params.contactPhone,
        },
      });

      if (!error) messagesCreated++;
    }
  }

  return messagesCreated;
}

// ─── Send Due Messages ──────────────────────────────────────────────────────

export async function sendDueMessages(): Promise<{ sent: number; failed: number }> {
  const supabase = getAdmin();
  const result = { sent: 0, failed: 0 };

  // Get messages that are due
  const { data: messages } = await supabase
    .from("follow_up_messages")
    .select("*")
    .eq("status", "pending")
    .lte("send_at", new Date().toISOString())
    .order("send_at", { ascending: true })
    .limit(50);

  if (!messages || messages.length === 0) return result;

  for (const msg of messages) {
    try {
      if (msg.channel === "email") {
        await sendEmail(msg);
      } else if (msg.channel === "sms") {
        await sendSMS(msg);
      }

      await supabase
        .from("follow_up_messages")
        .update({ status: "sent", sent_at: new Date().toISOString() })
        .eq("id", msg.id);

      result.sent++;
    } catch (err) {
      await supabase
        .from("follow_up_messages")
        .update({
          status: "failed",
          error: err instanceof Error ? err.message : "Send failed",
        })
        .eq("id", msg.id);

      result.failed++;
    }
  }

  return result;
}

// ─── Get Pending Messages ───────────────────────────────────────────────────

export async function getPendingMessages(userId: string): Promise<FollowUpMessage[]> {
  const supabase = getAdmin();
  const { data } = await supabase
    .from("follow_up_messages")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "pending")
    .order("send_at", { ascending: true });
  return data || [];
}

export async function getMessageHistory(
  userId: string,
  options?: { contactId?: string; limit?: number }
): Promise<FollowUpMessage[]> {
  const supabase = getAdmin();
  let query = supabase
    .from("follow_up_messages")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (options?.contactId) query = query.eq("contact_id", options.contactId);
  if (options?.limit) query = query.limit(options.limit);

  const { data } = await query;
  return data || [];
}

export async function cancelMessage(userId: string, messageId: string): Promise<boolean> {
  const supabase = getAdmin();
  const { error } = await supabase
    .from("follow_up_messages")
    .update({ status: "cancelled" })
    .eq("id", messageId)
    .eq("user_id", userId)
    .eq("status", "pending");
  return !error;
}

// ─── Email via Resend ───────────────────────────────────────────────────────

async function sendEmail(msg: FollowUpMessage): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY not configured");

  const toEmail = (msg.metadata as Record<string, unknown>).contact_email as string;
  if (!toEmail) throw new Error("No email address for contact");

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL || "QuotaHit <noreply@quotahit.com>",
      to: [toEmail],
      subject: msg.subject || "Following up on our conversation",
      html: msg.body.replace(/\n/g, "<br>"),
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Resend API error (${res.status}): ${text}`);
  }
}

// ─── SMS via Twilio ─────────────────────────────────────────────────────────

async function sendSMS(msg: FollowUpMessage): Promise<void> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    throw new Error("Twilio not configured for SMS");
  }

  const toPhone = (msg.metadata as Record<string, unknown>).contact_phone as string;
  if (!toPhone) throw new Error("No phone number for contact");

  const twilio = await import("twilio");
  const client = twilio.default(accountSid, authToken);

  await client.messages.create({
    to: toPhone,
    from: fromNumber,
    body: msg.body,
  });
}

// ─── Template Interpolation ─────────────────────────────────────────────────

function interpolateTemplate(
  template: string,
  vars: Record<string, string>
): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value || "");
  }
  return result;
}
