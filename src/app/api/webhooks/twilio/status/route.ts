import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { endConversation, analyzeCallTranscript } from "@/lib/calling/pipeline";
import { incrementAgentCalls } from "@/lib/crm/agents";

const getAdmin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

/**
 * POST /api/webhooks/twilio/status
 * Called by Twilio with call status updates (initiated, ringing, answered, completed).
 */
export async function POST(req: NextRequest) {
  const callId = req.nextUrl.searchParams.get("callId");
  if (!callId) {
    return new Response("OK", { status: 200 });
  }

  const formData = await req.formData();
  const callStatus = formData.get("CallStatus") as string;
  const callDuration = formData.get("CallDuration") as string;
  const recordingUrl = formData.get("RecordingUrl") as string;
  const callSid = formData.get("CallSid") as string;

  const supabase = getAdmin();

  // Map Twilio status to our status
  const statusMap: Record<string, string> = {
    initiated: "queued",
    ringing: "ringing",
    "in-progress": "in_progress",
    completed: "completed",
    busy: "no_answer",
    "no-answer": "no_answer",
    canceled: "failed",
    failed: "failed",
  };

  const ourStatus = statusMap[callStatus] || callStatus;

  const updates: Record<string, unknown> = {
    status: ourStatus,
  };

  if (callSid) updates.twilio_call_sid = callSid;
  if (callDuration) updates.duration_seconds = parseInt(callDuration);
  if (recordingUrl) updates.recording_url = recordingUrl;

  // If call is completed, finalize the conversation and analyze
  if (ourStatus === "completed" || ourStatus === "failed" || ourStatus === "no_answer") {
    updates.ended_at = new Date().toISOString();

    // End conversation and get transcript + costs
    const result = endConversation(callId);
    if (result) {
      updates.transcript_json = result.transcript;
      updates.transcript = result.transcript.map((e) => `${e.speaker}: ${e.text}`).join("\n");
      updates.cost_breakdown = result.costBreakdown;
      updates.duration_seconds = result.duration;

      // Get the call's agent for analysis
      const { data: call } = await supabase
        .from("ai_calls")
        .select("agent_id")
        .eq("id", callId)
        .single();

      if (call?.agent_id && result.transcript.length > 0) {
        const { data: agent } = await supabase
          .from("ai_agents")
          .select("*")
          .eq("id", call.agent_id)
          .single();

        if (agent) {
          try {
            const analysis = await analyzeCallTranscript(result.transcript, agent);
            updates.summary = analysis.summary;
            updates.outcome = analysis.outcome;
            updates.sentiment = analysis.sentiment;
            updates.ai_score = analysis.score;
            updates.score_breakdown = analysis.scoreBreakdown;
            updates.objections_detected = analysis.objections;
            updates.key_topics = analysis.topics;
            updates.next_steps = analysis.nextSteps;

            // Update agent stats
            await incrementAgentCalls(call.agent_id, analysis.score);
          } catch {
            // Analysis failed, still save the transcript
          }
        }
      }
    }
  }

  await supabase
    .from("ai_calls")
    .update(updates)
    .eq("id", callId);

  return new Response("OK", { status: 200 });
}
