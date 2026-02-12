/**
 * Call Analysis API Route
 *
 * Accepts audio/video recordings and returns a coaching report.
 * Transcribes with OpenAI and analyzes with a best-available model.
 * Includes usage tracking and BYOAPI key resolution.
 */

import OpenAI from "openai";
import { checkUsage, incrementUsage } from "@/lib/usage";
import { resolveUserKeys } from "@/lib/ai/key-resolver";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const maxDuration = 120;

type AnalysisResponse = {
  summary: string;
  overallScore: number;
  insights: {
    discovery: number;
    rapport: number;
    objectionHandling: number;
    nextSteps: number;
  };
  talkRatio: {
    rep: number;
    prospect: number;
  };
  strengths: string[];
  improvements: string[];
  keyMoments: { type: "positive" | "improvement"; text: string }[];
  nextSteps: string[];
};

const ANALYSIS_PROMPT = `
You are a world-class sales coach. Analyze the call transcript and return JSON ONLY.
Focus on what makes the rep better: discovery, rapport, objection handling, next steps, clarity, confidence.
If some items are missing, infer conservatively.

Return JSON with this exact shape:
{
  "summary": "string (2-4 sentences)",
  "overallScore": number (0-100),
  "insights": {
    "discovery": number (0-100),
    "rapport": number (0-100),
    "objectionHandling": number (0-100),
    "nextSteps": number (0-100)
  },
  "talkRatio": { "rep": number, "prospect": number },
  "strengths": ["..."],
  "improvements": ["..."],
  "keyMoments": [{"type": "positive|improvement", "text": "..." }],
  "nextSteps": ["..."]
}
`;

function coerceAnalysis(jsonText: string): AnalysisResponse {
  const trimmed = jsonText.trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  const slice = start >= 0 && end >= 0 ? trimmed.slice(start, end + 1) : trimmed;
  const parsed = JSON.parse(slice) as AnalysisResponse;
  return parsed;
}

export async function POST(req: Request) {
  // Authenticate user
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
  }
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401, headers: { "Content-Type": "application/json" } });
  }
  const userId = user.id;

  // Check usage
  const usageCheck = await checkUsage(userId, "analyses_run");
  if (!usageCheck.allowed) {
    return new Response(
      JSON.stringify({ error: usageCheck.error, code: "USAGE_LIMIT_REACHED" }),
      { status: 402, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    // Resolve user API keys for OpenAI
    const userKeys = await resolveUserKeys(userId);
    const openai = new OpenAI({
      apiKey: userKeys.openai || process.env.OPENAI_API_KEY,
    });
    const formData = await req.formData();
    const fileBlob = formData.get("file");

    if (!fileBlob || !(fileBlob instanceof Blob)) {
      return new Response(
        JSON.stringify({ error: "Recording file is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const fileName = (fileBlob as File).name || "recording.audio";
    const file = new File([fileBlob], fileName, {
      type: fileBlob.type || "audio/mpeg",
    });

    const lowerName = fileName.toLowerCase();
    if (file.type.startsWith("video/") || lowerName.endsWith(".mp4")) {
      return new Response(
        JSON.stringify({ error: "MP4/video files are not supported yet. Please upload audio (mp3, wav, m4a)." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Transcribe
    let transcriptText = "";
    try {
      const transcription = await openai.audio.transcriptions.create({
        file,
        model: "gpt-4o-transcribe",
        language: "en",
        response_format: "json",
      });
      transcriptText = transcription.text || "";
    } catch (err) {
      console.warn("[Call Analyze] gpt-4o-transcribe failed, falling back to whisper-1");
      const transcription = await openai.audio.transcriptions.create({
        file,
        model: "whisper-1",
        language: "en",
        response_format: "json",
      });
      transcriptText = transcription.text || "";
    }

    if (!transcriptText.trim()) {
      return new Response(
        JSON.stringify({ error: "Transcription failed or empty" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Analyze
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1",
      temperature: 0.3,
      messages: [
        { role: "system", content: ANALYSIS_PROMPT },
        {
          role: "user",
          content: `TRANSCRIPT:\n${transcriptText}\n\nReturn JSON only.`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content || "{}";
    const analysis = coerceAnalysis(raw);

    // Increment usage after successful analysis
    await incrementUsage(userId, "analyses_run");

    return new Response(
      JSON.stringify({
        success: true,
        transcriptLength: transcriptText.length,
        analysis,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Call Analysis Error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to analyze call",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
