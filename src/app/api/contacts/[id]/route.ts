import { NextRequest } from "next/server";
import {
  authenticateUser,
  getContact,
  updateContact,
  deleteContact,
} from "@/lib/crm/contacts";
import { getActivities } from "@/lib/crm/activities";

const jsonHeaders = { "Content-Type": "application/json" };

// GET /api/contacts/:id — Get single contact with recent activities
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
  const contact = await getContact(auth.userId, id);
  if (!contact) {
    return new Response(
      JSON.stringify({ error: "Contact not found" }),
      { status: 404, headers: jsonHeaders }
    );
  }

  // Include recent activities
  const { activities } = await getActivities(id, { limit: 10 });

  return new Response(
    JSON.stringify({ ...contact, recent_activities: activities }),
    { headers: jsonHeaders }
  );
}

// PUT /api/contacts/:id — Update contact
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

  const contact = await updateContact(auth.userId, id, body);
  if (!contact) {
    return new Response(
      JSON.stringify({ error: "Contact not found or update failed" }),
      { status: 404, headers: jsonHeaders }
    );
  }

  return new Response(JSON.stringify(contact), { headers: jsonHeaders });
}

// DELETE /api/contacts/:id — Delete contact
export async function DELETE(
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
  const success = await deleteContact(auth.userId, id);
  if (!success) {
    return new Response(
      JSON.stringify({ error: "Contact not found or delete failed" }),
      { status: 404, headers: jsonHeaders }
    );
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: jsonHeaders,
  });
}
