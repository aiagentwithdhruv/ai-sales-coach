/**
 * Item 16: Loadout Composition Engine
 *
 * Chains agents together dynamically based on lead profile, score, and mode.
 * 4 pre-defined composition chains:
 *   1. full-autonomous: Scout → Researcher → Qualifier → Outreach → Closer → Ops
 *   2. hybrid: Scout → Researcher → Qualifier → Outreach → [Human Rep] → Closer
 *   3. inbound: Qualifier → Outreach → Closer → Ops
 *   4. re-engagement: Researcher → Outreach (nurture sequence)
 *
 * Dynamic routing:
 *   - Score >= 70 → fast-track to outreach + calling
 *   - Score 40-70 → qualifier first, then route
 *   - Score < 40 → nurture sequence only
 *   - Mode A → full autonomous | Mode B → hybrid | Mode C → self-service (inbound)
 */

import { createClient } from "@supabase/supabase-js";

const getAdmin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

// ─── Chain Definitions ──────────────────────────────────────────────────────

export interface ChainStep {
  agent: string; // Agent type: scout, researcher, qualifier, outreach, closer, ops
  action: string; // Specific action to execute
  condition?: string; // Optional condition expression
  fallback?: string; // Fallback action if step fails
  config?: Record<string, unknown>; // Step-specific configuration
}

export interface CompositionChain {
  id: string;
  name: string;
  description: string;
  steps: ChainStep[];
  trigger: string; // Event that triggers this chain
  conditions: {
    minScore?: number;
    maxScore?: number;
    modes?: string[];
    stages?: string[];
  };
}

// Pre-defined chains
const COMPOSITION_CHAINS: CompositionChain[] = [
  {
    id: "full-autonomous",
    name: "Full Autonomous Pipeline",
    description: "End-to-end autonomous: enrich → score → qualify → outreach → close → onboard",
    trigger: "contact/created",
    conditions: { modes: ["A"], minScore: 0 },
    steps: [
      {
        agent: "researcher",
        action: "enrich_contact",
        config: { sources: ["linkedin", "company", "news"] },
      },
      {
        agent: "scorer",
        action: "score_lead",
        config: { threshold: 40 },
      },
      {
        agent: "qualifier",
        action: "qualify_bant",
        condition: "score >= 40",
        fallback: "enroll_nurture",
      },
      {
        agent: "outreach",
        action: "enroll_sequence",
        condition: "qualified",
        config: { sequence: "aggressive", channels: ["email", "linkedin", "whatsapp"] },
      },
      {
        agent: "caller",
        action: "autonomous_call",
        condition: "score >= 70 && has_phone",
        config: { priority: "high", callWindow: { startHour: 9, endHour: 18 } },
      },
      {
        agent: "closer",
        action: "generate_proposal",
        condition: "stage == negotiation",
      },
      {
        agent: "ops",
        action: "onboard_client",
        condition: "stage == won",
      },
    ],
  },
  {
    id: "hybrid",
    name: "Hybrid (AI + Human Rep)",
    description: "AI handles research + outreach, human rep takes over for closing",
    trigger: "contact/created",
    conditions: { modes: ["B"], minScore: 0 },
    steps: [
      {
        agent: "researcher",
        action: "enrich_contact",
        config: { sources: ["linkedin", "company"] },
      },
      {
        agent: "scorer",
        action: "score_lead",
      },
      {
        agent: "qualifier",
        action: "qualify_bant",
        condition: "score >= 30",
        fallback: "enroll_nurture",
      },
      {
        agent: "outreach",
        action: "enroll_sequence",
        condition: "qualified",
        config: { sequence: "standard_b2b", channels: ["email", "linkedin"] },
      },
      {
        agent: "human",
        action: "assign_to_rep",
        condition: "replied_positive",
        config: { notifyChannel: "email" },
      },
      {
        agent: "closer",
        action: "assist_proposal",
        condition: "stage == negotiation",
      },
    ],
  },
  {
    id: "inbound",
    name: "Inbound Lead Processing",
    description: "For leads that come to us: qualify → nurture → close",
    trigger: "contact/created",
    conditions: { modes: ["C"], minScore: 0 },
    steps: [
      {
        agent: "qualifier",
        action: "qualify_bant",
        config: { mode: "conversational" },
      },
      {
        agent: "outreach",
        action: "enroll_sequence",
        condition: "qualified",
        config: { sequence: "nurture", channels: ["email"] },
      },
      {
        agent: "closer",
        action: "generate_proposal",
        condition: "stage == negotiation",
      },
      {
        agent: "ops",
        action: "onboard_client",
        condition: "stage == won",
      },
    ],
  },
  {
    id: "re-engagement",
    name: "Re-Engagement Campaign",
    description: "Re-activate cold/lost leads with fresh approach",
    trigger: "lead/re-engage",
    conditions: { stages: ["lost", "cold"] },
    steps: [
      {
        agent: "researcher",
        action: "refresh_enrichment",
        config: { lookForChanges: true },
      },
      {
        agent: "scorer",
        action: "rescore_lead",
      },
      {
        agent: "outreach",
        action: "enroll_sequence",
        config: { sequence: "re_engagement", channels: ["email"] },
      },
    ],
  },
];

// ─── Chain Selection ────────────────────────────────────────────────────────

export function selectChain(params: {
  mode?: string;
  score?: number;
  stage?: string;
  source?: string;
}): CompositionChain {
  const { mode, score, stage } = params;

  // Re-engagement for lost/cold leads
  if (stage === "lost" || stage === "cold") {
    return COMPOSITION_CHAINS.find((c) => c.id === "re-engagement")!;
  }

  // Mode-based selection
  if (mode === "A") {
    return COMPOSITION_CHAINS.find((c) => c.id === "full-autonomous")!;
  }
  if (mode === "B") {
    return COMPOSITION_CHAINS.find((c) => c.id === "hybrid")!;
  }
  if (mode === "C") {
    return COMPOSITION_CHAINS.find((c) => c.id === "inbound")!;
  }

  // Score-based fallback
  if ((score || 0) >= 70) {
    return COMPOSITION_CHAINS.find((c) => c.id === "full-autonomous")!;
  }
  if ((score || 0) >= 40) {
    return COMPOSITION_CHAINS.find((c) => c.id === "hybrid")!;
  }
  return COMPOSITION_CHAINS.find((c) => c.id === "inbound")!;
}

// ─── Chain Executor ─────────────────────────────────────────────────────────

export interface ChainExecutionResult {
  chainId: string;
  completed: number;
  skipped: number;
  failed: number;
  steps: Array<{
    agent: string;
    action: string;
    status: "completed" | "skipped" | "failed";
    result?: unknown;
    error?: string;
  }>;
  nextStep?: ChainStep;
}

export async function executeChainStep(
  userId: string,
  contactId: string,
  chain: CompositionChain,
  stepIndex: number,
  context: Record<string, unknown> = {}
): Promise<{
  status: "completed" | "skipped" | "failed";
  result?: unknown;
  error?: string;
  nextStepIndex?: number;
}> {
  if (stepIndex >= chain.steps.length) {
    return { status: "completed", result: { chainComplete: true } };
  }

  const step = chain.steps[stepIndex];

  // Evaluate condition
  if (step.condition && !evaluateCondition(step.condition, context)) {
    // Condition not met — skip or use fallback
    if (step.fallback) {
      return {
        status: "completed",
        result: { fallbackUsed: step.fallback },
        nextStepIndex: stepIndex + 1,
      };
    }
    return { status: "skipped", nextStepIndex: stepIndex + 1 };
  }

  const supabase = getAdmin();

  try {
    // Map agent actions to actual Inngest events
    const eventMap: Record<string, string> = {
      enrich_contact: "contact/created",
      score_lead: "lead/scored",
      qualify_bant: "lead/qualified",
      enroll_sequence: "outreach/enroll",
      autonomous_call: "call/initiated",
      generate_proposal: "proposal/generate",
      onboard_client: "client/onboard",
      assign_to_rep: "lead/routed",
      enroll_nurture: "outreach/enroll",
      refresh_enrichment: "contact/enriched",
      rescore_lead: "lead/scored",
      assist_proposal: "proposal/generate",
    };

    // Log the step execution
    await supabase.from("activities").insert({
      user_id: userId,
      contact_id: contactId,
      activity_type: "chain_step_executed",
      details: {
        chain_id: chain.id,
        step_index: stepIndex,
        agent: step.agent,
        action: step.action,
        config: step.config,
      },
    });

    // Store chain progress
    await supabase.from("chain_executions").upsert({
      user_id: userId,
      contact_id: contactId,
      chain_id: chain.id,
      current_step: stepIndex,
      status: "running",
      context,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id,contact_id,chain_id" });

    return {
      status: "completed",
      result: {
        agent: step.agent,
        action: step.action,
        event: eventMap[step.action] || step.action,
      },
      nextStepIndex: stepIndex + 1,
    };
  } catch (err) {
    return {
      status: "failed",
      error: err instanceof Error ? err.message : "Step execution failed",
      nextStepIndex: stepIndex + 1,
    };
  }
}

// ─── Condition Evaluator ────────────────────────────────────────────────────

function evaluateCondition(condition: string, context: Record<string, unknown>): boolean {
  // Simple condition evaluator for chain steps
  const score = (context.score as number) || 0;
  const stage = (context.stage as string) || "";
  const hasPhone = !!(context.phone || context.has_phone);
  const qualified = context.qualified === true || context.outcome === "qualified";
  const repliedPositive = context.sentiment === "positive" && context.replied === true;

  switch (condition) {
    case "score >= 70 && has_phone":
      return score >= 70 && hasPhone;
    case "score >= 70":
      return score >= 70;
    case "score >= 40":
      return score >= 40;
    case "score >= 30":
      return score >= 30;
    case "qualified":
      return qualified;
    case "replied_positive":
      return repliedPositive;
    case "stage == negotiation":
      return stage === "negotiation";
    case "stage == won":
      return stage === "won";
    default:
      // Unknown condition — pass through
      return true;
  }
}

// ─── Get Chain Status ───────────────────────────────────────────────────────

export async function getChainStatus(
  userId: string,
  contactId: string
): Promise<{
  activeChain?: string;
  currentStep?: number;
  totalSteps?: number;
  status?: string;
} | null> {
  const supabase = getAdmin();

  const { data } = await supabase
    .from("chain_executions")
    .select("chain_id, current_step, status")
    .eq("user_id", userId)
    .eq("contact_id", contactId)
    .eq("status", "running")
    .single();

  if (!data) return null;

  const chain = COMPOSITION_CHAINS.find((c) => c.id === data.chain_id);

  return {
    activeChain: data.chain_id,
    currentStep: data.current_step,
    totalSteps: chain?.steps.length || 0,
    status: data.status,
  };
}

// ─── List Available Chains ──────────────────────────────────────────────────

export function listChains(): Array<{
  id: string;
  name: string;
  description: string;
  stepCount: number;
  agents: string[];
}> {
  return COMPOSITION_CHAINS.map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description,
    stepCount: c.steps.length,
    agents: [...new Set(c.steps.map((s) => s.agent))],
  }));
}
