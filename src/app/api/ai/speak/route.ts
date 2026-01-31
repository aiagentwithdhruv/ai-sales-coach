/**
 * Text-to-Speech API Route
 *
 * Converts text to natural speech using ElevenLabs or OpenAI TTS.
 * Returns audio stream (MP3).
 */

export const runtime = "edge";
export const maxDuration = 30;

// TTS Provider type
type TTSProvider = "elevenlabs" | "openai";

// Default provider - use environment variable or fallback to ElevenLabs for best quality
const DEFAULT_PROVIDER: TTSProvider =
  (process.env.TTS_PROVIDER as TTSProvider) || "elevenlabs";

// ==========================================
// ElevenLabs Configuration
// ==========================================
const ELEVENLABS_DEFAULT_VOICE = "21m00Tcm4TlvDq8ikWAM"; // Rachel - default voice

// ElevenLabs voice mapping for personas
export const ELEVENLABS_PERSONA_VOICES: Record<string, string> = {
  "sarah-startup": "21m00Tcm4TlvDq8ikWAM",      // Rachel - warm, friendly female
  "marcus-enterprise": "29vD33N1CtxCmqQRPOHJ",  // Drew - professional male
  "jennifer-skeptic": "XB0fDUnXU5powFXDhCwa",   // Charlotte - assertive female
  "david-gatekeeper": "pNInz6obpgDQGcFmaJgB",   // Adam - helpful male
};

// ==========================================
// OpenAI TTS Configuration
// ==========================================
type OpenAIVoice = "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer";

const OPENAI_DEFAULT_VOICE: OpenAIVoice = "nova";

// OpenAI voice mapping for personas
export const OPENAI_PERSONA_VOICES: Record<string, OpenAIVoice> = {
  "sarah-startup": "nova",
  "marcus-enterprise": "onyx",
  "jennifer-skeptic": "fable",
  "david-gatekeeper": "echo",
};

interface SpeakRequest {
  text: string;
  voiceId?: string;
  openaiVoice?: OpenAIVoice;
  personaId?: string;
  provider?: TTSProvider;
}

/**
 * Generate speech using ElevenLabs
 */
async function generateElevenLabsSpeech(
  text: string,
  voiceId: string
): Promise<Response> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error("ElevenLabs API key not configured");
  }

  console.log(`[TTS] ElevenLabs request - voice: ${voiceId}, text length: ${text.length}`);

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: "POST",
      headers: {
        "Accept": "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_turbo_v2_5", // Latest model for best quality and speed
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.8, // Higher for more natural tone
          style: 0.0,
          use_speaker_boost: true
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[TTS] ElevenLabs Error:", response.status, errorText);
    throw new Error(`ElevenLabs failed (${response.status}): ${errorText}`);
  }

  console.log("[TTS] ElevenLabs success");
  return response;
}

/**
 * Generate speech using OpenAI TTS
 */
async function generateOpenAISpeech(
  text: string,
  voice: OpenAIVoice
): Promise<Response> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OpenAI API key not configured");
  }

  console.log(`[TTS] OpenAI request - voice: ${voice}, text length: ${text.length}`);

  const response = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "tts-1-hd", // HD model for better quality
      input: text,
      voice: voice,
      response_format: "mp3",
      speed: 1.0,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[TTS] OpenAI Error:", response.status, errorText);
    throw new Error(`OpenAI TTS failed (${response.status}): ${errorText}`);
  }

  console.log("[TTS] OpenAI success");
  return response;
}

export async function POST(req: Request) {
  try {
    const body: SpeakRequest = await req.json();
    const { text, voiceId, openaiVoice, personaId, provider } = body;

    console.log(`[TTS] Request - provider: ${provider || DEFAULT_PROVIDER}, personaId: ${personaId}`);

    if (!text || typeof text !== "string") {
      return new Response(
        JSON.stringify({ error: "Text is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Limit text length
    const trimmedText = text.slice(0, 5000);

    // Determine provider
    const selectedProvider = provider || DEFAULT_PROVIDER;

    let audioResponse: Response | null = null;
    let usedProvider = selectedProvider;
    let lastError: Error | null = null;

    // Try primary provider first
    if (selectedProvider === "openai") {
      const voice = openaiVoice || (personaId ? OPENAI_PERSONA_VOICES[personaId] : null) || OPENAI_DEFAULT_VOICE;
      try {
        audioResponse = await generateOpenAISpeech(trimmedText, voice);
        usedProvider = "openai";
      } catch (error) {
        console.warn("[TTS] OpenAI failed, trying ElevenLabs...", error);
        lastError = error as Error;
      }
    } else {
      const voice = voiceId || (personaId ? ELEVENLABS_PERSONA_VOICES[personaId] : null) || ELEVENLABS_DEFAULT_VOICE;
      try {
        audioResponse = await generateElevenLabsSpeech(trimmedText, voice);
        usedProvider = "elevenlabs";
      } catch (error) {
        console.warn("[TTS] ElevenLabs failed, trying OpenAI...", error);
        lastError = error as Error;
      }
    }

    // Fallback to other provider if primary failed
    if (!audioResponse) {
      if (selectedProvider === "openai") {
        // Fallback to ElevenLabs
        const voice = voiceId || (personaId ? ELEVENLABS_PERSONA_VOICES[personaId] : null) || ELEVENLABS_DEFAULT_VOICE;
        try {
          audioResponse = await generateElevenLabsSpeech(trimmedText, voice);
          usedProvider = "elevenlabs";
        } catch (error) {
          console.error("[TTS] Both providers failed");
          lastError = error as Error;
        }
      } else {
        // Fallback to OpenAI
        const voice = openaiVoice || (personaId ? OPENAI_PERSONA_VOICES[personaId] : null) || OPENAI_DEFAULT_VOICE;
        try {
          audioResponse = await generateOpenAISpeech(trimmedText, voice);
          usedProvider = "openai";
        } catch (error) {
          console.error("[TTS] Both providers failed");
          lastError = error as Error;
        }
      }
    }

    if (!audioResponse) {
      return new Response(
        JSON.stringify({
          error: "Text-to-speech failed",
          details: lastError?.message || "Both providers failed",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Return audio stream
    const audioBuffer = await audioResponse.arrayBuffer();

    return new Response(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.byteLength.toString(),
        "X-TTS-Provider": usedProvider,
      },
    });
  } catch (error) {
    console.error("[TTS] Error:", error);

    return new Response(
      JSON.stringify({
        error: "Failed to generate speech",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

/**
 * GET endpoint to list available voices
 */
export async function GET() {
  return new Response(
    JSON.stringify({
      defaultProvider: DEFAULT_PROVIDER,
      elevenlabs: {
        defaultVoice: ELEVENLABS_DEFAULT_VOICE,
        voices: ELEVENLABS_PERSONA_VOICES,
      },
      openai: {
        defaultVoice: OPENAI_DEFAULT_VOICE,
        voices: OPENAI_PERSONA_VOICES,
      },
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}
