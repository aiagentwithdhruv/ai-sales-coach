import { NextRequest } from "next/server";
import { generateConversationTwiML } from "@/lib/calling/twilio";
import { processUserSpeech, endConversation } from "@/lib/calling/pipeline";
import { createClient } from "@supabase/supabase-js";

/**
 * POST /api/webhooks/twilio/gather
 * Called by Twilio when speech is captured from the caller.
 * Processes the speech through our AI pipeline and returns TwiML with the response.
 */
export async function POST(req: NextRequest) {
  const callId = req.nextUrl.searchParams.get("callId");
  const agentId = req.nextUrl.searchParams.get("agentId");

  if (!callId || !agentId) {
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response><Say>Sorry, there was an error. Goodbye.</Say><Hangup/></Response>`;
    return new Response(twiml, { headers: { "Content-Type": "text/xml" } });
  }

  // Extract speech result from Twilio
  const formData = await req.formData();
  const speechResult = formData.get("SpeechResult") as string;

  if (!speechResult) {
    // No speech detected — ask again or end
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>I didn't catch that. Could you please repeat?</Say>
  <Gather input="speech" speechTimeout="auto" speechModel="experimental_conversations" action="/api/webhooks/twilio/gather?callId=${callId}&amp;agentId=${agentId}" method="POST" />
  <Say>Thank you for your time. Goodbye!</Say>
  <Hangup/>
</Response>`;
    return new Response(twiml, { headers: { "Content-Type": "text/xml" } });
  }

  // Process through AI pipeline
  const { response, shouldEndCall } = await processUserSpeech(callId, speechResult);

  if (shouldEndCall) {
    // End the call gracefully
    const result = endConversation(callId);

    // Update DB with final data
    if (result) {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      await supabase
        .from("ai_calls")
        .update({
          transcript_json: result.transcript,
          transcript: result.transcript.map((e) => `${e.speaker}: ${e.text}`).join("\n"),
          cost_breakdown: result.costBreakdown,
        })
        .eq("id", callId);
    }

    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response><Say>${escapeXml(response)}</Say><Hangup/></Response>`;
    return new Response(twiml, { headers: { "Content-Type": "text/xml" } });
  }

  // Continue conversation
  const webhookBaseUrl = process.env.NEXT_PUBLIC_APP_URL || `https://${req.headers.get("host")}`;
  const twiml = generateConversationTwiML({
    webhookBaseUrl,
    callId,
    agentId,
    message: response,
  });

  return new Response(twiml, { headers: { "Content-Type": "text/xml" } });
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
