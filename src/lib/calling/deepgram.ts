/**
 * Deepgram Speech-to-Text Integration
 * Handles real-time transcription and post-call transcription.
 */

import { createClient, LiveTranscriptionEvents } from "@deepgram/sdk";
import type { TranscriptEntry } from "@/types/teams";

const getDeepgramClient = () => {
  const apiKey = process.env.DEEPGRAM_API_KEY;
  if (!apiKey) {
    throw new Error("Deepgram API key not configured. Set DEEPGRAM_API_KEY.");
  }
  return createClient(apiKey);
};

export function isDeepgramConfigured(): boolean {
  return !!process.env.DEEPGRAM_API_KEY;
}

/**
 * Create a live transcription connection for real-time STT
 */
export function createLiveTranscription(options?: {
  language?: string;
  model?: string;
  sampleRate?: number;
  encoding?: string;
}) {
  const deepgram = getDeepgramClient();

  const connection = deepgram.listen.live({
    model: options?.model || "nova-3",
    language: options?.language || "en",
    smart_format: true,
    punctuate: true,
    interim_results: true,
    utterance_end_ms: 1500,
    vad_events: true,
    // Twilio sends μ-law 8kHz by default
    sample_rate: options?.sampleRate || 8000,
    encoding: options?.encoding || "mulaw",
    channels: 1,
  });

  return connection;
}

/**
 * Transcribe a pre-recorded audio file (post-call)
 */
export async function transcribeRecording(params: {
  audioUrl: string;
  language?: string;
}): Promise<{
  transcript: string;
  entries: TranscriptEntry[];
  duration: number;
}> {
  const deepgram = getDeepgramClient();

  const response = await deepgram.listen.prerecorded.transcribeUrl(
    { url: params.audioUrl },
    {
      model: "nova-3",
      language: params.language || "en",
      smart_format: true,
      punctuate: true,
      diarize: true, // Speaker diarization
      paragraphs: true,
      utterances: true,
    }
  );

  const result = response.result as Record<string, unknown> | null;
  const entries: TranscriptEntry[] = [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const utterances: any[] = (result as any)?.results?.utterances || [];

  for (const utterance of utterances) {
    entries.push({
      speaker: utterance.speaker === 0 ? "agent" : "contact",
      text: utterance.transcript,
      timestamp: utterance.start,
    });
  }

  const fullTranscript = utterances.map((u: { transcript: string }) => u.transcript).join(" ");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const duration = (result as any)?.metadata?.duration || 0;

  return {
    transcript: fullTranscript,
    entries,
    duration,
  };
}

/**
 * Live transcription event handler wrapper
 */
export function setupLiveTranscriptionHandlers(
  connection: ReturnType<typeof createLiveTranscription>,
  callbacks: {
    onTranscript?: (text: string, isFinal: boolean) => void;
    onUtteranceEnd?: () => void;
    onError?: (error: Error) => void;
    onClose?: () => void;
  }
) {
  connection.on(LiveTranscriptionEvents.Transcript, (data) => {
    const transcript = data.channel?.alternatives?.[0]?.transcript;
    if (transcript) {
      const isFinal = data.is_final || false;
      callbacks.onTranscript?.(transcript, isFinal);
    }
  });

  connection.on(LiveTranscriptionEvents.UtteranceEnd, () => {
    callbacks.onUtteranceEnd?.();
  });

  connection.on(LiveTranscriptionEvents.Error, (error) => {
    callbacks.onError?.(error instanceof Error ? error : new Error(String(error)));
  });

  connection.on(LiveTranscriptionEvents.Close, () => {
    callbacks.onClose?.();
  });

  return connection;
}
