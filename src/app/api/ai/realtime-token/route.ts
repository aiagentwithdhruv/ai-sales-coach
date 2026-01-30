/**
 * Realtime Token API Route
 *
 * Generates ephemeral tokens for OpenAI Realtime API connections.
 * This keeps the API key secure on the server side.
 */

import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "OpenAI API key not configured" },
      { status: 500 }
    );
  }

  try {
    // Get optional voice and model from request body
    const body = await request.json().catch(() => ({}));
    const voice = body.voice || "nova";
    const model = body.model || "gpt-4o-realtime-preview-2024-12-17";

    // Create ephemeral token via OpenAI Realtime Sessions API
    const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model,
        voice: voice,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("[Realtime Token] OpenAI error:", errorData);

      // Fall back to direct API key if sessions endpoint fails
      console.log("[Realtime Token] Falling back to direct API key");
      return NextResponse.json({
        token: apiKey,
        type: "api_key"
      });
    }

    const data = await response.json();
    console.log("[Realtime Token] Got ephemeral token");

    return NextResponse.json({
      token: data.client_secret?.value || apiKey,
      type: data.client_secret ? "ephemeral" : "api_key",
      expiresAt: data.client_secret?.expires_at,
    });
  } catch (error) {
    console.error("[Realtime Token] Error:", error);
    // Fall back to direct API key on any error
    return NextResponse.json({
      token: apiKey,
      type: "api_key"
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
    type: "api_key"
  });
}
