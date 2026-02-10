import { NextRequest } from "next/server";
import { authenticateUser } from "@/lib/crm/contacts";
import {
  getNotifications,
  markAllNotificationsRead,
  generateSmartNotifications,
} from "@/lib/crm/notifications";

const jsonHeaders = { "Content-Type": "application/json" };

// GET /api/contacts/notifications — Get user notifications
export async function GET(req: NextRequest) {
  const auth = await authenticateUser(req.headers.get("authorization"));
  if ("error" in auth) {
    return new Response(JSON.stringify({ error: auth.error }), {
      status: auth.status,
      headers: jsonHeaders,
    });
  }

  const unreadOnly = req.nextUrl.searchParams.get("unreadOnly") === "true";
  const limit = parseInt(req.nextUrl.searchParams.get("limit") || "20");

  const result = await getNotifications(auth.userId, { unreadOnly, limit });

  return new Response(JSON.stringify(result), { headers: jsonHeaders });
}

// POST /api/contacts/notifications — Generate smart notifications or mark all read
export async function POST(req: NextRequest) {
  const auth = await authenticateUser(req.headers.get("authorization"));
  if ("error" in auth) {
    return new Response(JSON.stringify({ error: auth.error }), {
      status: auth.status,
      headers: jsonHeaders,
    });
  }

  const body = await req.json();
  const action = body.action;

  if (action === "mark_all_read") {
    await markAllNotificationsRead(auth.userId);
    return new Response(JSON.stringify({ success: true }), {
      headers: jsonHeaders,
    });
  }

  if (action === "generate") {
    const notifications = await generateSmartNotifications(auth.userId);
    return new Response(
      JSON.stringify({ generated: notifications.length, notifications }),
      { headers: jsonHeaders }
    );
  }

  return new Response(JSON.stringify({ error: "Invalid action" }), {
    status: 400,
    headers: jsonHeaders,
  });
}
