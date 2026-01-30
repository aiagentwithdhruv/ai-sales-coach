/**
 * Transcription API Route
 *
 * Converts audio to text using OpenAI Whisper API.
 * Accepts audio files (WebM, MP3, WAV, etc.)
 */

import OpenAI from "openai";

export const runtime = "edge";
export const maxDuration = 60; // Allow longer for transcription

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get("audio");

    if (!audioFile || !(audioFile instanceof Blob)) {
      return new Response(
        JSON.stringify({ error: "Audio file is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Convert blob to File for OpenAI API
    const file = new File([audioFile], "audio.webm", {
      type: audioFile.type || "audio/webm",
    });

    // Transcribe using Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: "whisper-1",
      language: "en", // Optimize for English
      response_format: "json",
    });

    return new Response(
      JSON.stringify({
        text: transcription.text,
        success: true,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Transcription Error:", error);

    return new Response(
      JSON.stringify({
        error: "Failed to transcribe audio",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
