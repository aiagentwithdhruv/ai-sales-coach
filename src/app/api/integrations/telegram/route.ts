/**
 * Telegram Integration API
 *
 * POST /api/integrations/telegram — Generate linking code
 * DELETE /api/integrations/telegram — Unlink account
 *
 * Used by the settings page to connect/disconnect Telegram.
 */

import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateLinkingCode } from "@/lib/channels/telegram";

export const runtime = "nodejs";

const json = { "Content-Type": "application/json" };

const getAdmin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

async function authenticateUser(authHeader: string | null) {
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }
  const supabase = getAdmin();
  const { data: { user }, error } = await supabase.auth.getUser(
    authHeader.replace("Bearer ", "")
  );
  if (error || !user) return null;
  return user;
}

export async function POST(req: NextRequest) {
  const user = await authenticateUser(req.headers.get("authorization"));
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: json,
    });
  }

  try {
    const code = await generateLinkingCode(user.id);
    const botUsername = process.env.TELEGRAM_BOT_USERNAME || "QuotaHitBot";
    const deepLink = `https://t.me/${botUsername}?start=${code}`;

    return new Response(
      JSON.stringify({
        code,
        deepLink,
        botUsername,
        expiresIn: "15 minutes",
        isLinked: !!user.user_metadata?.telegram_chat_id,
        telegramUsername: user.user_metadata?.telegram_username || null,
      }),
      { headers: json }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Failed to generate linking code",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: json }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const user = await authenticateUser(req.headers.get("authorization"));
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: json,
    });
  }

  try {
    const supabase = getAdmin();
    await supabase.auth.admin.updateUserById(user.id, {
      user_metadata: {
        telegram_chat_id: null,
        telegram_username: null,
      },
    });

    return new Response(
      JSON.stringify({ success: true, message: "Telegram account unlinked" }),
      { headers: json }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Failed to unlink Telegram",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: json }
    );
  }
}
