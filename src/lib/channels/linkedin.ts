/**
 * Item 10: LinkedIn Outreach
 *
 * Automated connection requests + personalized DMs.
 * Phase 2: Uses Phantombuster/Waalaxy API proxy (fastest to ship).
 * Phase 5+: Replaces with direct LinkedIn API.
 *
 * LinkedIn is the highest-converting B2B channel but most rate-limited.
 * AI must be strategic about who gets a connection request.
 */

import { createClient } from "@supabase/supabase-js";

const getAdmin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

// ─── Types ─────────────────────────────────────────────────────────────────

interface ContactForLinkedIn {
  id: string;
  first_name?: string;
  last_name?: string;
  company?: string;
  title?: string;
  enrichment_data?: Record<string, unknown>;
  custom_fields?: Record<string, unknown>;
}

interface LinkedInSendResult {
  success: boolean;
  action: "connection_request" | "direct_message" | "skipped";
  error?: string;
}

// ─── Limits ────────────────────────────────────────────────────────────────

const LINKEDIN_LIMITS = {
  connections_per_day: 25,
  messages_per_day: 50,
  max_note_length: 300, // LinkedIn connection request note limit
  max_dm_length: 8000,
};

// ─── Send Functions ────────────────────────────────────────────────────────

export async function sendLinkedIn(
  contact: ContactForLinkedIn,
  userId: string,
  templateName: string
): Promise<LinkedInSendResult> {
  // Get LinkedIn URL from enrichment or custom fields
  const linkedinUrl = getLinkedInUrl(contact);

  if (!linkedinUrl) {
    return { success: false, action: "skipped", error: "No LinkedIn URL found" };
  }

  // Check daily limits
  const withinLimit = await checkDailyLimit(userId, templateName === "connection_request" ? "connection" : "message");
  if (!withinLimit) {
    return { success: false, action: "skipped", error: "Daily LinkedIn limit reached" };
  }

  // Determine if connection request or DM
  const isConnectionRequest = templateName === "connection_request" || templateName === "reconnect";

  // Generate personalized message
  const { generateLinkedInDM } = await import("@/lib/outreach/templates");
  const template = await generateLinkedInDM(contact, isConnectionRequest, "friendly");

  if (isConnectionRequest) {
    return sendConnectionRequest(contact, userId, linkedinUrl, template.body);
  } else {
    return sendDirectMessage(contact, userId, linkedinUrl, template.body);
  }
}

async function sendConnectionRequest(
  contact: ContactForLinkedIn,
  userId: string,
  linkedinUrl: string,
  note: string
): Promise<LinkedInSendResult> {
  // Trim note to LinkedIn's limit
  const trimmedNote = note.substring(0, LINKEDIN_LIMITS.max_note_length);

  // Check if we have Phantombuster configured
  const phantombusterKey = process.env.PHANTOMBUSTER_API_KEY;
  const waalaxyKey = process.env.WAALAXY_API_KEY;

  if (phantombusterKey) {
    return sendViaPhantombuster(contact, userId, linkedinUrl, trimmedNote, "connect");
  } else if (waalaxyKey) {
    return sendViaWaalaxy(contact, userId, linkedinUrl, trimmedNote, "connect");
  }

  // Fallback: queue for manual or log as planned
  return queueLinkedInAction(contact, userId, linkedinUrl, trimmedNote, "connection_request");
}

async function sendDirectMessage(
  contact: ContactForLinkedIn,
  userId: string,
  linkedinUrl: string,
  message: string
): Promise<LinkedInSendResult> {
  const phantombusterKey = process.env.PHANTOMBUSTER_API_KEY;
  const waalaxyKey = process.env.WAALAXY_API_KEY;

  if (phantombusterKey) {
    return sendViaPhantombuster(contact, userId, linkedinUrl, message, "message");
  } else if (waalaxyKey) {
    return sendViaWaalaxy(contact, userId, linkedinUrl, message, "message");
  }

  return queueLinkedInAction(contact, userId, linkedinUrl, message, "direct_message");
}

// ─── Phantombuster Integration ─────────────────────────────────────────────

async function sendViaPhantombuster(
  contact: ContactForLinkedIn,
  userId: string,
  linkedinUrl: string,
  message: string,
  action: "connect" | "message"
): Promise<LinkedInSendResult> {
  const apiKey = process.env.PHANTOMBUSTER_API_KEY!;
  const agentId = action === "connect"
    ? process.env.PHANTOMBUSTER_CONNECT_AGENT_ID
    : process.env.PHANTOMBUSTER_MESSAGE_AGENT_ID;

  if (!agentId) {
    return queueLinkedInAction(contact, userId, linkedinUrl, message, action === "connect" ? "connection_request" : "direct_message");
  }

  try {
    const res = await fetch("https://api.phantombuster.com/api/v2/agents/launch", {
      method: "POST",
      headers: {
        "X-Phantombuster-Key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: agentId,
        argument: JSON.stringify({
          spreadsheetUrl: linkedinUrl,
          message: message,
        }),
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      return {
        success: false,
        action: action === "connect" ? "connection_request" : "direct_message",
        error: `Phantombuster error: ${text}`,
      };
    }

    await logLinkedInActivity(userId, contact.id, action, linkedinUrl, message);
    await incrementDailyCount(userId, action === "connect" ? "connection" : "message");

    return {
      success: true,
      action: action === "connect" ? "connection_request" : "direct_message",
    };
  } catch (err) {
    return {
      success: false,
      action: action === "connect" ? "connection_request" : "direct_message",
      error: err instanceof Error ? err.message : "Phantombuster failed",
    };
  }
}

// ─── Waalaxy Integration ───────────────────────────────────────────────────

async function sendViaWaalaxy(
  contact: ContactForLinkedIn,
  userId: string,
  linkedinUrl: string,
  message: string,
  action: "connect" | "message"
): Promise<LinkedInSendResult> {
  const apiKey = process.env.WAALAXY_API_KEY!;

  try {
    const endpoint = action === "connect"
      ? "https://api.waalaxy.com/api/v1/prospect/connection"
      : "https://api.waalaxy.com/api/v1/prospect/message";

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        linkedin_url: linkedinUrl,
        message: message,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      return {
        success: false,
        action: action === "connect" ? "connection_request" : "direct_message",
        error: `Waalaxy error: ${text}`,
      };
    }

    await logLinkedInActivity(userId, contact.id, action, linkedinUrl, message);
    await incrementDailyCount(userId, action === "connect" ? "connection" : "message");

    return {
      success: true,
      action: action === "connect" ? "connection_request" : "direct_message",
    };
  } catch (err) {
    return {
      success: false,
      action: action === "connect" ? "connection_request" : "direct_message",
      error: err instanceof Error ? err.message : "Waalaxy failed",
    };
  }
}

// ─── Queue for Manual (Fallback) ───────────────────────────────────────────

async function queueLinkedInAction(
  contact: ContactForLinkedIn,
  userId: string,
  linkedinUrl: string,
  message: string,
  action: "connection_request" | "direct_message"
): Promise<LinkedInSendResult> {
  const supabase = getAdmin();

  // Store in activities as a queued action for manual execution
  await supabase.from("activities").insert({
    user_id: userId,
    contact_id: contact.id,
    activity_type: "linkedin_queued",
    details: {
      action,
      linkedin_url: linkedinUrl,
      message,
      status: "pending_manual",
    },
  });

  return {
    success: true, // Queued successfully (not sent yet)
    action,
  };
}

// ─── Connection Status ─────────────────────────────────────────────────────

export async function checkConnectionStatus(
  contactId: string,
  userId: string
): Promise<"connected" | "pending" | "not_connected" | "unknown"> {
  const supabase = getAdmin();
  const { data } = await supabase
    .from("activities")
    .select("activity_type, details")
    .eq("contact_id", contactId)
    .eq("user_id", userId)
    .in("activity_type", ["linkedin_connect_sent", "linkedin_connected"])
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!data) return "not_connected";
  if (data.activity_type === "linkedin_connected") return "connected";
  if (data.activity_type === "linkedin_connect_sent") return "pending";
  return "unknown";
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function getLinkedInUrl(contact: ContactForLinkedIn): string | null {
  // Check enrichment data
  const enrichment = contact.enrichment_data as Record<string, unknown> | undefined;
  if (enrichment?.linkedin_url) return enrichment.linkedin_url as string;

  // Check custom fields
  const custom = contact.custom_fields as Record<string, unknown> | undefined;
  if (custom?.linkedin_url) return custom.linkedin_url as string;
  if (custom?.linkedin) return custom.linkedin as string;

  return null;
}

async function checkDailyLimit(userId: string, type: "connection" | "message"): Promise<boolean> {
  const supabase = getAdmin();
  const today = new Date().toISOString().split("T")[0];

  const activityType = type === "connection" ? "linkedin_connect_sent" : "linkedin_message_sent";
  const { count } = await supabase
    .from("activities")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("activity_type", activityType)
    .gte("created_at", `${today}T00:00:00`);

  const limit = type === "connection" ? LINKEDIN_LIMITS.connections_per_day : LINKEDIN_LIMITS.messages_per_day;
  return (count || 0) < limit;
}

async function incrementDailyCount(userId: string, type: "connection" | "message"): Promise<void> {
  // Count is tracked via activities log — no separate counter needed
  // The checkDailyLimit function counts activities for today
  void userId;
  void type;
}

async function logLinkedInActivity(
  userId: string,
  contactId: string,
  action: "connect" | "message",
  linkedinUrl: string,
  message: string
): Promise<void> {
  const supabase = getAdmin();
  await supabase.from("activities").insert({
    user_id: userId,
    contact_id: contactId,
    activity_type: action === "connect" ? "linkedin_connect_sent" : "linkedin_message_sent",
    details: {
      linkedin_url: linkedinUrl,
      message: message.substring(0, 500),
    },
  });
}
