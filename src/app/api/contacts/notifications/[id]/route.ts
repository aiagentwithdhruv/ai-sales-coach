import { NextRequest } from "next/server";
import { authenticateUser } from "@/lib/crm/contacts";
import {
  markNotificationRead,
  dismissNotification,
} from "@/lib/crm/notifications";

const jsonHeaders = { "Content-Type": "application/json" };

// PUT /api/contacts/notifications/[id] — Mark read or dismiss
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateUser(req.headers.get("authorization"));
  if ("error" in auth) {
    return new Response(JSON.stringify({ error: auth.error }), {
      status: auth.status,
      headers: jsonHeaders,
    });
  }

  const { id } = await params;
  const body = await req.json();

  if (body.action === "dismiss") {
    const success = await dismissNotification(auth.userId, id);
    return new Response(JSON.stringify({ success }), { headers: jsonHeaders });
  }

  // Default: mark as read
  const success = await markNotificationRead(auth.userId, id);
  return new Response(JSON.stringify({ success }), { headers: jsonHeaders });
}
