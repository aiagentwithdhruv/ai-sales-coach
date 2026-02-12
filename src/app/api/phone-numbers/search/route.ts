import { NextRequest } from "next/server";
import { authenticateUser } from "@/lib/crm/contacts";
import { searchNumbers } from "@/lib/crm/phone-numbers";

const json = { "Content-Type": "application/json" };

// GET /api/phone-numbers/search?country=US&areaCode=415&contains=SALE
export async function GET(req: NextRequest) {
  const auth = await authenticateUser(req.headers.get("authorization"));
  if ("error" in auth) {
    return new Response(JSON.stringify({ error: auth.error }), { status: auth.status, headers: json });
  }

  const countryCode = req.nextUrl.searchParams.get("country") || "US";
  const areaCode = req.nextUrl.searchParams.get("areaCode") || undefined;
  const contains = req.nextUrl.searchParams.get("contains") || undefined;
  const limit = parseInt(req.nextUrl.searchParams.get("limit") || "10");

  try {
    const numbers = await searchNumbers({ countryCode, areaCode, contains, limit });
    return new Response(JSON.stringify({ numbers }), { status: 200, headers: json });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Search failed" }),
      { status: 500, headers: json }
    );
  }
}
