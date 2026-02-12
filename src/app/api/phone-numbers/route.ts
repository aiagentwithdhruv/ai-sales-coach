import { NextRequest } from "next/server";
import { authenticateUser } from "@/lib/crm/contacts";
import { getPhoneNumbers, buyNumber } from "@/lib/crm/phone-numbers";

const json = { "Content-Type": "application/json" };

// GET /api/phone-numbers — List user's phone numbers
export async function GET(req: NextRequest) {
  const auth = await authenticateUser(req.headers.get("authorization"));
  if ("error" in auth) {
    return new Response(JSON.stringify({ error: auth.error }), { status: auth.status, headers: json });
  }

  const numbers = await getPhoneNumbers(auth.userId);
  return new Response(JSON.stringify({ numbers }), { status: 200, headers: json });
}

// POST /api/phone-numbers — Buy a new phone number
export async function POST(req: NextRequest) {
  const auth = await authenticateUser(req.headers.get("authorization"));
  if ("error" in auth) {
    return new Response(JSON.stringify({ error: auth.error }), { status: auth.status, headers: json });
  }

  const body = await req.json();
  const { phoneNumber, countryCode } = body;

  if (!phoneNumber) {
    return new Response(JSON.stringify({ error: "phoneNumber is required" }), { status: 400, headers: json });
  }

  try {
    const number = await buyNumber(auth.userId, phoneNumber, countryCode || "US");
    if (!number) {
      return new Response(JSON.stringify({ error: "Failed to purchase number" }), { status: 500, headers: json });
    }
    return new Response(JSON.stringify({ number }), { status: 201, headers: json });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Purchase failed" }),
      { status: 500, headers: json }
    );
  }
}
