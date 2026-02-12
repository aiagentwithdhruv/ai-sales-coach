import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

const getAdmin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

/**
 * POST /api/webhooks/twilio/recording
 * Called by Twilio when a call recording is ready.
 * Downloads the recording and stores it in Supabase Storage.
 */
export async function POST(req: NextRequest) {
  const callId = req.nextUrl.searchParams.get("callId");
  if (!callId) return new Response("OK", { status: 200 });

  const formData = await req.formData();
  const recordingUrl = formData.get("RecordingUrl") as string;
  const recordingSid = formData.get("RecordingSid") as string;
  const recordingDuration = formData.get("RecordingDuration") as string;
  const recordingStatus = formData.get("RecordingStatus") as string;

  if (!recordingUrl || recordingStatus !== "completed") {
    return new Response("OK", { status: 200 });
  }

  const supabase = getAdmin();

  try {
    // Download recording from Twilio (MP3 format)
    const audioUrl = `${recordingUrl}.mp3`;
    const response = await fetch(audioUrl, {
      headers: {
        Authorization: `Basic ${Buffer.from(
          `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`
        ).toString("base64")}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to download recording: ${response.status}`);
    }

    const audioBuffer = await response.arrayBuffer();
    const fileName = `recordings/${callId}/${recordingSid}.mp3`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("call-recordings")
      .upload(fileName, audioBuffer, {
        contentType: "audio/mpeg",
        upsert: true,
      });

    if (uploadError) {
      // Bucket might not exist — try creating it first
      if (uploadError.message?.includes("not found") || uploadError.message?.includes("does not exist")) {
        await supabase.storage.createBucket("call-recordings", {
          public: false,
          fileSizeLimit: 52428800, // 50MB
        });

        // Retry upload
        await supabase.storage
          .from("call-recordings")
          .upload(fileName, audioBuffer, {
            contentType: "audio/mpeg",
            upsert: true,
          });
      } else {
        throw uploadError;
      }
    }

    // Get a signed URL (valid 7 days)
    const { data: signedUrl } = await supabase.storage
      .from("call-recordings")
      .createSignedUrl(fileName, 7 * 24 * 60 * 60);

    // Update call record with storage URL
    await supabase
      .from("ai_calls")
      .update({
        recording_url: signedUrl?.signedUrl || audioUrl,
        metadata: {
          recording_sid: recordingSid,
          recording_duration: parseInt(recordingDuration || "0"),
          recording_storage_path: fileName,
          recording_source: signedUrl ? "supabase" : "twilio",
        },
      })
      .eq("id", callId);
  } catch {
    // Still save the Twilio URL as fallback
    await supabase
      .from("ai_calls")
      .update({
        recording_url: `${recordingUrl}.mp3`,
      })
      .eq("id", callId);
  }

  return new Response("OK", { status: 200 });
}
