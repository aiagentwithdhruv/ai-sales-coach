/**
 * Phase 4: Closing Inngest Functions
 *
 * Durable functions for:
 *   - Auto-generate proposal when deal enters negotiation
 *   - Process due onboarding steps daily
 *   - Send meeting reminders daily
 *   - Handle deal won → start onboarding
 */

import { inngest } from "../client";
import { createClient } from "@supabase/supabase-js";

const getAdmin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

// ─── Auto-Generate Proposal on Negotiation ──────────────────────────────────

export const autoGenerateProposal = inngest.createFunction(
  {
    id: "auto-generate-proposal",
    retries: 2,
  },
  { event: "deal/negotiation" },
  async ({ event, step }) => {
    const { contactId, userId } = event.data;

    const proposal = await step.run("generate-proposal", async () => {
      const { generateProposal } = await import("@/lib/closing/proposals");
      return generateProposal(userId, contactId);
    });

    return { proposalId: proposal.id, total: proposal.pricing.total };
  }
);

// ─── Start Onboarding on Deal Won ───────────────────────────────────────────

export const startOnboardingOnWin = inngest.createFunction(
  {
    id: "start-onboarding-on-win",
    retries: 2,
  },
  { event: "deal/won" },
  async ({ event, step }) => {
    const { contactId, userId } = event.data;

    const plan = await step.run("start-onboarding", async () => {
      const { startOnboarding } = await import("@/lib/closing/onboarding");
      return startOnboarding(userId, contactId);
    });

    return { planId: plan.id, steps: plan.steps.length };
  }
);

// ─── Process Due Onboarding Steps (Daily) ───────────────────────────────────

export const processOnboardingSteps = inngest.createFunction(
  {
    id: "process-onboarding-steps",
    retries: 1,
  },
  { cron: "0 8 * * *" }, // Every day at 8 AM
  async ({ step }) => {
    const result = await step.run("process-due-steps", async () => {
      const { processDueOnboardingSteps } = await import("@/lib/closing/onboarding");
      return processDueOnboardingSteps();
    });

    return result;
  }
);

// ─── Send Meeting Reminders (Daily) ─────────────────────────────────────────

export const sendMeetingRemindersJob = inngest.createFunction(
  {
    id: "send-meeting-reminders",
    retries: 1,
  },
  { cron: "0 7 * * *" }, // Every day at 7 AM
  async ({ step }) => {
    const result = await step.run("send-reminders", async () => {
      const { sendMeetingReminders } = await import("@/lib/closing/calendar");
      return sendMeetingReminders();
    });

    return result;
  }
);

// ─── Check Overdue Invoices (Weekly) ────────────────────────────────────────

export const checkOverdueInvoices = inngest.createFunction(
  {
    id: "check-overdue-invoices",
    retries: 1,
  },
  { cron: "0 9 * * 1" }, // Every Monday at 9 AM
  async ({ step }) => {
    const overdue = await step.run("find-overdue", async () => {
      const supabase = getAdmin();

      const { data: invoices } = await supabase
        .from("invoices")
        .select("id, user_id, contact_id, invoice_number, total, due_date")
        .eq("status", "sent")
        .lt("due_date", new Date().toISOString());

      // Mark as overdue
      for (const inv of invoices || []) {
        await supabase
          .from("invoices")
          .update({ status: "overdue" })
          .eq("id", inv.id);

        await supabase.from("activities").insert({
          user_id: inv.user_id,
          contact_id: inv.contact_id,
          activity_type: "invoice_overdue",
          details: {
            invoice_id: inv.id,
            invoice_number: inv.invoice_number,
            total: inv.total,
            due_date: inv.due_date,
          },
        });
      }

      return { count: (invoices || []).length };
    });

    return overdue;
  }
);
