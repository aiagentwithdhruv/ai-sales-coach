/**
 * Feedback Vote API Route
 *
 * Receives suggestion upvotes and forwards to n8n webhook.
 * No auth required.
 */

import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { suggestionId, suggestionTitle, action } = await req.json();

    if (!suggestionId || action !== "upvote") {
      return NextResponse.json(
        { success: false, error: "Invalid vote" },
        { status: 400 }
      );
    }

    const webhookUrl = process.env.FEEDBACK_WEBHOOK_URL;
    if (!webhookUrl) {
      console.error("[Vote] FEEDBACK_WEBHOOK_URL not configured");
      return NextResponse.json(
        { success: false, error: "Vote system is not configured." },
        { status: 500 }
      );
    }

    const payload = {
      type: "vote",
      suggestionId,
      suggestionTitle: suggestionTitle || suggestionId,
      action: "upvote",
      timestamp: new Date().toISOString(),
    };

    const webhookRes = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!webhookRes.ok) {
      console.error("[Vote] Webhook failed:", webhookRes.status);
      return NextResponse.json(
        { success: false, error: "Failed to record vote." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Vote] Route error:", error);
    return NextResponse.json(
      { success: false, error: "Something went wrong." },
      { status: 500 }
    );
  }
}
