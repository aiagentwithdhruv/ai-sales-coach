/**
 * Developer API Key Management
 *
 * GET /api/developer/keys — List all API keys
 * POST /api/developer/keys — Create a new API key
 * DELETE /api/developer/keys?id=<keyId> — Revoke an API key
 */

import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createApiKey, listApiKeys, revokeApiKey } from "@/lib/api-keys";

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
    const keys = await listApiKeys(user.id);
    return new Response(JSON.stringify({ keys }), { headers: json });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Failed to list API keys" }),
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
    const { name, environment, scopes, ipWhitelist, expiresInDays } = body;

    if (!name) {
      return new Response(
        JSON.stringify({ error: "name is required" }),
        { status: 400, headers: json }
      );
    }

    const result = await createApiKey(user.id, name, {
      environment,
      scopes,
      ipWhitelist,
      expiresInDays,
    });

    return new Response(
      JSON.stringify({
        ...result,
        warning: "Save this API key now. It won't be shown again.",
      }),
      { status: 201, headers: json }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Failed to create API key",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: json }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const user = await authenticateUser(req.headers.get("authorization"));
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: json,
    });
  }

  const keyId = req.nextUrl.searchParams.get("id");
  if (!keyId) {
    return new Response(
      JSON.stringify({ error: "id query parameter required" }),
      { status: 400, headers: json }
    );
  }

  try {
    const revoked = await revokeApiKey(user.id, keyId);
    if (!revoked) {
      return new Response(
        JSON.stringify({ error: "Key not found or already revoked" }),
        { status: 404, headers: json }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "API key revoked" }),
      { headers: json }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Failed to revoke API key" }),
      { status: 500, headers: json }
    );
  }
}
