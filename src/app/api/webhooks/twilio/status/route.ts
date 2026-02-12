import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { endConversation, analyzeCallTranscript } from "@/lib/calling/pipeline";
import { incrementAgentCalls } from "@/lib/crm/agents";
import { updateZohoAfterCall } from "@/lib/crm/zoho";
import { onCampaignCallCompleted } from "@/lib/calling/campaign-executor";
import { triggerFollowUps } from "@/lib/crm/follow-ups";
import { incrementPhoneNumberCalls } from "@/lib/crm/phone-numbers";

const getAdmin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

/**
 * POST /api/webhooks/twilio/status
 * Called by Twilio with call status updates (initiated, ringing, answered, completed).
 * After call completion: analyzes transcript, syncs to CRM, logs activity.
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

      // Get the full call record for CRM sync
      const { data: call } = await supabase
        .from("ai_calls")
        .select("agent_id, user_id, contact_id, contact_name, to_number, from_number, campaign_id")
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

            // ──────────────────────────────────────────────────────────
            // CRM AUTO-SYNC: Create/update contact + log activity
            // ──────────────────────────────────────────────────────────
            if (call.user_id && ourStatus === "completed") {
              await syncCallToCRM(supabase, {
                userId: call.user_id,
                callId,
                contactId: call.contact_id,
                contactName: call.contact_name,
                phoneNumber: call.to_number || call.from_number,
                outcome: analysis.outcome,
                sentiment: analysis.sentiment,
                summary: analysis.summary,
                score: analysis.score,
                nextSteps: analysis.nextSteps,
                topics: analysis.topics,
                objections: analysis.objections,
                duration: result.duration,
                transcript: result.transcript.map((e) => `${e.speaker}: ${e.text}`).join("\n"),
                agentName: agent.name,
                campaignId: call.campaign_id,
              });
            }
            // ──────────────────────────────────────────────────────────
            // ZOHO CRM SYNC: Push call result back to Zoho
            // ──────────────────────────────────────────────────────────
            if (call.contact_id && ourStatus === "completed") {
              try {
                await updateZohoAfterCall(
                  call.contact_id,
                  analysis.outcome,
                  analysis.summary,
                  result.duration
                );
              } catch {
                // Zoho sync failed — non-blocking, log and continue
              }
            }

            // ──────────────────────────────────────────────────────────
            // CAMPAIGN CHAIN: Trigger next call in campaign
            // ──────────────────────────────────────────────────────────
            if (call.campaign_id && call.user_id) {
              try {
                await onCampaignCallCompleted(
                  call.campaign_id,
                  callId,
                  analysis.outcome,
                  call.user_id
                );
              } catch {
                // Campaign chain failed — frontend polling will pick up
              }
            }

            // ──────────────────────────────────────────────────────────
            // FOLLOW-UP AUTOMATION: Schedule emails/SMS based on outcome
            // ──────────────────────────────────────────────────────────
            if (call.user_id && call.contact_id && ourStatus === "completed") {
              try {
                // Get contact details for follow-up
                const { data: contact } = await supabase
                  .from("contacts")
                  .select("email, phone, first_name, last_name")
                  .eq("id", call.contact_id)
                  .single();

                if (contact) {
                  await triggerFollowUps({
                    userId: call.user_id,
                    contactId: call.contact_id,
                    callId,
                    outcome: analysis.outcome,
                    contactName: `${contact.first_name} ${contact.last_name || ""}`.trim(),
                    contactEmail: contact.email,
                    contactPhone: contact.phone,
                    callSummary: analysis.summary,
                    nextSteps: analysis.nextSteps,
                    agentName: agent.name,
                  });
                }
              } catch {
                // Follow-up trigger failed — non-blocking
              }
            }

            // Track phone number usage
            if (call.from_number) {
              try {
                await incrementPhoneNumberCalls(call.from_number);
              } catch {
                // non-blocking
              }
            }
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

/**
 * Sync call results to CRM:
 * 1. If contact_id exists → update the contact with call details
 * 2. If no contact_id but phone/name exists → find or create a CRM contact
 * 3. Log a "call" activity on the contact timeline
 * 4. Update deal stage if meeting was booked
 */
async function syncCallToCRM(
  supabase: ReturnType<typeof getAdmin>,
  data: {
    userId: string;
    callId: string;
    contactId: string | null;
    contactName: string | null;
    phoneNumber: string | null;
    outcome: string;
    sentiment: string;
    summary: string;
    score: number;
    nextSteps: string;
    topics: string[];
    objections: string[];
    duration: number;
    transcript: string;
    agentName: string;
    campaignId: string | null;
  }
) {
  let contactId = data.contactId;

  // Step 1: Find or create CRM contact
  if (!contactId && data.phoneNumber) {
    // Try to find existing contact by phone number
    const { data: existing } = await supabase
      .from("contacts")
      .select("id")
      .eq("user_id", data.userId)
      .eq("phone", data.phoneNumber)
      .limit(1)
      .single();

    if (existing) {
      contactId = existing.id;
    } else if (data.contactName) {
      // Create new CRM contact from call data
      const nameParts = data.contactName.split(" ");
      const firstName = nameParts[0] || data.contactName;
      const lastName = nameParts.slice(1).join(" ") || null;

      const { data: newContact } = await supabase
        .from("contacts")
        .insert({
          user_id: data.userId,
          first_name: firstName,
          last_name: lastName,
          phone: data.phoneNumber,
          source: "ai_call",
          deal_stage: data.outcome === "meeting_booked" ? "qualified" : "contacted",
          deal_value: 0,
          probability: data.outcome === "meeting_booked" ? 40 : data.outcome === "interested" ? 20 : 10,
          lead_score: Math.min(data.score, 100),
          tags: ["ai-called"],
          notes: `AI Call Summary: ${data.summary}\n\nNext Steps: ${data.nextSteps}`,
          last_contacted_at: new Date().toISOString(),
          custom_fields: {
            ai_call_outcome: data.outcome,
            ai_call_sentiment: data.sentiment,
            ai_call_topics: data.topics,
            ai_call_objections: data.objections,
          },
        })
        .select("id")
        .single();

      if (newContact) {
        contactId = newContact.id;
      }
    }
  }

  // Step 2: Update existing contact with latest call info
  if (contactId) {
    const contactUpdates: Record<string, unknown> = {
      last_contacted_at: new Date().toISOString(),
    };

    // If meeting was booked, advance the deal stage
    if (data.outcome === "meeting_booked") {
      contactUpdates.deal_stage = "qualified";
      contactUpdates.next_follow_up_at = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(); // 2 days
    } else if (data.outcome === "callback_scheduled") {
      contactUpdates.next_follow_up_at = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(); // 3 days
    } else if (data.outcome === "interested") {
      contactUpdates.next_follow_up_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 1 week
    }

    await supabase
      .from("contacts")
      .update(contactUpdates)
      .eq("id", contactId)
      .eq("user_id", data.userId);

    // Link the call record to the contact
    await supabase
      .from("ai_calls")
      .update({ contact_id: contactId })
      .eq("id", data.callId);

    // Step 3: Log activity on the contact timeline
    await supabase.from("activities").insert({
      user_id: data.userId,
      contact_id: contactId,
      type: "call",
      title: `AI Call — ${data.outcome.replace(/_/g, " ")} (Score: ${data.score}/100)`,
      description: `Agent: ${data.agentName} | Duration: ${Math.round(data.duration / 60)}m ${data.duration % 60}s | Sentiment: ${data.sentiment}\n\n${data.summary}\n\nNext Steps: ${data.nextSteps}${data.objections.length > 0 ? `\n\nObjections: ${data.objections.join(", ")}` : ""}`,
      metadata: {
        call_id: data.callId,
        campaign_id: data.campaignId,
        outcome: data.outcome,
        sentiment: data.sentiment,
        ai_score: data.score,
        duration: data.duration,
        topics: data.topics,
        objections: data.objections,
        agent_name: data.agentName,
      },
    });
  }

  // Step 4: Update campaign stats if this call belongs to a campaign
  if (data.campaignId) {
    // Increment campaign call count
    const { data: campaign } = await supabase
      .from("ai_call_campaigns")
      .select("stats")
      .eq("id", data.campaignId)
      .single();

    if (campaign?.stats) {
      const stats = campaign.stats as Record<string, number>;
      const updatedStats = {
        total_calls: (stats.total_calls || 0) + 1,
        connected: (stats.connected || 0) + (data.duration > 10 ? 1 : 0),
        meetings_booked: (stats.meetings_booked || 0) + (data.outcome === "meeting_booked" ? 1 : 0),
        avg_duration: Math.round(
          ((stats.avg_duration || 0) * (stats.total_calls || 0) + data.duration) /
          ((stats.total_calls || 0) + 1)
        ),
      };

      await supabase
        .from("ai_call_campaigns")
        .update({ stats: updatedStats })
        .eq("id", data.campaignId);
    }
  }
}
