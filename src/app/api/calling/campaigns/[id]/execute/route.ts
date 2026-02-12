import { NextRequest } from "next/server";
import { authenticateUser } from "@/lib/crm/contacts";
import { isTwilioConfigured } from "@/lib/calling/twilio";
import {
  startCampaignExecution,
  executeNextCampaignCall,
} from "@/lib/calling/campaign-executor";

const jsonHeaders = { "Content-Type": "application/json" };

/**
 * POST /api/calling/campaigns/[id]/execute
 *
 * Start or continue campaign execution.
 * - First call: initializes progress tracking and starts calling
 * - Subsequent calls: picks the next pending contact and calls them
 * - Chain calls (from status webhook): auto-continues the campaign
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: campaignId } = await params;

  // Check if this is an internal chain call (from the status webhook)
  const isChainCall = req.headers.get("X-Campaign-Chain") === "true";

  let userId: string;

  if (isChainCall) {
    // Internal chain call — userId comes from request body
    const body = await req.json();
    userId = body.userId;
    if (!userId) {
      return new Response(JSON.stringify({ error: "Missing userId in chain call" }), {
        status: 400,
        headers: jsonHeaders,
      });
    }
  } else {
    // External call — authenticate normally
    const auth = await authenticateUser(req.headers.get("authorization"));
    if ("error" in auth) {
      return new Response(JSON.stringify({ error: auth.error }), {
        status: auth.status,
        headers: jsonHeaders,
      });
    }
    userId = auth.userId;
  }

  // Check Twilio config
  if (!isTwilioConfigured()) {
    return new Response(
      JSON.stringify({
        error: "Twilio not configured",
        details: "Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER.",
      }),
      { status: 503, headers: jsonHeaders }
    );
  }

  // Determine if this is a start or continue
  const body = isChainCall ? {} : await req.json().catch(() => ({}));
  const action = (body as Record<string, unknown>).action || "continue";

  if (action === "start") {
    // Initialize campaign execution
    const result = await startCampaignExecution(userId, campaignId);
    if (!result.success) {
      return new Response(JSON.stringify({ error: result.error }), {
        status: 400,
        headers: jsonHeaders,
      });
    }
  }

  // Execute the next call
  const result = await executeNextCampaignCall(userId, campaignId);

  if (result.done) {
    return new Response(
      JSON.stringify({ status: "completed", message: "All contacts have been called" }),
      { status: 200, headers: jsonHeaders }
    );
  }

  if (result.called) {
    return new Response(
      JSON.stringify({
        status: "calling",
        contact: result.contact?.name,
        phone: result.contact?.phone,
        callId: result.callId,
      }),
      { status: 200, headers: jsonHeaders }
    );
  }

  return new Response(
    JSON.stringify({
      status: "error",
      error: result.error || "Failed to execute call",
    }),
    { status: 500, headers: jsonHeaders }
  );
}
