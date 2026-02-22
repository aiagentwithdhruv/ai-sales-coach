/**
 * Feedback API Route
 *
 * Receives feedback submissions and forwards to n8n webhook.
 * No auth required — works for anonymous and logged-in users.
 */

import { NextResponse } from "next/server";

const MAX_SCREENSHOT_SIZE = 2 * 1024 * 1024; // 2MB in base64 chars (~1.5MB actual)
const VALID_CATEGORIES = ["bug", "feature_request", "feedback", "improvement"];

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      category,
      rating = 0,
      primaryText,
      screenshotDataUrl,
      email,
      name,
      pageUrl,
      userAgent,
      timestamp,
    } = body;

    // Validate required fields
    if (!category || !VALID_CATEGORIES.includes(category)) {
      return NextResponse.json(
        { success: false, error: "Invalid category" },
        { status: 400 }
      );
    }

    // Rating: 0 is valid for bugs/features (no rating asked), 1-5 for feedback/improvement
    if (rating !== undefined && rating !== 0 && (rating < 1 || rating > 5)) {
      return NextResponse.json(
        { success: false, error: "Rating must be 1-5" },
        { status: 400 }
      );
    }

    if (!primaryText || primaryText.trim().length < 3) {
      return NextResponse.json(
        { success: false, error: "Please provide at least 3 characters" },
        { status: 400 }
      );
    }

    // Check screenshot size
    if (screenshotDataUrl && screenshotDataUrl.length > MAX_SCREENSHOT_SIZE) {
      return NextResponse.json(
        { success: false, error: "Screenshot is too large. Please use a smaller image." },
        { status: 400 }
      );
    }

    // Forward to n8n webhook
    const webhookUrl = process.env.FEEDBACK_WEBHOOK_URL;
    if (!webhookUrl) {
      console.error("[Feedback] FEEDBACK_WEBHOOK_URL not configured");
      return NextResponse.json(
        { success: false, error: "Feedback system is not configured." },
        { status: 500 }
      );
    }

    const payload = {
      type: "feedback",
      category,
      rating,
      primaryText: primaryText.trim(),
      screenshotDataUrl: screenshotDataUrl || "",
      email: email?.trim() || "Anonymous",
      name: name?.trim() || "Anonymous",
      pageUrl: pageUrl || "",
      userAgent: userAgent || "",
      timestamp: timestamp || new Date().toISOString(),
    };

    const webhookRes = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!webhookRes.ok) {
      console.error("[Feedback] Webhook failed:", webhookRes.status);
      return NextResponse.json(
        { success: false, error: "Failed to submit feedback. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Feedback] Route error:", error);
    return NextResponse.json(
      { success: false, error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
