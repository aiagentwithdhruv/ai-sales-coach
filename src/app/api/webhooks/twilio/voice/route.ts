import { NextRequest } from "next/server";
import { generateConversationTwiML } from "@/lib/calling/twilio";
import { getAgentGreeting, initConversation } from "@/lib/calling/pipeline";
import { getAgent } from "@/lib/crm/agents";
import { createClient } from "@supabase/supabase-js";

/**
 * POST /api/webhooks/twilio/voice
 * Called by Twilio when a call is answered.
 * Returns TwiML to start the AI conversation.
 */
export async function POST(req: NextRequest) {
  const callId = req.nextUrl.searchParams.get("callId");
  const agentId = req.nextUrl.searchParams.get("agentId");

  if (!callId || !agentId) {
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response><Say>Sorry, there was an error. Goodbye.</Say><Hangup/></Response>`;
    return new Response(twiml, { headers: { "Content-Type": "text/xml" } });
  }

  // Fetch agent config (use admin since webhooks don't have user auth)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: agent } = await supabase
    .from("ai_agents")
    .select("*")
    .eq("id", agentId)
    .single();

  if (!agent) {
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response><Say>Sorry, this agent is not available. Goodbye.</Say><Hangup/></Response>`;
    return new Response(twiml, { headers: { "Content-Type": "text/xml" } });
  }

  // Get call record for contact context
  const { data: call } = await supabase
    .from("ai_calls")
    .select("contact_name, metadata")
    .eq("id", callId)
    .single();

  // Initialize the conversation pipeline
  initConversation(callId, agent, {
    name: call?.contact_name || undefined,
  });

  // Generate greeting
  const greeting = getAgentGreeting(agent, { name: call?.contact_name || undefined });

  // Get webhook base URL
  const webhookBaseUrl = process.env.NEXT_PUBLIC_APP_URL || `https://${req.headers.get("host")}`;

  // Return TwiML with greeting + gather for response
  const twiml = generateConversationTwiML({
    webhookBaseUrl,
    callId,
    agentId,
    message: greeting,
    isFirst: true,
  });

  // Update call status to in_progress
  await supabase
    .from("ai_calls")
    .update({
      status: "in_progress",
      started_at: new Date().toISOString(),
      answered_at: new Date().toISOString(),
    })
    .eq("id", callId);

  return new Response(twiml, { headers: { "Content-Type": "text/xml" } });
}
