import { NextRequest } from "next/server";
import { authenticateUser } from "@/lib/crm/contacts";
import { getActivities, logActivity } from "@/lib/crm/activities";
import type { ActivityType } from "@/types/crm";

const jsonHeaders = { "Content-Type": "application/json" };

// GET /api/contacts/:id/activities — Get activity timeline
export async function GET(
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
  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = parseInt(url.searchParams.get("limit") || "20");
  const type = url.searchParams.get("type") as ActivityType | null;

  const result = await getActivities(id, {
    page,
    limit,
    type: type || undefined,
  });

  return new Response(JSON.stringify(result), { headers: jsonHeaders });
}

// POST /api/contacts/:id/activities — Log a new activity
export async function POST(
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

  if (!body.type || !body.title) {
    return new Response(
      JSON.stringify({ error: "type and title are required" }),
      { status: 400, headers: jsonHeaders }
    );
  }

  const activity = await logActivity(
    auth.userId,
    id,
    body.type,
    body.title,
    body.description,
    body.metadata
  );

  if (!activity) {
    return new Response(
      JSON.stringify({ error: "Failed to log activity" }),
      { status: 500, headers: jsonHeaders }
    );
  }

  return new Response(JSON.stringify(activity), {
    status: 201,
    headers: jsonHeaders,
  });
}
