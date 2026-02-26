/**
 * ICP Templates API
 *
 * GET /api/icp/templates — Returns all available ICP templates
 */

import { ICP_TEMPLATES } from "@/lib/icp-templates";

export async function GET() {
  return new Response(
    JSON.stringify({ templates: ICP_TEMPLATES }),
    { headers: { "Content-Type": "application/json" } }
  );
}
