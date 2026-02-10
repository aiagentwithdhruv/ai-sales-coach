/**
 * Realtime Token API Route
 *
 * Generates ephemeral tokens for OpenAI Realtime API connections.
 * Uses the GA (General Availability) client_secrets endpoint.
 */

import { NextResponse } from "next/server";
import { processAttachmentsForContext, type Attachment } from "@/lib/ai/attachments";
import { checkCredits, deductCredits } from "@/lib/credits";

// GA model for Realtime API
const REALTIME_MODEL = "gpt-4o-realtime-preview-2024-12-17";

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "OpenAI API key not configured. Please add OPENAI_API_KEY to your .env.local file." },
      { status: 500 }
    );
  }

  // Check if API key format is valid (OpenAI keys start with 'sk-proj-' or 'sk-')
  if (apiKey.startsWith('sk-ant-')) {
    return NextResponse.json(
      {
        error: "Invalid OpenAI API key detected. The OPENAI_API_KEY is currently set to a Claude API key. Please update it with a real OpenAI key from https://platform.openai.com/api-keys",
        details: "Realtime Voice Call requires an OpenAI API key for the Realtime API."
      },
      { status: 401 }
    );
  }

  // Credit check - require at least 1 credit to start voice session
  const authHeader = request.headers.get("authorization");
  if (authHeader) {
    const creditCheck = await checkCredits(authHeader, 1);
    if (!creditCheck.hasCredits) {
      return NextResponse.json(
        { error: "Insufficient credits. Voice practice costs 1 credit per minute.", credits: creditCheck.credits },
        { status: 402 }
      );
    }
    // Deduct 1 credit upfront for the first minute
    if (creditCheck.userId) {
      await deductCredits(creditCheck.userId, 1);
    }
  }

  try {
    // Get optional voice from request body
    const body = await request.json().catch(() => ({}));
    const voice = body.voice || "alloy";
    const attachments: Attachment[] | undefined = body.attachments;
    const attachmentContext =
      attachments && attachments.length > 0
        ? await processAttachmentsForContext(attachments)
        : "";
    const instructionsBase = body.instructions || "You are a helpful AI assistant.";
    const trainingFocus = body.trainingFocus ? String(body.trainingFocus) : "";
    const trainingFocusContext = trainingFocus
      ? `\n\nTRAINING FOCUS: ${trainingFocus}\nEmphasize this focus during the role-play.`
      : "";
    const instructions = attachmentContext
      ? `${instructionsBase}${trainingFocusContext}\n\n--- TRAINING CONTEXT ---${attachmentContext}\n\nUse this context to ground your responses in the provided materials.`
      : `${instructionsBase}${trainingFocusContext}`;

    // Create ephemeral token via OpenAI Realtime GA client_secrets endpoint
    // Session configuration is passed here, including voice and audio settings
    const sessionConfig = {
      session: {
        type: "realtime",
        model: REALTIME_MODEL,
        instructions,
        output_modalities: ["audio"],
        audio: {
          input: {
            format: {
              type: "audio/pcm",
              rate: 24000
            },
            transcription: {
              model: "gpt-4o-transcribe",
              language: "en"
            },
            noise_reduction: {
              type: "near_field"
            },
            turn_detection: {
              type: "server_vad",
              threshold: 0.5,
              prefix_padding_ms: 300,
              silence_duration_ms: 800,
              create_response: true,
              interrupt_response: true
            }
          },
          output: {
            format: {
              type: "audio/pcm",
              rate: 24000
            },
            voice: voice,
            speed: 1.0
          }
        }
      }
    };
    
    console.log("[Realtime Token] Creating client secret with config:", JSON.stringify(sessionConfig));
    
    const response = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(sessionConfig),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("[Realtime Token] OpenAI client_secrets error:", response.status, errorData);

      // Fall back to direct API key if endpoint fails
      console.log("[Realtime Token] Falling back to direct API key");
      return NextResponse.json({
        token: apiKey,
        type: "api_key",
        model: REALTIME_MODEL
      });
    }

    const data = await response.json();
    console.log("[Realtime Token] Got ephemeral token from client_secrets API:", JSON.stringify(data).slice(0, 200));

    // The GA client_secrets endpoint returns { value: "ek_...", expires_at: ..., session: {...} }
    return NextResponse.json({
      token: data.value || apiKey,
      type: data.value ? "ephemeral" : "api_key",
      expiresAt: data.expires_at,
      model: REALTIME_MODEL,
      sessionConfigured: true
    });
  } catch (error) {
    console.error("[Realtime Token] Error:", error);
    // Fall back to direct API key on any error
    return NextResponse.json({
      token: apiKey,
      type: "api_key",
      model: REALTIME_MODEL
    });
  }
}

// Also support GET for backwards compatibility
export async function GET() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "OpenAI API key not configured" },
      { status: 500 }
    );
  }

  // For GET requests, return direct API key
  return NextResponse.json({
    token: apiKey,
    type: "api_key",
    model: REALTIME_MODEL
  });
}
