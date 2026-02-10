import { NextRequest } from "next/server";
import { authenticateUser } from "@/lib/crm/contacts";
import { getActiveAgent } from "@/lib/crm/agents";
import { createCall, updateCall } from "@/lib/crm/calling";
import { isTwilioConfigured, initiateOutboundCall } from "@/lib/calling/twilio";
import { initConversation, getAgentGreeting } from "@/lib/calling/pipeline";

const jsonHeaders = { "Content-Type": "application/json" };

// POST /api/calls/outbound — Initiate a single outbound AI call
export async function POST(req: NextRequest) {
  const auth = await authenticateUser(req.headers.get("authorization"));
  if ("error" in auth) {
    return new Response(JSON.stringify({ error: auth.error }), { status: auth.status, headers: jsonHeaders });
  }

  // Check Twilio config
  if (!isTwilioConfigured()) {
    return new Response(
      JSON.stringify({
        error: "Twilio not configured",
        details: "Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER environment variables.",
      }),
      { status: 503, headers: jsonHeaders }
    );
  }

  const body = await req.json();
  const { to, agentId, campaignId, contactId, contactName, contactCompany } = body;

  if (!to) {
    return new Response(JSON.stringify({ error: "Phone number (to) is required" }), { status: 400, headers: jsonHeaders });
  }
  if (!agentId) {
    return new Response(JSON.stringify({ error: "agentId is required" }), { status: 400, headers: jsonHeaders });
  }

  // Get the AI agent
  const agent = await getActiveAgent(auth.userId, agentId);
  if (!agent) {
    return new Response(JSON.stringify({ error: "Agent not found or inactive" }), { status: 404, headers: jsonHeaders });
  }

  // Create call record in DB
  const call = await createCall(auth.userId, {
    direction: "outbound",
    agent_id: agentId,
    campaign_id: campaignId || null,
    contact_id: contactId || null,
    contact_name: contactName || null,
    to_number: to,
    from_number: process.env.TWILIO_PHONE_NUMBER || null,
    status: "queued",
    phone_number: to,
  });

  if (!call) {
    return new Response(JSON.stringify({ error: "Failed to create call record" }), { status: 500, headers: jsonHeaders });
  }

  // Determine webhook base URL
  const webhookBaseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";

  try {
    // Initialize conversation pipeline
    initConversation(call.id, agent, {
      name: contactName,
      company: contactCompany,
    });

    // Initiate Twilio call
    const twilioResult = await initiateOutboundCall({
      to,
      webhookBaseUrl,
      callId: call.id,
      agentId: agent.id,
    });

    // Update call with Twilio SID
    await updateCall(auth.userId, call.id, {
      twilio_call_sid: twilioResult.callSid,
      status: "ringing",
    } as Record<string, unknown>);

    const greeting = getAgentGreeting(agent, { name: contactName, company: contactCompany });

    return new Response(
      JSON.stringify({
        callId: call.id,
        callSid: twilioResult.callSid,
        status: "ringing",
        agent: agent.name,
        greeting,
      }),
      { status: 201, headers: jsonHeaders }
    );
  } catch (error) {
    // Update call as failed
    await updateCall(auth.userId, call.id, {
      status: "failed",
      metadata: { error: error instanceof Error ? error.message : "Unknown error" },
    } as Record<string, unknown>);

    return new Response(
      JSON.stringify({
        error: "Failed to initiate call",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: jsonHeaders }
    );
  }
}
