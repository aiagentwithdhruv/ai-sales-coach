/**
 * Lead Pipeline Functions
 *
 * Durable workflow chain:
 *   contact.created → score lead → check threshold → qualify → route → follow up
 *
 * Each step is independently retryable and survives Vercel timeouts.
 */

import { inngest } from "../client";
import { createClient } from "@supabase/supabase-js";

const getAdmin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

// ─── Score Lead on Contact Creation ─────────────────────────────────────────

export const scoreLeadOnCreate = inngest.createFunction(
  {
    id: "score-lead-on-create",
    retries: 3,
  },
  { event: "contact/created" },
  async ({ event, step }) => {
    const { contactId, userId } = event.data;

    // Step 1: Fetch contact data
    const contact = await step.run("fetch-contact", async () => {
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

    // Step 2: Get activity count for scoring
    const activityCount = await step.run("count-activities", async () => {
      const supabase = getAdmin();
      const { count } = await supabase
        .from("activities")
        .select("*", { count: "exact", head: true })
        .eq("contact_id", contactId)
        .eq("user_id", userId);
      return count || 0;
    });

    // Step 3: Calculate lead score
    const score = await step.run("calculate-score", async () => {
      // Weighted scoring: ICP match, company size, decision maker, budget signals,
      // tech fit, growth, geo, intent — expanded from the basic calculateLeadScore
      let s = 0;

      // Contact completeness (20 points)
      if (contact.email) s += 5;
      if (contact.phone) s += 5;
      if (contact.company) s += 5;
      if (contact.title) s += 5;

      // Enrichment data (15 points)
      if (contact.enrichment_status === "enriched") s += 15;

      // Deal signals (15 points)
      if (contact.deal_value && contact.deal_value > 0) s += 10;
      if (contact.deal_value && contact.deal_value > 10000) s += 5;

      // Engagement (20 points)
      s += Math.min(activityCount * 4, 20);

      // Pipeline stage (15 points)
      const stageBonus: Record<string, number> = {
        lead: 0,
        contacted: 3,
        qualified: 8,
        proposal: 12,
        negotiation: 15,
      };
      if (contact.deal_stage && stageBonus[contact.deal_stage] !== undefined) {
        s += stageBonus[contact.deal_stage];
      }

      // Source quality (10 points)
      const sourceBonus: Record<string, number> = {
        referral: 10,
        inbound: 8,
        linkedin: 6,
        website: 5,
        import: 3,
        manual: 2,
        cold: 1,
      };
      if (contact.source && sourceBonus[contact.source]) {
        s += sourceBonus[contact.source];
      }

      // Do-not-contact penalty
      if (contact.do_not_call && contact.do_not_email) s -= 20;

      return Math.max(0, Math.min(s, 100));
    });

    // Step 4: Update contact with new score
    const previousScore = contact.lead_score || 0;
    await step.run("update-score", async () => {
      const supabase = getAdmin();
      await supabase
        .from("contacts")
        .update({ lead_score: score })
        .eq("id", contactId)
        .eq("user_id", userId);
    });

    // Step 5: Log activity
    await step.run("log-scoring-activity", async () => {
      const supabase = getAdmin();
      await supabase.from("activities").insert({
        user_id: userId,
        contact_id: contactId,
        activity_type: "lead_scored",
        details: {
          score,
          previous_score: previousScore,
          source: "inngest_auto",
        },
      });
    });

    // Step 6: Emit lead.scored event for downstream processing
    await step.sendEvent("emit-lead-scored", {
      name: "lead/scored",
      data: {
        contactId,
        userId,
        score,
        previousScore,
        signals: {
          completeness: contact.email ? 5 : 0,
          enrichment: contact.enrichment_status === "enriched" ? 15 : 0,
          engagement: Math.min(activityCount * 4, 20),
          dealSignals: contact.deal_value > 0 ? 10 : 0,
        },
      },
    });

    return { contactId, score, previousScore };
  }
);

// ─── Score Lead on Enrichment ───────────────────────────────────────────────

export const scoreLeadOnEnrich = inngest.createFunction(
  {
    id: "score-lead-on-enrich",
    retries: 3,
  },
  { event: "contact/enriched" },
  async ({ event, step }) => {
    // Re-trigger scoring by emitting contact.created (idempotent)
    await step.sendEvent("re-score", {
      name: "contact/created",
      data: {
        contactId: event.data.contactId,
        userId: event.data.userId,
        source: "enrichment",
      },
    });

    return { retriggered: true };
  }
);

// ─── Route Lead After Scoring ───────────────────────────────────────────────

export const routeAfterScoring = inngest.createFunction(
  {
    id: "route-after-scoring",
    retries: 2,
  },
  { event: "lead/scored" },
  async ({ event, step }) => {
    const { contactId, userId, score } = event.data;

    // Only proceed if score is above threshold
    if (score < 40) {
      return { skipped: true, reason: `Score ${score} below threshold 40` };
    }

    // Step 1: Check if contact is already qualified (avoid re-processing)
    const contact = await step.run("check-contact-stage", async () => {
      const supabase = getAdmin();
      const { data } = await supabase
        .from("contacts")
        .select("deal_stage, custom_fields")
        .eq("id", contactId)
        .eq("user_id", userId)
        .single();
      return data;
    });

    if (!contact) return { skipped: true, reason: "Contact not found" };

    const customFields = (contact.custom_fields || {}) as Record<string, unknown>;
    if (customFields.qualification_status === "qualified") {
      return { skipped: true, reason: "Already qualified" };
    }

    // Step 2: For now, emit for future qualification agent (Phase 1 Item 2)
    // When the qualification agent is built, this will trigger it
    await step.run("mark-for-qualification", async () => {
      const supabase = getAdmin();
      await supabase
        .from("contacts")
        .update({
          custom_fields: {
            ...customFields,
            qualification_status: "pending",
            qualification_score: score,
            queued_for_qualification_at: new Date().toISOString(),
          },
        })
        .eq("id", contactId)
        .eq("user_id", userId);
    });

    // Log activity
    await step.run("log-routing", async () => {
      const supabase = getAdmin();
      await supabase.from("activities").insert({
        user_id: userId,
        contact_id: contactId,
        activity_type: "qualification_queued",
        details: {
          score,
          threshold: 40,
          source: "inngest_auto",
        },
      });
    });

    return { contactId, score, action: "queued_for_qualification" };
  }
);

// ─── Trigger Follow-Ups After Call ──────────────────────────────────────────

export const triggerFollowUpsAfterCall = inngest.createFunction(
  {
    id: "trigger-followups-after-call",
    retries: 3,
  },
  { event: "followup/trigger" },
  async ({ event, step }) => {
    const params = event.data;

    const messagesCreated = await step.run("create-followup-messages", async () => {
      // Import dynamically to avoid circular deps
      const { triggerFollowUps } = await import("@/lib/crm/follow-ups");
      return triggerFollowUps(params);
    });

    return { messagesCreated };
  }
);

// ─── Send Individual Follow-Up Message ──────────────────────────────────────

export const sendFollowUpMessage = inngest.createFunction(
  {
    id: "send-followup-message",
    retries: 3,
    throttle: {
      limit: 10,
      period: "1m",
      key: "event.data.userId",
    },
  },
  { event: "followup/send" },
  async ({ event, step }) => {
    const { messageId } = event.data;

    const result = await step.run("send-message", async () => {
      const supabase = getAdmin();

      // Fetch the message
      const { data: msg } = await supabase
        .from("follow_up_messages")
        .select("*")
        .eq("id", messageId)
        .eq("status", "pending")
        .single();

      if (!msg) return { skipped: true, reason: "Message not found or already sent" };

      try {
        if (msg.channel === "email") {
          const apiKey = process.env.RESEND_API_KEY;
          if (!apiKey) throw new Error("RESEND_API_KEY not configured");

          const toEmail = (msg.metadata as Record<string, unknown>)?.contact_email as string;
          if (!toEmail) throw new Error("No email address");

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
            throw new Error(`Resend error (${res.status}): ${text}`);
          }
        } else if (msg.channel === "sms") {
          const toPhone = (msg.metadata as Record<string, unknown>)?.contact_phone as string;
          if (!toPhone) throw new Error("No phone number");

          const twilio = await import("twilio");
          const client = twilio.default(
            process.env.TWILIO_ACCOUNT_SID!,
            process.env.TWILIO_AUTH_TOKEN!
          );
          await client.messages.create({
            to: toPhone,
            from: process.env.TWILIO_PHONE_NUMBER!,
            body: msg.body,
          });
        }

        // Mark as sent
        await supabase
          .from("follow_up_messages")
          .update({ status: "sent", sent_at: new Date().toISOString() })
          .eq("id", messageId);

        return { sent: true, channel: msg.channel };
      } catch (err) {
        // Mark as failed
        await supabase
          .from("follow_up_messages")
          .update({
            status: "failed",
            error: err instanceof Error ? err.message : "Send failed",
          })
          .eq("id", messageId);

        throw err; // Re-throw so Inngest retries
      }
    });

    return result;
  }
);

// ─── Cron: Process Due Follow-Up Messages ───────────────────────────────────

export const processDueFollowUps = inngest.createFunction(
  {
    id: "process-due-followups",
    retries: 2,
  },
  { cron: "*/5 * * * *" }, // Every 5 minutes
  async ({ step }) => {
    // Step 1: Find due messages
    const dueMessages = await step.run("find-due-messages", async () => {
      const supabase = getAdmin();
      const { data } = await supabase
        .from("follow_up_messages")
        .select("id, user_id, contact_id, channel")
        .eq("status", "pending")
        .lte("send_at", new Date().toISOString())
        .order("send_at", { ascending: true })
        .limit(50);
      return data || [];
    });

    if (dueMessages.length === 0) {
      return { processed: 0 };
    }

    // Step 2: Fan out — send each message via Inngest event
    await step.sendEvent(
      "fan-out-messages",
      dueMessages.map((msg) => ({
        name: "followup/send" as const,
        data: {
          messageId: msg.id,
          userId: msg.user_id,
          contactId: msg.contact_id,
          channel: msg.channel as "email" | "sms" | "whatsapp",
        },
      }))
    );

    return { processed: dueMessages.length };
  }
);
