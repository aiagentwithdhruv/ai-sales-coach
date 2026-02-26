/**
 * Telegram Webhook Handler
 *
 * POST /api/webhooks/telegram
 *
 * Receives updates from Telegram Bot API.
 * Set webhook via: https://api.telegram.org/bot<TOKEN>/setWebhook?url=<APP_URL>/api/webhooks/telegram
 */

import { NextRequest } from "next/server";
import { handleTelegramUpdate } from "@/lib/channels/telegram";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    // Verify the request is from Telegram (optional secret token)
    const secretToken = req.headers.get("x-telegram-bot-api-secret-token");
    const expectedToken = process.env.TELEGRAM_WEBHOOK_SECRET;

    if (expectedToken && secretToken !== expectedToken) {
      return new Response("Unauthorized", { status: 401 });
    }

    const update = await req.json();
    console.log("[Telegram Webhook]", JSON.stringify(update).slice(0, 200));

    const result = await handleTelegramUpdate(update);

    return new Response(
      JSON.stringify({ ok: true, handled: result.handled }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[Telegram Webhook] Error:", error);
    // Always return 200 to prevent Telegram from retrying
    return new Response(
      JSON.stringify({ ok: true, error: "Internal error" }),
      { headers: { "Content-Type": "application/json" } }
    );
  }
}
