/**
 * Item 12: Orchestrator Agent — "The Brain"
 *
 * Unified event listener that routes between all 7 agents via composition chains.
 * Replaces individual Inngest triggers with a single intelligent router.
 *
 * Routing rules (from chains.json):
 * - contact/created → Researcher (enrich)
 * - lead/scored → score < 40: nurture | 40-70: Qualifier | 70+: fast-track Outreach
 * - lead/qualified → qualified: Router | nurture: Outreach (nurture) | disqualified: archive
 * - lead/routed → Mode A: Outreach→Closer | Mode B: Outreach+Rep | Mode C: Ops
 * - call/completed → Follow-up trigger
 * - deal/won → Ops (onboarding)
 * - deal/lost → Re-engagement queue (monthly)
 */

import { inngest } from "../client";
import { createClient } from "@supabase/supabase-js";

const getAdmin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

// ─── Master Pipeline Event Router ─────────────────────────────────────────

export const orchestrateOnContactCreated = inngest.createFunction(
  {
    id: "orchestrate-contact-created",
    retries: 2,
  },
  { event: "contact/created" },
  async ({ event, step }) => {
    const { contactId, userId, source } = event.data;

    // Log routing decision
    await step.run("log-orchestration", async () => {
      const supabase = getAdmin();
      await supabase.from("activities").insert({
        user_id: userId,
        contact_id: contactId,
        activity_type: "orchestrator_routing",
        details: {
          event: "contact/created",
          decision: "enrich_then_score",
          source,
        },
      });
    });

    // Chain: contact created → auto-enrich (if not already enriched)
    const contact = await step.run("check-enrichment", async () => {
      const supabase = getAdmin();
      const { data } = await supabase
        .from("contacts")
        .select("enrichment_status, email, company")
        .eq("id", contactId)
        .eq("user_id", userId)
        .single();
      return data;
    });

    // If not enriched and has enough data to research, trigger enrichment
    if (contact && contact.enrichment_status !== "enriched" && (contact.email || contact.company)) {
      await step.run("trigger-enrichment", async () => {
        // Enrichment is handled by the API route, but we log the intent
        const supabase = getAdmin();
        await supabase.from("activities").insert({
          user_id: userId,
          contact_id: contactId,
          activity_type: "orchestrator_action",
          details: {
            action: "queue_for_enrichment",
            reason: "new_contact_needs_research",
          },
        });
      });
    }

    // Scoring is handled by scoreLeadOnCreate (already wired in Phase 1)
    return { contactId, chain: "enrich → score → qualify → route", step: "initiated" };
  }
);

// ─── Handle Stuck Leads (Cron) ─────────────────────────────────────────────

export const handleStuckLeads = inngest.createFunction(
  {
    id: "handle-stuck-leads",
    retries: 1,
  },
  { cron: "0 9 * * 1" }, // Every Monday at 9 AM
  async ({ step }) => {
    // Find leads with no activity in 7+ days
    const stuckLeads = await step.run("find-stuck-leads", async () => {
      const supabase = getAdmin();
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      // Find contacts that are in active pipeline stages but have no recent activity
      const { data: contacts } = await supabase
        .from("contacts")
        .select("id, user_id, deal_stage, lead_score, first_name, last_name")
        .in("deal_stage", ["lead", "contacted", "qualified"])
        .lt("updated_at", sevenDaysAgo)
        .limit(100);

      return contacts || [];
    });

    if (stuckLeads.length === 0) {
      return { stuck: 0, action: "none" };
    }

    // Re-engage stuck leads
    const reEngageEvents = stuckLeads.map((contact) => ({
      name: "outreach/enroll" as const,
      data: {
        contactId: contact.id,
        userId: contact.user_id,
        sequenceTemplate: "re_engagement",
      },
    }));

    await step.sendEvent("re-engage-stuck-leads", reEngageEvents);

    // Log
    await step.run("log-stuck-handling", async () => {
      const supabase = getAdmin();
      for (const contact of stuckLeads) {
        await supabase.from("activities").insert({
          user_id: contact.user_id,
          contact_id: contact.id,
          activity_type: "orchestrator_re_engagement",
          details: {
            reason: "no_activity_7_days",
            action: "enrolled_in_re_engagement",
          },
        });
      }
    });

    return { stuck: stuckLeads.length, action: "re_engagement_enrolled" };
  }
);

// ─── Handle Escalation (High-Value Deals) ──────────────────────────────────

export const handleEscalation = inngest.createFunction(
  {
    id: "handle-escalation",
    retries: 2,
  },
  { event: "outreach/reply.received" },
  async ({ event, step }) => {
    const { contactId, userId, sentiment } = event.data;

    if (sentiment !== "positive") return { escalated: false };

    // Check if this is a high-value deal that needs human attention
    const contact = await step.run("check-deal-value", async () => {
      const supabase = getAdmin();
      const { data } = await supabase
        .from("contacts")
        .select("lead_score, deal_value, deal_stage, first_name, last_name, company")
        .eq("id", contactId)
        .eq("user_id", userId)
        .single();
      return data;
    });

    if (!contact) return { escalated: false };

    // Escalation criteria: deal_value > $10K or lead_score > 80
    const shouldEscalate = (contact.deal_value || 0) > 10000 || (contact.lead_score || 0) > 80;

    if (shouldEscalate) {
      await step.run("create-escalation", async () => {
        const supabase = getAdmin();
        await supabase.from("activities").insert({
          user_id: userId,
          contact_id: contactId,
          activity_type: "deal_escalation",
          details: {
            reason: "high_value_positive_reply",
            deal_value: contact.deal_value,
            lead_score: contact.lead_score,
            contact_name: `${contact.first_name} ${contact.last_name}`,
            company: contact.company,
            recommended_action: "human_follow_up_within_2_hours",
          },
        });

        // Update contact stage
        await supabase
          .from("contacts")
          .update({ deal_stage: "negotiation" })
          .eq("id", contactId)
          .eq("user_id", userId);
      });
    }

    return {
      escalated: shouldEscalate,
      deal_value: contact.deal_value,
      lead_score: contact.lead_score,
    };
  }
);
