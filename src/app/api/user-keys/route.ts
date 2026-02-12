import { NextRequest } from "next/server";
import { authenticateUser } from "@/lib/crm/contacts";
import {
  getUserKeys,
  setUserKey,
  deleteUserKey,
  validateKey,
  USER_MANAGED_PROVIDERS,
  type UserManagedProvider,
} from "@/lib/user-keys";

const json = { "Content-Type": "application/json" };

// GET /api/user-keys — List user's API keys (hints only)
export async function GET(req: NextRequest) {
  const auth = await authenticateUser(req.headers.get("authorization"));
  if ("error" in auth) {
    return new Response(JSON.stringify({ error: auth.error }), { status: auth.status, headers: json });
  }

  const keys = await getUserKeys(auth.userId);
  return new Response(JSON.stringify({ keys }), { status: 200, headers: json });
}

// POST /api/user-keys — Add or update a key
export async function POST(req: NextRequest) {
  const auth = await authenticateUser(req.headers.get("authorization"));
  if ("error" in auth) {
    return new Response(JSON.stringify({ error: auth.error }), { status: auth.status, headers: json });
  }

  const body = await req.json();
  const { provider, key } = body;

  if (!provider || !key) {
    return new Response(JSON.stringify({ error: "provider and key are required" }), { status: 400, headers: json });
  }

  if (!USER_MANAGED_PROVIDERS.includes(provider)) {
    return new Response(
      JSON.stringify({ error: `Invalid provider. Allowed: ${USER_MANAGED_PROVIDERS.join(", ")}` }),
      { status: 400, headers: json }
    );
  }

  // Validate the key first
  const validation = await validateKey(provider as UserManagedProvider, key);
  if (!validation.valid) {
    return new Response(
      JSON.stringify({ error: `Invalid API key: ${validation.error}` }),
      { status: 400, headers: json }
    );
  }

  // Save the encrypted key
  const result = await setUserKey(auth.userId, provider as UserManagedProvider, key);
  if (!result.success) {
    return new Response(JSON.stringify({ error: result.error }), { status: 500, headers: json });
  }

  return new Response(
    JSON.stringify({ success: true, message: `${provider} API key saved successfully` }),
    { status: 200, headers: json }
  );
}

// DELETE /api/user-keys — Remove a key
export async function DELETE(req: NextRequest) {
  const auth = await authenticateUser(req.headers.get("authorization"));
  if ("error" in auth) {
    return new Response(JSON.stringify({ error: auth.error }), { status: auth.status, headers: json });
  }

  const { searchParams } = req.nextUrl;
  const provider = searchParams.get("provider");

  if (!provider || !USER_MANAGED_PROVIDERS.includes(provider as UserManagedProvider)) {
    return new Response(
      JSON.stringify({ error: "Valid provider query parameter required" }),
      { status: 400, headers: json }
    );
  }

  const success = await deleteUserKey(auth.userId, provider as UserManagedProvider);
  if (!success) {
    return new Response(JSON.stringify({ error: "Failed to delete key" }), { status: 500, headers: json });
  }

  return new Response(JSON.stringify({ success: true }), { status: 200, headers: json });
}
