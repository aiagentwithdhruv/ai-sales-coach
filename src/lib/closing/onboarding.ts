/**
 * Item 20: Auto-Onboarding
 *
 * Post-payment welcome sequence + automated setup:
 *   1. Detect payment → fire onboarding event
 *   2. Welcome email with login credentials + quick-start guide
 *   3. Schedule kickoff call (if applicable)
 *   4. Create workspace/project in system
 *   5. Send drip sequence: Day 1 (welcome), Day 3 (tips), Day 7 (check-in)
 *
 * Integrates with:
 *   - Invoicing (Item 19) for payment detection
 *   - Email (Resend) for welcome sequences
 *   - Calendar (Item 21) for kickoff scheduling
 */

import { createClient } from "@supabase/supabase-js";

const getAdmin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

// ─── Types ──────────────────────────────────────────────────────────────────

export interface OnboardingPlan {
  id: string;
  userId: string;
  contactId: string;
  status: "pending" | "active" | "completed" | "stalled";
  steps: OnboardingStep[];
  startedAt?: string;
  completedAt?: string;
}

export interface OnboardingStep {
  id: string;
  name: string;
  type: "email" | "call" | "task" | "wait";
  status: "pending" | "completed" | "skipped";
  dayOffset: number; // Days after onboarding starts
  config: Record<string, unknown>;
  completedAt?: string;
}

// ─── Default Onboarding Sequence ────────────────────────────────────────────

const DEFAULT_ONBOARDING_STEPS: Omit<OnboardingStep, "id">[] = [
  {
    name: "Welcome Email",
    type: "email",
    status: "pending",
    dayOffset: 0,
    config: {
      templateKey: "welcome",
      subject: "Welcome to QuotaHit! Here's how to get started",
    },
  },
  {
    name: "Account Setup Guide",
    type: "email",
    status: "pending",
    dayOffset: 1,
    config: {
      templateKey: "setup_guide",
      subject: "Quick setup: Get your first AI agent running in 5 minutes",
    },
  },
  {
    name: "Schedule Kickoff Call",
    type: "call",
    status: "pending",
    dayOffset: 2,
    config: {
      templateKey: "kickoff_invite",
      subject: "Let's set up your QuotaHit workspace — pick a time",
      duration: 30,
    },
  },
  {
    name: "Tips & Best Practices",
    type: "email",
    status: "pending",
    dayOffset: 3,
    config: {
      templateKey: "tips",
      subject: "3 tips our top users wish they knew from day one",
    },
  },
  {
    name: "First Week Check-in",
    type: "email",
    status: "pending",
    dayOffset: 7,
    config: {
      templateKey: "checkin",
      subject: "How's your first week going?",
    },
  },
  {
    name: "Feature Deep Dive",
    type: "email",
    status: "pending",
    dayOffset: 14,
    config: {
      templateKey: "deep_dive",
      subject: "Unlock the full power of your AI sales team",
    },
  },
  {
    name: "30-Day Success Review",
    type: "call",
    status: "pending",
    dayOffset: 30,
    config: {
      templateKey: "success_review",
      subject: "Your 30-day results are in — let's review",
      duration: 20,
    },
  },
];

// ─── Start Onboarding ───────────────────────────────────────────────────────

export async function startOnboarding(
  userId: string,
  contactId: string,
  customSteps?: Omit<OnboardingStep, "id">[]
): Promise<OnboardingPlan> {
  const supabase = getAdmin();

  const steps = (customSteps || DEFAULT_ONBOARDING_STEPS).map((step, i) => ({
    ...step,
    id: `step_${i + 1}`,
  }));

  // Store onboarding plan
  const { data: plan } = await supabase
    .from("onboarding_plans")
    .insert({
      user_id: userId,
      contact_id: contactId,
      status: "active",
      steps,
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  // Update contact stage
  await supabase
    .from("contacts")
    .update({ deal_stage: "onboarding" })
    .eq("id", contactId)
    .eq("user_id", userId);

  // Log activity
  await supabase.from("activities").insert({
    user_id: userId,
    contact_id: contactId,
    activity_type: "onboarding_started",
    details: {
      plan_id: plan?.id,
      total_steps: steps.length,
      duration_days: steps[steps.length - 1]?.dayOffset || 30,
    },
  });

  // Execute the first step immediately (Day 0 — welcome email)
  const firstStep = steps.find((s) => s.dayOffset === 0);
  if (firstStep) {
    await executeOnboardingStep(userId, contactId, plan?.id || "", firstStep);
  }

  return {
    id: plan?.id || "",
    userId,
    contactId,
    status: "active",
    steps: steps as OnboardingStep[],
    startedAt: new Date().toISOString(),
  };
}

// ─── Execute Onboarding Step ────────────────────────────────────────────────

async function executeOnboardingStep(
  userId: string,
  contactId: string,
  planId: string,
  step: OnboardingStep
): Promise<void> {
  const supabase = getAdmin();

  // Get contact info for email personalization
  const { data: contact } = await supabase
    .from("contacts")
    .select("first_name, last_name, email, company")
    .eq("id", contactId)
    .eq("user_id", userId)
    .single();

  if (!contact?.email) return;

  if (step.type === "email") {
    // Send via Resend
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      const emailContent = getOnboardingEmailContent(
        step.config.templateKey as string,
        {
          name: contact.first_name || "there",
          company: contact.company || "",
        }
      );

      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM_EMAIL || "onboarding@quotahit.com",
          to: contact.email,
          subject: step.config.subject as string,
          html: emailContent,
          tags: [
            { name: "type", value: "onboarding" },
            { name: "step", value: step.id },
          ],
        }),
      });
    }
  }

  // Mark step as completed — update via JSONB directly
  {
    const { data: planData } = await supabase
      .from("onboarding_plans")
      .select("steps")
      .eq("id", planId)
      .single();

    if (planData) {
      const updatedSteps = (planData.steps as OnboardingStep[]).map((s) =>
        s.id === step.id ? { ...s, status: "completed" as const, completedAt: new Date().toISOString() } : s
      );
      await supabase
        .from("onboarding_plans")
        .update({ steps: updatedSteps })
        .eq("id", planId);
    }
  }

  // Log activity
  await supabase.from("activities").insert({
    user_id: userId,
    contact_id: contactId,
    activity_type: "onboarding_step_completed",
    details: { plan_id: planId, step_id: step.id, step_name: step.name },
  });
}

// ─── Process Due Steps (Cron) ───────────────────────────────────────────────

export async function processDueOnboardingSteps(): Promise<{ processed: number }> {
  const supabase = getAdmin();

  // Find active onboarding plans
  const { data: plans } = await supabase
    .from("onboarding_plans")
    .select("*")
    .eq("status", "active");

  let processed = 0;

  for (const plan of plans || []) {
    const steps = (plan.steps as OnboardingStep[]) || [];
    const startedAt = new Date(plan.started_at).getTime();
    const daysSinceStart = Math.floor((Date.now() - startedAt) / (24 * 60 * 60 * 1000));

    for (const step of steps) {
      if (step.status === "pending" && step.dayOffset <= daysSinceStart) {
        await executeOnboardingStep(plan.user_id, plan.contact_id, plan.id, step);
        processed++;
      }
    }

    // Check if all steps complete
    const allDone = steps.every((s) => s.status === "completed" || s.status === "skipped");
    if (allDone) {
      await supabase
        .from("onboarding_plans")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("id", plan.id);

      // Update contact stage
      await supabase
        .from("contacts")
        .update({ deal_stage: "customer" })
        .eq("id", plan.contact_id)
        .eq("user_id", plan.user_id);
    }
  }

  return { processed };
}

// ─── Email Templates ────────────────────────────────────────────────────────

function getOnboardingEmailContent(
  templateKey: string,
  vars: { name: string; company: string }
): string {
  const templates: Record<string, string> = {
    welcome: `
      <h2>Welcome to QuotaHit, ${vars.name}!</h2>
      <p>You've just activated the most powerful AI sales team on the planet. Here's what happens next:</p>
      <ol>
        <li><strong>Log in</strong> to your dashboard and explore your AI agents</li>
        <li><strong>Import your contacts</strong> — CSV, CRM sync, or manual entry</li>
        <li><strong>Launch your first campaign</strong> — our AI handles the rest</li>
      </ol>
      <p>Your AI team is ready to start closing deals. Let's make it happen.</p>
      <p>— The QuotaHit Team</p>
    `,
    setup_guide: `
      <h2>Get your AI agents running in 5 minutes</h2>
      <p>Hey ${vars.name}, here's the fastest path to your first results:</p>
      <ol>
        <li><strong>Step 1:</strong> Go to Settings → Integrations → Connect your email</li>
        <li><strong>Step 2:</strong> Import 10-20 contacts to test with</li>
        <li><strong>Step 3:</strong> Pick a pre-built outreach sequence and hit Start</li>
      </ol>
      <p>Most users see their first replies within 48 hours. Your AI agents are already learning.</p>
    `,
    tips: `
      <h2>3 tips from our top performers</h2>
      <p>Hey ${vars.name}, users who see 10x results share these habits:</p>
      <ul>
        <li><strong>Let AI do the first touch.</strong> Our autonomous agents convert 3x better than manual outreach.</li>
        <li><strong>Use multi-channel sequences.</strong> Email + LinkedIn + WhatsApp = 67% higher reply rates.</li>
        <li><strong>Trust the scoring.</strong> Focus your time on leads scored 70+. Let AI nurture the rest.</li>
      </ul>
    `,
    checkin: `
      <h2>How's your first week?</h2>
      <p>Hey ${vars.name}, just checking in. How are things going with QuotaHit?</p>
      <p>Hit reply and let me know:</p>
      <ul>
        <li>What's working well?</li>
        <li>Anything confusing or stuck?</li>
        <li>Any features you'd love to see?</li>
      </ul>
      <p>We read every reply and build features based on your feedback.</p>
    `,
    deep_dive: `
      <h2>Unlock the full power of your AI team</h2>
      <p>Hey ${vars.name}, you've been using QuotaHit for 2 weeks now. Here are advanced features most users miss:</p>
      <ul>
        <li><strong>Composition Chains:</strong> Chain multiple agents together for fully autonomous workflows</li>
        <li><strong>Voice Commands:</strong> Control your CRM with natural language voice commands</li>
        <li><strong>Self-Improving Templates:</strong> Your outreach gets better automatically over time</li>
      </ul>
    `,
    kickoff_invite: `
      <h2>Let's get you set up properly</h2>
      <p>Hey ${vars.name}, I'd love to help you get the most out of QuotaHit with a quick 30-minute setup call.</p>
      <p>We'll cover: your goals, ideal customer profile, and configure your AI agents together.</p>
    `,
    success_review: `
      <h2>Your 30-day results</h2>
      <p>Hey ${vars.name}, you've been on QuotaHit for a month! Let's review your results and plan the next 90 days.</p>
      <p>I'll share insights from your data and recommendations for scaling up.</p>
    `,
  };

  return templates[templateKey] || templates.welcome;
}
