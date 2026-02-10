import { NextRequest } from "next/server";
import { authenticateUser, importContacts } from "@/lib/crm/contacts";
import type { ContactCreateInput } from "@/types/crm";

const jsonHeaders = { "Content-Type": "application/json" };

// POST /api/contacts/import — Batch import contacts
export async function POST(req: NextRequest) {
  const auth = await authenticateUser(req.headers.get("authorization"));
  if ("error" in auth) {
    return new Response(JSON.stringify({ error: auth.error }), {
      status: auth.status,
      headers: jsonHeaders,
    });
  }

  const body = await req.json();
  if (!body.contacts || !Array.isArray(body.contacts)) {
    return new Response(
      JSON.stringify({ error: "contacts array is required" }),
      { status: 400, headers: jsonHeaders }
    );
  }

  if (body.contacts.length > 500) {
    return new Response(
      JSON.stringify({ error: "Maximum 500 contacts per import" }),
      { status: 400, headers: jsonHeaders }
    );
  }

  const result = await importContacts(
    auth.userId,
    body.contacts as ContactCreateInput[]
  );

  return new Response(JSON.stringify(result), { headers: jsonHeaders });
}
