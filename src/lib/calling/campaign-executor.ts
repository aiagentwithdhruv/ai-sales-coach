/**
 * Campaign Batch Execution Engine
 *
 * Orchestrates calling all contacts in a campaign sequentially.
 * Runs server-side, respects max_concurrent, retry logic, and pause/resume.
 *
 * Architecture: Since this runs on Vercel (serverless), we use a "chain" approach:
 * Each call completion triggers the next call via internal API, rather than
 * a long-running loop. The status webhook already handles post-call analysis.
 *
 * Campaign contacts are stored in contact_list_filter.contacts[] JSONB.
 * Progress is tracked via contact_list_filter.progress object.
 */

import { createClient } from "@supabase/supabase-js";
import type { AICallCampaign, AICall } from "@/types/teams";

const getAdmin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getProgress(filter: Record<string, unknown>): Record<string, unknown> {
  return (filter?.progress || {}) as Record<string, unknown>;
}

function getStatuses(filter: Record<string, unknown>): ContactCallStatus[] {
  const prog = getProgress(filter);
  return (prog.contactStatuses || []) as ContactCallStatus[];
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CampaignContact {
  name: string;
  phone: string;
  email?: string;
  company?: string;
  notes?: string;
  contact_id?: string; // CRM contact ID if imported from CRM/Zoho
}

export interface ContactCallStatus {
  phone: string;
  status: "pending" | "calling" | "completed" | "failed" | "skipped" | "retry";
  callId?: string;
  outcome?: string;
  attempts: number;
  lastAttemptAt?: string;
  error?: string;
}

export interface CampaignProgress {
  total: number;
  completed: number;
  failed: number;
  skipped: number;
  remaining: number;
  inProgress: boolean;
  currentContact?: string;
  contactStatuses: ContactCallStatus[];
  startedAt?: string;
  pausedAt?: string;
  completedAt?: string;
}

// ─── Get Campaign Progress ───────────────────────────────────────────────────

export async function getCampaignProgress(
  campaignId: string
): Promise<CampaignProgress | null> {
  const supabase = getAdmin();

  const { data: campaign } = await supabase
    .from("ai_call_campaigns")
    .select("contact_list_filter, status")
    .eq("id", campaignId)
    .single();

  if (!campaign) return null;

  const filter = campaign.contact_list_filter as Record<string, unknown>;
  const contacts = (filter?.contacts || []) as CampaignContact[];
  const statuses = getStatuses(filter);
  const prog = getProgress(filter);

  const completed = statuses.filter((s) => s.status === "completed").length;
  const failed = statuses.filter((s) => s.status === "failed").length;
  const skipped = statuses.filter((s) => s.status === "skipped").length;
  const calling = statuses.filter((s) => s.status === "calling").length;

  return {
    total: contacts.length,
    completed,
    failed,
    skipped,
    remaining: contacts.length - completed - failed - skipped,
    inProgress: campaign.status === "active" && calling > 0,
    currentContact: statuses.find((s) => s.status === "calling")?.phone,
    contactStatuses: statuses,
    startedAt: prog.startedAt as string | undefined,
    pausedAt: prog.pausedAt as string | undefined,
    completedAt: prog.completedAt as string | undefined,
  };
}

// ─── Initialize Campaign Execution ──────────────────────────────────────────

export async function startCampaignExecution(
  userId: string,
  campaignId: string
): Promise<{ success: boolean; error?: string; nextContact?: CampaignContact }> {
  const supabase = getAdmin();

  // Get campaign
  const { data: campaign } = await supabase
    .from("ai_call_campaigns")
    .select("*")
    .eq("id", campaignId)
    .eq("user_id", userId)
    .single();

  if (!campaign) {
    return { success: false, error: "Campaign not found" };
  }

  if (!campaign.agent_id) {
    return { success: false, error: "No AI agent assigned to this campaign. Assign an agent first." };
  }

  const filter = campaign.contact_list_filter as Record<string, unknown>;
  const contacts = (filter?.contacts || []) as CampaignContact[];

  if (contacts.length === 0) {
    return { success: false, error: "No contacts imported. Import contacts before starting." };
  }

  // Initialize contact statuses if not already set
  let statuses = getStatuses(filter);
  const isResuming = statuses.length > 0;

  if (!isResuming) {
    // First time — initialize all contacts as pending
    statuses = contacts.map((c) => ({
      phone: c.phone,
      status: "pending" as const,
      attempts: 0,
    }));
  } else {
    // Resuming — reset any "calling" statuses back to "pending" (in case of crash)
    statuses = statuses.map((s) =>
      s.status === "calling" ? { ...s, status: "pending" as const } : s
    );
  }

  // Update campaign status to active + save initial progress
  await supabase
    .from("ai_call_campaigns")
    .update({
      status: "active",
      contact_list_filter: {
        ...filter,
        progress: {
          contactStatuses: statuses,
          startedAt: isResuming
            ? (getProgress(filter).startedAt || new Date().toISOString())
            : new Date().toISOString(),
          pausedAt: null,
        },
      },
    })
    .eq("id", campaignId);

  // Find the next contact to call
  const nextIdx = statuses.findIndex(
    (s) => s.status === "pending" || s.status === "retry"
  );

  if (nextIdx === -1) {
    // All contacts already processed
    await supabase
      .from("ai_call_campaigns")
      .update({ status: "completed" })
      .eq("id", campaignId);
    return { success: true };
  }

  return {
    success: true,
    nextContact: contacts[nextIdx],
  };
}

// ─── Execute Next Call in Campaign ──────────────────────────────────────────

export async function executeNextCampaignCall(
  userId: string,
  campaignId: string
): Promise<{
  called: boolean;
  contact?: CampaignContact;
  callId?: string;
  done?: boolean;
  error?: string;
}> {
  const supabase = getAdmin();

  // Re-fetch campaign to check if still active
  const { data: campaign } = await supabase
    .from("ai_call_campaigns")
    .select("*")
    .eq("id", campaignId)
    .eq("user_id", userId)
    .single();

  if (!campaign) {
    return { called: false, error: "Campaign not found" };
  }

  // If campaign was paused or completed, stop
  if (campaign.status !== "active") {
    return { called: false, done: true, error: `Campaign is ${campaign.status}` };
  }

  const filter = campaign.contact_list_filter as Record<string, unknown>;
  const contacts = (filter?.contacts || []) as CampaignContact[];
  const statuses = getStatuses(filter);

  if (contacts.length === 0 || statuses.length === 0) {
    return { called: false, error: "No contacts to call" };
  }

  // Find next pending/retry contact
  const nextIdx = statuses.findIndex(
    (s) => s.status === "pending" || s.status === "retry"
  );

  if (nextIdx === -1) {
    // All done — mark campaign complete
    await supabase
      .from("ai_call_campaigns")
      .update({
        status: "completed",
        contact_list_filter: {
          ...filter,
          progress: {
            ...getProgress(filter),
            completedAt: new Date().toISOString(),
          },
        },
      })
      .eq("id", campaignId);

    return { called: false, done: true };
  }

  const contact = contacts[nextIdx];
  const maxRetries = campaign.retry_attempts || 3;

  // Skip if exceeded retry limit
  if (statuses[nextIdx].attempts >= maxRetries && statuses[nextIdx].status === "retry") {
    statuses[nextIdx].status = "failed";
    statuses[nextIdx].error = "Max retry attempts exceeded";

    await updateCampaignProgress(campaignId, filter, statuses);

    // Recurse to next contact
    return executeNextCampaignCall(userId, campaignId);
  }

  // Mark contact as "calling"
  statuses[nextIdx].status = "calling";
  statuses[nextIdx].attempts += 1;
  statuses[nextIdx].lastAttemptAt = new Date().toISOString();

  await updateCampaignProgress(campaignId, filter, statuses);

  // Make the actual call via internal API
  try {
    const webhookBaseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

    // Import and call directly (server-to-server, no HTTP roundtrip)
    const { createCall } = await import("@/lib/crm/calling");
    const { getActiveAgent } = await import("@/lib/crm/agents");
    const { initiateOutboundCall } = await import("@/lib/calling/twilio");
    const { initConversation, getAgentGreeting } = await import("@/lib/calling/pipeline");

    const agent = await getActiveAgent(userId, campaign.agent_id!);
    if (!agent) {
      statuses[nextIdx].status = "failed";
      statuses[nextIdx].error = "Agent not found or inactive";
      await updateCampaignProgress(campaignId, filter, statuses);
      return executeNextCampaignCall(userId, campaignId);
    }

    // Create call record
    const call = await createCall(userId, {
      direction: "outbound",
      agent_id: campaign.agent_id!,
      campaign_id: campaignId,
      contact_id: contact.contact_id || null,
      contact_name: contact.name,
      to_number: contact.phone,
      from_number: process.env.TWILIO_PHONE_NUMBER || null,
      status: "queued",
      phone_number: contact.phone,
    } as Partial<AICall> & { direction: string });

    if (!call) {
      statuses[nextIdx].status = "retry";
      statuses[nextIdx].error = "Failed to create call record";
      await updateCampaignProgress(campaignId, filter, statuses);
      return { called: false, error: "Failed to create call record" };
    }

    // Initialize conversation
    initConversation(call.id, agent, {
      name: contact.name,
      company: contact.company,
    });

    // Initiate Twilio call
    const twilioResult = await initiateOutboundCall({
      to: contact.phone,
      webhookBaseUrl,
      callId: call.id,
      agentId: agent.id,
    });

    // Update call with SID
    const { updateCall } = await import("@/lib/crm/calling");
    await updateCall(userId, call.id, {
      twilio_call_sid: twilioResult.callSid,
      status: "ringing",
    } as Partial<AICall>);

    // Save callId in contact status for tracking
    statuses[nextIdx].callId = call.id;
    await updateCampaignProgress(campaignId, filter, statuses);

    return {
      called: true,
      contact,
      callId: call.id,
    };
  } catch (err) {
    // Mark as retry on error
    statuses[nextIdx].status = "retry";
    statuses[nextIdx].error = err instanceof Error ? err.message : "Call initiation failed";
    await updateCampaignProgress(campaignId, filter, statuses);

    return {
      called: false,
      error: err instanceof Error ? err.message : "Call initiation failed",
    };
  }
}

// ─── Handle Call Completion (called from status webhook) ────────────────────

export async function onCampaignCallCompleted(
  campaignId: string,
  callId: string,
  outcome: string,
  userId: string
): Promise<void> {
  const supabase = getAdmin();

  const { data: campaign } = await supabase
    .from("ai_call_campaigns")
    .select("*")
    .eq("id", campaignId)
    .single();

  if (!campaign) return;

  const filter = campaign.contact_list_filter as Record<string, unknown>;
  const statuses = getStatuses(filter);

  // Find the contact that just finished
  const idx = statuses.findIndex((s) => s.callId === callId);
  if (idx === -1) return;

  // Determine if we should retry based on outcome
  const retryableOutcomes = ["no_answer", "voicemail"];
  const maxRetries = campaign.retry_attempts || 3;

  if (retryableOutcomes.includes(outcome) && statuses[idx].attempts < maxRetries) {
    statuses[idx].status = "retry";
  } else {
    statuses[idx].status = "completed";
    statuses[idx].outcome = outcome;
  }

  await updateCampaignProgress(campaignId, filter, statuses);

  // Check if campaign is still active and should continue
  if (campaign.status !== "active") return;

  // Check if there are more contacts to call
  const hasMore = statuses.some((s) => s.status === "pending" || s.status === "retry");

  if (!hasMore) {
    // Campaign complete
    await supabase
      .from("ai_call_campaigns")
      .update({
        status: "completed",
        contact_list_filter: {
          ...filter,
          progress: {
            ...getProgress(filter),
            contactStatuses: statuses,
            completedAt: new Date().toISOString(),
          },
        },
      })
      .eq("id", campaignId);
    return;
  }

  // Delay before next call (to avoid rate limiting and give time between calls)
  const delayMs = (campaign.retry_delay_minutes || 1) * 1000; // Use retry_delay as inter-call delay in seconds
  // For retry contacts, use the actual retry delay in minutes
  const nextContact = statuses.find((s) => s.status === "pending" || s.status === "retry");
  const actualDelay = nextContact?.status === "retry"
    ? (campaign.retry_delay_minutes || 60) * 60 * 1000
    : 5000; // 5 second delay between normal calls

  // Trigger the next call via a fire-and-forget fetch to our own API
  // This creates a chain: call completes → webhook → triggers next call
  const webhookBaseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

  // For retries, we skip them for now and call the next pending contact
  // Retries will be picked up when all pending contacts are done
  if (nextContact?.status === "retry" && statuses.some((s) => s.status === "pending")) {
    // There are still pending contacts — skip retries for now
    // Do nothing here; the execute endpoint will be called by the frontend polling
  } else {
    // Small delay then trigger next
    setTimeout(async () => {
      try {
        await fetch(`${webhookBaseUrl}/api/calling/campaigns/${campaignId}/execute`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Campaign-Chain": "true", // Internal chain call
          },
          body: JSON.stringify({ userId }),
        });
      } catch {
        // Chain call failed — frontend polling will pick up and retry
      }
    }, actualDelay);
  }
}

// ─── Pause Campaign ─────────────────────────────────────────────────────────

export async function pauseCampaignExecution(
  userId: string,
  campaignId: string
): Promise<boolean> {
  const supabase = getAdmin();

  const { data: campaign } = await supabase
    .from("ai_call_campaigns")
    .select("contact_list_filter")
    .eq("id", campaignId)
    .eq("user_id", userId)
    .single();

  if (!campaign) return false;

  const filter = campaign.contact_list_filter as Record<string, unknown>;
  const statuses = getStatuses(filter);

  // Reset any "calling" status back to "pending" (current call will still complete via webhook)
  const updatedStatuses = statuses.map((s) =>
    s.status === "calling" ? { ...s, status: "pending" as const } : s
  );

  await supabase
    .from("ai_call_campaigns")
    .update({
      status: "paused",
      contact_list_filter: {
        ...filter,
        progress: {
          ...getProgress(filter),
          contactStatuses: updatedStatuses,
          pausedAt: new Date().toISOString(),
        },
      },
    })
    .eq("id", campaignId);

  return true;
}

// ─── Helper: Update Campaign Progress ───────────────────────────────────────

async function updateCampaignProgress(
  campaignId: string,
  filter: Record<string, unknown>,
  statuses: ContactCallStatus[]
): Promise<void> {
  const supabase = getAdmin();

  await supabase
    .from("ai_call_campaigns")
    .update({
      contact_list_filter: {
        ...filter,
        progress: {
          ...getProgress(filter),
          contactStatuses: statuses,
        },
      },
    })
    .eq("id", campaignId);
}
