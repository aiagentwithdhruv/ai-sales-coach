/**
 * Text-to-Speech Integration
 * Supports OpenAI TTS (budget) and ElevenLabs (premium).
 */

import OpenAI from "openai";

export type TTSProvider = "openai" | "elevenlabs";

const OPENAI_VOICES = ["alloy", "echo", "fable", "onyx", "nova", "shimmer"] as const;
type OpenAIVoice = typeof OPENAI_VOICES[number];

function isOpenAIVoice(voice: string): voice is OpenAIVoice {
  return OPENAI_VOICES.includes(voice as OpenAIVoice);
}

/**
 * Generate speech audio from text using OpenAI TTS
 * Returns audio as ArrayBuffer (mp3 format)
 */
export async function generateSpeechOpenAI(params: {
  text: string;
  voice?: string;
  speed?: number;
  model?: string;
}): Promise<ArrayBuffer> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const voice = isOpenAIVoice(params.voice || "") ? (params.voice as OpenAIVoice) : "alloy";

  const response = await openai.audio.speech.create({
    model: params.model || "tts-1",
    voice,
    input: params.text,
    speed: params.speed || 1.0,
    response_format: "mp3",
  });

  return response.arrayBuffer();
}

/**
 * Generate speech audio using ElevenLabs
 * Returns audio as ArrayBuffer
 */
export async function generateSpeechElevenLabs(params: {
  text: string;
  voiceId: string;
  modelId?: string;
}): Promise<ArrayBuffer> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error("ElevenLabs API key not configured. Set ELEVENLABS_API_KEY.");
  }

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${params.voiceId}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: params.text,
        model_id: params.modelId || "eleven_turbo_v2_5",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true,
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`ElevenLabs TTS failed: ${error}`);
  }

  return response.arrayBuffer();
}

/**
 * Unified TTS function — routes to the correct provider
 */
export async function generateSpeech(params: {
  text: string;
  provider?: TTSProvider;
  voice?: string;
  speed?: number;
}): Promise<ArrayBuffer> {
  const provider = params.provider || "openai";

  if (provider === "elevenlabs") {
    return generateSpeechElevenLabs({
      text: params.text,
      voiceId: params.voice || "EXAVITQu4vr4xnSDxMaL", // Default ElevenLabs voice
    });
  }

  return generateSpeechOpenAI({
    text: params.text,
    voice: params.voice || "alloy",
    speed: params.speed,
  });
}

/**
 * Generate speech and convert to μ-law format for Twilio
 * Twilio expects 8kHz μ-law encoded audio
 */
export async function generateSpeechForTwilio(params: {
  text: string;
  provider?: TTSProvider;
  voice?: string;
}): Promise<ArrayBuffer> {
  // For the Twilio gather/say approach, we use TTS API and return mp3
  // For WebSocket streaming, we'd need real-time TTS (future enhancement)
  return generateSpeech(params);
}

/**
 * Estimate TTS cost
 */
export function estimateTTSCost(charCount: number, provider: TTSProvider = "openai"): number {
  if (provider === "elevenlabs") {
    // ElevenLabs: ~$0.30 per 1K characters
    return (charCount / 1000) * 0.30;
  }
  // OpenAI TTS: $15 per 1M characters = $0.015 per 1K
  return (charCount / 1000) * 0.015;
}
