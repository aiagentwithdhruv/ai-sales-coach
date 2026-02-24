/**
 * Smart Lead Routing
 *
 * Routes qualified leads to one of three modes:
 *   Mode A — Fully Autonomous: AI handles outreach, follow-up, closing
 *   Mode B — Hybrid: AI qualifies, human closes (assigned to best-fit rep)
 *   Mode C — Self-Service: High-intent lead gets direct payment link
 *
 * Triggered by lead/qualified event.
 */

import { inngest } from "../client";
import { createClient } from "@supabase/supabase-js";

const getAdmin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

export const routeQualifiedLead = inngest.createFunction(
  {
    id: "route-qualified-lead",
    retries: 2,
  },
  { event: "lead/qualified" },
  async ({ event, step }) => {
    const { contactId, userId, outcome, bant } = event.data;

    if (outcome !== "qualified") {
      return { skipped: true, reason: `Outcome is ${outcome}, not qualified` };
    }

    // Step 1: Fetch contact and org settings
    const { contact, orgSettings } = await step.run("fetch-context", async () => {
      const supabase = getAdmin();

      const { data: contactData } = await supabase
        .from("contacts")
        .select("*")
        .eq("id", contactId)
        .eq("user_id", userId)
        .single();

      // Check if user has team/org settings for routing mode
      const { data: teamData } = await supabase
        .from("teams")
        .select("settings")
        .eq("owner_id", userId)
        .single();

      const settings = (teamData?.settings || {}) as Record<string, unknown>;

      return {
        contact: contactData,
        orgSettings: {
          routingMode: (settings.routing_mode as string) || "A", // Default to autonomous
          enabledModes: (settings.enabled_modes as string[]) || ["A"],
          selfServiceThreshold: (settings.self_service_threshold as number) || 80,
        },
      };
    });

    if (!contact) return { skipped: true, reason: "Contact not found" };

    // Step 2: Determine routing mode
    const routingDecision = await step.run("determine-route", async () => {
      const avgBant = (bant.budget + bant.authority + bant.need + bant.timeline + bant.competition) / 5;
      const dealValue = (contact.deal_value as number) || 0;

      // Mode C: Self-Service — high intent, high score, has payment readiness signals
      if (
        avgBant >= orgSettings.selfServiceThreshold &&
        bant.budget >= 70 &&
        bant.timeline >= 70 &&
        dealValue > 0
      ) {
        return {
          mode: "C" as const,
          reason: `High-intent lead (BANT avg: ${Math.round(avgBant)}, budget: ${bant.budget}, timeline: ${bant.timeline}). Direct to payment.`,
        };
      }

      // Mode B: Hybrid — if org has reps configured and lead needs human touch
      if (
        orgSettings.enabledModes.includes("B") &&
        (dealValue > 10000 || bant.authority < 50) // Big deals or non-decision-makers
      ) {
        return {
          mode: "B" as const,
          reason: `${dealValue > 10000 ? "High-value deal" : "Authority below threshold"} — route to sales rep for closing.`,
        };
      }

      // Mode A: Autonomous — default
      return {
        mode: "A" as const,
        reason: `Standard qualified lead (BANT avg: ${Math.round(avgBant)}). Autonomous pipeline.`,
      };
    });

    // Step 3: Execute routing action
    await step.run("execute-routing", async () => {
      const supabase = getAdmin();
      const customFields = ((contact.custom_fields || {}) as Record<string, unknown>);

      const updateData: Record<string, unknown> = {
        custom_fields: {
          ...customFields,
          routing_mode: routingDecision.mode,
          routing_reason: routingDecision.reason,
          routed_at: new Date().toISOString(),
        },
      };

      // Mode-specific actions
      if (routingDecision.mode === "A") {
        // Auto-advance to outreach stage
        if (contact.deal_stage === "lead" || contact.deal_stage === "qualified") {
          updateData.deal_stage = "contacted"; // Ready for autonomous outreach
        }
      } else if (routingDecision.mode === "B") {
        // Find best rep (for now, assign to org owner; future: territory/capacity matching)
        (updateData.custom_fields as Record<string, unknown>).assigned_rep = userId;
      } else if (routingDecision.mode === "C") {
        // Mark for self-service flow
        updateData.deal_stage = "proposal";
      }

      await supabase
        .from("contacts")
        .update(updateData)
        .eq("id", contactId)
        .eq("user_id", userId);
    });

    // Step 4: Log routing activity
    await step.run("log-routing-activity", async () => {
      const supabase = getAdmin();
      await supabase.from("activities").insert({
        user_id: userId,
        contact_id: contactId,
        activity_type: "lead_routed",
        details: {
          mode: routingDecision.mode,
          reason: routingDecision.reason,
          bant,
          source: "inngest_auto",
        },
      });
    });

    // Step 5: Emit routed event for downstream (outreach, notification, etc.)
    await step.sendEvent("emit-routed", {
      name: "lead/routed",
      data: {
        contactId,
        userId,
        mode: routingDecision.mode,
        reason: routingDecision.reason,
      },
    });

    return {
      contactId,
      mode: routingDecision.mode,
      reason: routingDecision.reason,
    };
  }
);
