/**
 * White-Label Configuration API
 *
 * GET /api/white-label — Get current config
 * PUT /api/white-label — Update config
 * GET /api/white-label/clients — List agency clients
 * POST /api/white-label/clients — Add a client
 */

import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  getWhiteLabelConfig,
  updateWhiteLabelConfig,
  listAgencyClients,
  addAgencyClient,
  getAgencyRevenue,
} from "@/lib/white-label";

export const runtime = "nodejs";

const json = { "Content-Type": "application/json" };

const getAdmin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

async function authenticateUser(authHeader: string | null) {
  if (!authHeader?.startsWith("Bearer ")) return null;
  const supabase = getAdmin();
  const { data: { user }, error } = await supabase.auth.getUser(
    authHeader.replace("Bearer ", "")
  );
  if (error || !user) return null;
  return user;
}

export async function GET(req: NextRequest) {
  const user = await authenticateUser(req.headers.get("authorization"));
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: json,
    });
  }

  try {
    const config = await getWhiteLabelConfig(user.id);
    const clients = await listAgencyClients(user.id);
    const revenue = await getAgencyRevenue(user.id);

    return new Response(
      JSON.stringify({ config, clients, revenue }),
      { headers: json }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Failed to get white-label config" }),
      { status: 500, headers: json }
    );
  }
}

export async function PUT(req: NextRequest) {
  const user = await authenticateUser(req.headers.get("authorization"));
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: json,
    });
  }

  try {
    const body = await req.json();
    const updated = await updateWhiteLabelConfig(user.id, body);

    return new Response(
      JSON.stringify({ success: true, config: updated }),
      { headers: json }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Failed to update config" }),
      { status: 500, headers: json }
    );
  }
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
    const body = await req.json();
    const { action } = body;

    if (action === "add_client") {
      const { name, email, monthlyFee, commissionPercent } = body;
      if (!name || !email) {
        return new Response(
          JSON.stringify({ error: "name and email are required" }),
          { status: 400, headers: json }
        );
      }

      const client = await addAgencyClient(user.id, {
        name,
        email,
        monthlyFee,
        commissionPercent,
      });

      return new Response(
        JSON.stringify({ success: true, client }),
        { status: 201, headers: json }
      );
    }

    return new Response(
      JSON.stringify({ error: "Unknown action" }),
      { status: 400, headers: json }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Failed to process request" }),
      { status: 500, headers: json }
    );
  }
}
