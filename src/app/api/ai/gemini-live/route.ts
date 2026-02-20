import { NextRequest, NextResponse } from "next/server";

// Simple in-memory rate limiting (resets on server restart)
const sessionCounts = new Map<string, { count: number; resetAt: number }>();
const MAX_SESSIONS_PER_HOUR = 10;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = sessionCounts.get(ip);

  if (!entry || now > entry.resetAt) {
    sessionCounts.set(ip, { count: 1, resetAt: now + 60 * 60 * 1000 });
    return true;
  }

  if (entry.count >= MAX_SESSIONS_PER_HOUR) {
    return false;
  }

  entry.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Google AI API key not configured" },
        { status: 500 }
      );
    }

    // Rate limit by IP
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Too many sessions. Please try again later." },
        { status: 429 }
      );
    }

    // Return the API key for WebSocket connection
    // The client will use this to connect directly to Gemini
    return NextResponse.json({
      apiKey,
      model: "models/gemini-2.5-flash-native-audio-latest",
      maxDuration: 120, // 2 minutes
    });
  } catch (error) {
    console.error("[Gemini Live] Error:", error);
    return NextResponse.json(
      { error: "Failed to initialize Gemini session" },
      { status: 500 }
    );
  }
}
