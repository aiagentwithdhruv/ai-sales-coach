import { NextRequest } from "next/server";
import { authenticateUser } from "@/lib/crm/contacts";
import {
  getIntegrations,
  connectIntegration,
  disconnectIntegration,
  updateSyncConfig,
  triggerSync,
} from "@/lib/crm/integrations";

const jsonHeaders = { "Content-Type": "application/json" };

// GET /api/integrations — List all integrations
export async function GET(req: NextRequest) {
  const auth = await authenticateUser(req.headers.get("authorization"));
  if ("error" in auth) {
    return new Response(JSON.stringify({ error: auth.error }), { status: auth.status, headers: jsonHeaders });
  }
  const integrations = await getIntegrations(auth.userId);
  return new Response(JSON.stringify({ integrations }), { headers: jsonHeaders });
}

// POST /api/integrations — Connect, disconnect, sync, or update config
export async function POST(req: NextRequest) {
  const auth = await authenticateUser(req.headers.get("authorization"));
  if ("error" in auth) {
    return new Response(JSON.stringify({ error: auth.error }), { status: auth.status, headers: jsonHeaders });
  }

  const body = await req.json();
  const { action, provider, config, sync_config, sync_options } = body;

  if (!provider) {
    return new Response(JSON.stringify({ error: "provider required" }), { status: 400, headers: jsonHeaders });
  }

  switch (action) {
    case "connect": {
      const integration = await connectIntegration(auth.userId, provider, config);
      return new Response(JSON.stringify(integration), { headers: jsonHeaders });
    }
    case "disconnect": {
      const success = await disconnectIntegration(auth.userId, provider);
      return new Response(JSON.stringify({ success }), { headers: jsonHeaders });
    }
    case "sync": {
      const result = await triggerSync(auth.userId, provider, sync_options);
      return new Response(JSON.stringify(result), { headers: jsonHeaders });
    }
    case "update_config": {
      if (!sync_config) {
        return new Response(JSON.stringify({ error: "sync_config required" }), { status: 400, headers: jsonHeaders });
      }
      const success = await updateSyncConfig(auth.userId, provider, sync_config);
      return new Response(JSON.stringify({ success }), { headers: jsonHeaders });
    }
    default:
      return new Response(JSON.stringify({ error: "Invalid action" }), { status: 400, headers: jsonHeaders });
  }
}
