/**
 * Phase 2: Outreach Engine — Inngest Functions
 *
 * Durable multi-step outreach sequences:
 *   outreach/enroll → schedule steps → execute each step → handle replies → complete
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

// ─── Enroll Contact in Outreach Sequence ───────────────────────────────────

export const enrollInOutreach = inngest.createFunction(
  {
    id: "enroll-in-outreach",
    retries: 3,
  },
  { event: "outreach/enroll" },
  async ({ event, step }) => {
    const { contactId, userId, sequenceTemplate } = event.data;

    // Step 1: Enroll the contact
    const enrollment = await step.run("enroll-contact", async () => {
      const { enrollContact } = await import("@/lib/outreach/sequencer");
      return enrollContact(userId, contactId, sequenceTemplate);
    });

    if (!enrollment) {
      return { skipped: true, reason: "Already enrolled or invalid sequence" };
    }

    return { enrollmentId: enrollment.id, contactId, sequenceTemplate };
  }
);

// ─── Execute Outreach Sequence Step ────────────────────────────────────────

export const executeOutreachStep = inngest.createFunction(
  {
    id: "execute-outreach-step",
    retries: 3,
    throttle: {
      limit: 5,
      period: "1m",
      key: "event.data.userId",
    },
  },
  { event: "outreach/step.due" },
  async ({ event, step }) => {
    const { sequenceId, stepIndex, contactId, userId, channel } = event.data;

    // Step 1: Get enrollment details to calculate sleep duration
    const enrollment = await step.run("get-enrollment", async () => {
      const supabase = getAdmin();
      const { data } = await supabase
        .from("outreach_enrollments")
        .select("*, outreach_sequences!inner(steps)")
        .eq("id", sequenceId)
        .single();
      return data;
    });

    if (!enrollment || enrollment.status !== "active") {
      return { skipped: true, reason: "Enrollment not active" };
    }

    // Step 2: Calculate and wait for the right time
    const steps = (enrollment.outreach_sequences?.steps || []) as { day: number }[];
    const currentStep = steps[stepIndex];

    if (currentStep && currentStep.day > 0) {
      // Sleep until the step is due (relative to enrollment time)
      const enrolledAt = new Date(enrollment.enrolled_at || enrollment.created_at);
      const dueAt = new Date(enrolledAt.getTime() + currentStep.day * 24 * 60 * 60 * 1000);

      if (dueAt > new Date()) {
        await step.sleepUntil("wait-for-due-time", dueAt);
      }
    }

    // Step 3: Re-check enrollment is still active (might have been paused during sleep)
    const stillActive = await step.run("recheck-enrollment", async () => {
      const supabase = getAdmin();
      const { data } = await supabase
        .from("outreach_enrollments")
        .select("status")
        .eq("id", sequenceId)
        .single();
      return data?.status === "active";
    });

    if (!stillActive) {
      return { skipped: true, reason: "Enrollment paused/completed during wait" };
    }

    // Step 4: Execute the step
    const result = await step.run("execute-step", async () => {
      const { executeStep } = await import("@/lib/outreach/sequencer");
      return executeStep(sequenceId, stepIndex, channel, contactId, userId);
    });

    return {
      enrollmentId: sequenceId,
      stepIndex,
      ...result,
    };
  }
);

// ─── Handle Reply — Pause Sequence + Route ─────────────────────────────────

export const handleOutreachReply = inngest.createFunction(
  {
    id: "handle-outreach-reply",
    retries: 2,
  },
  { event: "outreach/reply.received" },
  async ({ event, step }) => {
    const { contactId, userId, channel, sentiment } = event.data;

    // Step 1: Update contact stage based on reply sentiment
    await step.run("update-contact-stage", async () => {
      const supabase = getAdmin();

      if (sentiment === "positive") {
        // Move to qualified/interested
        await supabase
          .from("contacts")
          .update({
            deal_stage: "qualified",
            custom_fields: {
              last_reply_channel: channel,
              last_reply_sentiment: sentiment,
              replied_at: new Date().toISOString(),
            },
          })
          .eq("id", contactId)
          .eq("user_id", userId);
      } else if (sentiment === "negative") {
        // Mark as not interested but don't delete
        await supabase
          .from("contacts")
          .update({
            custom_fields: {
              last_reply_channel: channel,
              last_reply_sentiment: sentiment,
              replied_at: new Date().toISOString(),
              disqualified_reason: "negative_reply",
            },
          })
          .eq("id", contactId)
          .eq("user_id", userId);
      }
    });

    // Step 2: If positive reply from high-score lead, emit for closer agent
    if (sentiment === "positive") {
      const contact = await step.run("check-lead-score", async () => {
        const supabase = getAdmin();
        const { data } = await supabase
          .from("contacts")
          .select("lead_score, deal_value")
          .eq("id", contactId)
          .eq("user_id", userId)
          .single();
        return data;
      });

      if (contact && (contact.lead_score || 0) >= 60) {
        // High-value positive reply — route to closer (Phase 4)
        await step.run("log-hot-lead", async () => {
          const supabase = getAdmin();
          await supabase.from("activities").insert({
            user_id: userId,
            contact_id: contactId,
            activity_type: "hot_lead_identified",
            details: {
              source: "outreach_reply",
              channel,
              lead_score: contact.lead_score,
              deal_value: contact.deal_value,
            },
          });
        });
      }
    }

    return { contactId, channel, sentiment, handled: true };
  }
);

// ─── Sequence Completed — Log Outcome ──────────────────────────────────────

export const outreachSequenceCompleted = inngest.createFunction(
  {
    id: "outreach-sequence-completed",
    retries: 2,
  },
  { event: "outreach/sequence.completed" },
  async ({ event, step }) => {
    const { sequenceId, contactId, userId, outcome } = event.data;

    await step.run("log-completion", async () => {
      const supabase = getAdmin();

      // Log activity
      await supabase.from("activities").insert({
        user_id: userId,
        contact_id: contactId,
        activity_type: "outreach_completed",
        details: {
          sequence_id: sequenceId,
          outcome,
        },
      });

      // If completed without reply, maybe move to nurture
      if (outcome === "completed") {
        await supabase
          .from("contacts")
          .update({
            custom_fields: {
              outreach_outcome: "no_response",
              outreach_completed_at: new Date().toISOString(),
            },
          })
          .eq("id", contactId)
          .eq("user_id", userId);
      }
    });

    return { sequenceId, outcome };
  }
);

// ─── Auto-Enroll After Routing (connects Phase 1 → Phase 2) ───────────────

export const autoEnrollAfterRouting = inngest.createFunction(
  {
    id: "auto-enroll-after-routing",
    retries: 2,
  },
  { event: "lead/routed" },
  async ({ event, step }) => {
    const { contactId, userId, mode } = event.data;

    // Only auto-enroll for Mode A (autonomous) and Mode C (self-service)
    if (mode === "B") {
      return { skipped: true, reason: "Mode B — human rep handles outreach" };
    }

    // Get contact score to determine sequence
    const contact = await step.run("get-contact-score", async () => {
      const supabase = getAdmin();
      const { data } = await supabase
        .from("contacts")
        .select("lead_score, deal_stage")
        .eq("id", contactId)
        .eq("user_id", userId)
        .single();
      return data;
    });

    if (!contact) return { skipped: true, reason: "Contact not found" };

    // Select sequence based on score
    let sequenceTemplate: string;
    if ((contact.lead_score || 0) >= 70) {
      sequenceTemplate = "aggressive"; // High intent — fast cadence
    } else if ((contact.lead_score || 0) >= 40) {
      sequenceTemplate = "standard_b2b"; // Medium — standard cadence
    } else {
      sequenceTemplate = "nurture"; // Low — slow nurture
    }

    // Enroll via event
    await step.sendEvent("enroll-in-outreach", {
      name: "outreach/enroll",
      data: {
        contactId,
        userId,
        sequenceTemplate,
      },
    });

    return { contactId, sequenceTemplate, leadScore: contact.lead_score };
  }
);
