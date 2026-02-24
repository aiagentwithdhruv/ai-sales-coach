import { NextRequest } from "next/server";
import {
  authenticateUser,
  getContacts,
  createContact,
} from "@/lib/crm/contacts";
import { logActivity } from "@/lib/crm/activities";
import { inngest } from "@/inngest/client";
import type { ContactFilters, DealStage } from "@/types/crm";

const jsonHeaders = { "Content-Type": "application/json" };

// GET /api/contacts — List contacts with filters
export async function GET(req: NextRequest) {
  const auth = await authenticateUser(req.headers.get("authorization"));
  if ("error" in auth) {
    return new Response(JSON.stringify({ error: auth.error }), {
      status: auth.status,
      headers: jsonHeaders,
    });
  }

  const url = new URL(req.url);
  const filters: ContactFilters = {
    search: url.searchParams.get("search") || undefined,
    stage: (url.searchParams.get("stage") as DealStage | "all") || "all",
    sortBy: (url.searchParams.get("sort") as ContactFilters["sortBy"]) || "created_at",
    sortOrder: (url.searchParams.get("order") as "asc" | "desc") || "desc",
    page: parseInt(url.searchParams.get("page") || "1"),
    limit: parseInt(url.searchParams.get("limit") || "50"),
  };

  const result = await getContacts(auth.userId, filters);
  return new Response(JSON.stringify(result), { headers: jsonHeaders });
}

// POST /api/contacts — Create a new contact
export async function POST(req: NextRequest) {
  const auth = await authenticateUser(req.headers.get("authorization"));
  if ("error" in auth) {
    return new Response(JSON.stringify({ error: auth.error }), {
      status: auth.status,
      headers: jsonHeaders,
    });
  }

  const body = await req.json();
  if (!body.first_name) {
    return new Response(
      JSON.stringify({ error: "first_name is required" }),
      { status: 400, headers: jsonHeaders }
    );
  }

  const contact = await createContact(auth.userId, body);
  if (!contact) {
    return new Response(
      JSON.stringify({ error: "Failed to create contact" }),
      { status: 500, headers: jsonHeaders }
    );
  }

  // Log activity
  await logActivity(
    auth.userId,
    contact.id,
    "system",
    "Contact created",
    `Added ${contact.first_name} ${contact.last_name || ""} to CRM`,
    { source: contact.source }
  );

  // Trigger Inngest lead pipeline (score → qualify → route)
  await inngest.send({
    name: "contact/created",
    data: {
      contactId: contact.id,
      userId: auth.userId,
      source: contact.source || "manual",
    },
  }).catch(() => {
    // Non-blocking: don't fail contact creation if Inngest is unavailable
  });

  return new Response(JSON.stringify(contact), {
    status: 201,
    headers: jsonHeaders,
  });
}
