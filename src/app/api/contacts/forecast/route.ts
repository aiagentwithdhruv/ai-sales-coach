import { NextRequest } from "next/server";
import { authenticateUser } from "@/lib/crm/contacts";
import { getDealForecast } from "@/lib/crm/analytics";

const jsonHeaders = { "Content-Type": "application/json" };

// GET /api/contacts/forecast — Get deal forecast
export async function GET(req: NextRequest) {
  const auth = await authenticateUser(req.headers.get("authorization"));
  if ("error" in auth) {
    return new Response(JSON.stringify({ error: auth.error }), {
      status: auth.status,
      headers: jsonHeaders,
    });
  }

  const forecast = await getDealForecast(auth.userId);

  return new Response(JSON.stringify(forecast), { headers: jsonHeaders });
}
