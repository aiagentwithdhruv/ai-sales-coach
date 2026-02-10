import { NextRequest } from "next/server";
import {
  authenticateUser,
  getContactsByStage,
  getPipelineStats,
} from "@/lib/crm/contacts";

const jsonHeaders = { "Content-Type": "application/json" };

// GET /api/contacts/pipeline — Get contacts grouped by stage + stats
export async function GET(req: NextRequest) {
  const auth = await authenticateUser(req.headers.get("authorization"));
  if ("error" in auth) {
    return new Response(JSON.stringify({ error: auth.error }), {
      status: auth.status,
      headers: jsonHeaders,
    });
  }

  const [stages, stats] = await Promise.all([
    getContactsByStage(auth.userId),
    getPipelineStats(auth.userId),
  ]);

  return new Response(JSON.stringify({ stages, stats }), {
    headers: jsonHeaders,
  });
}
