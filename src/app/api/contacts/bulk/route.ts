import { NextRequest } from "next/server";
import { authenticateUser } from "@/lib/crm/contacts";
import { createClient } from "@supabase/supabase-js";
import type { DealStage } from "@/types/crm";
import { DEAL_STAGES, STAGE_CONFIG } from "@/types/crm";
import { logStageChange } from "@/lib/crm/activities";
import { logStageHistory } from "@/lib/crm/notifications";

const jsonHeaders = { "Content-Type": "application/json" };

const getSupabaseAdmin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

// POST /api/contacts/bulk — Perform bulk actions on contacts
export async function POST(req: NextRequest) {
  const auth = await authenticateUser(req.headers.get("authorization"));
  if ("error" in auth) {
    return new Response(JSON.stringify({ error: auth.error }), {
      status: auth.status,
      headers: jsonHeaders,
    });
  }

  const body = await req.json();
  const { type, contactIds, payload } = body;

  if (!type || !contactIds || !Array.isArray(contactIds) || contactIds.length === 0) {
    return new Response(
      JSON.stringify({ error: "type and contactIds[] required" }),
      { status: 400, headers: jsonHeaders }
    );
  }

  if (contactIds.length > 100) {
    return new Response(
      JSON.stringify({ error: "Max 100 contacts per bulk action" }),
      { status: 400, headers: jsonHeaders }
    );
  }

  const supabase = getSupabaseAdmin();
  let affected = 0;

  switch (type) {
    case "stage_change": {
      const stage = payload?.stage as DealStage;
      if (!stage || !DEAL_STAGES.includes(stage)) {
        return new Response(
          JSON.stringify({ error: "Invalid stage" }),
          { status: 400, headers: jsonHeaders }
        );
      }

      // Get current contacts to log stage changes
      const { data: currentContacts } = await supabase
        .from("contacts")
        .select("id, deal_stage, deal_value")
        .eq("user_id", auth.userId)
        .in("id", contactIds);

      const probability = STAGE_CONFIG[stage]?.probability || 10;

      const { count } = await supabase
        .from("contacts")
        .update({
          deal_stage: stage,
          probability,
          last_contacted_at: new Date().toISOString(),
        })
        .eq("user_id", auth.userId)
        .in("id", contactIds);

      affected = count || 0;

      // Log stage changes + history
      if (currentContacts) {
        for (const c of currentContacts) {
          if (c.deal_stage !== stage) {
            await logStageChange(auth.userId, c.id, c.deal_stage, stage);
            await logStageHistory(auth.userId, c.id, c.deal_stage, stage, Number(c.deal_value) || 0);
          }
        }
      }
      break;
    }

    case "tag_add": {
      const tag = payload?.tag;
      if (!tag || typeof tag !== "string") {
        return new Response(
          JSON.stringify({ error: "tag required" }),
          { status: 400, headers: jsonHeaders }
        );
      }

      const { data: contacts } = await supabase
        .from("contacts")
        .select("id, tags")
        .eq("user_id", auth.userId)
        .in("id", contactIds);

      if (contacts) {
        for (const c of contacts) {
          const existingTags = (c.tags as string[]) || [];
          if (!existingTags.includes(tag)) {
            await supabase
              .from("contacts")
              .update({ tags: [...existingTags, tag] })
              .eq("id", c.id)
              .eq("user_id", auth.userId);
            affected++;
          }
        }
      }
      break;
    }

    case "tag_remove": {
      const tag = payload?.tag;
      if (!tag || typeof tag !== "string") {
        return new Response(
          JSON.stringify({ error: "tag required" }),
          { status: 400, headers: jsonHeaders }
        );
      }

      const { data: contacts } = await supabase
        .from("contacts")
        .select("id, tags")
        .eq("user_id", auth.userId)
        .in("id", contactIds);

      if (contacts) {
        for (const c of contacts) {
          const existingTags = (c.tags as string[]) || [];
          if (existingTags.includes(tag)) {
            await supabase
              .from("contacts")
              .update({ tags: existingTags.filter((t: string) => t !== tag) })
              .eq("id", c.id)
              .eq("user_id", auth.userId);
            affected++;
          }
        }
      }
      break;
    }

    case "delete": {
      const { count } = await supabase
        .from("contacts")
        .delete()
        .eq("user_id", auth.userId)
        .in("id", contactIds);

      affected = count || 0;
      break;
    }

    default:
      return new Response(
        JSON.stringify({ error: "Invalid action type" }),
        { status: 400, headers: jsonHeaders }
      );
  }

  return new Response(
    JSON.stringify({ success: true, affected }),
    { headers: jsonHeaders }
  );
}
