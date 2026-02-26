/**
 * ICP (Ideal Customer Profile) API
 *
 * GET  /api/icp — Retrieve the user's ICP from user_metadata
 * PUT  /api/icp — Save/update the user's ICP in user_metadata
 *
 * ICP data is stored in Supabase user_metadata for simplicity.
 * Fields: product_description, target_customer, website_url, industry,
 *         company_size, deal_size, channels, icp_template_id
 */

import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

const json = { "Content-Type": "application/json" };

const getAdmin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

async function authenticate(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { error: "Unauthorized", status: 401 };
  }
  const supabase = getAdmin();
  const { data: { user }, error } = await supabase.auth.getUser(
    authHeader.replace("Bearer ", "")
  );
  if (error || !user) return { error: "Invalid token", status: 401 };
  return { user };
}

// GET /api/icp — Get user's ICP
export async function GET(req: NextRequest) {
  const auth = await authenticate(req);
  if ("error" in auth) {
    return new Response(JSON.stringify({ error: auth.error }), { status: auth.status, headers: json });
  }

  const meta = auth.user.user_metadata || {};

  return new Response(
    JSON.stringify({
      product_description: meta.product_description || null,
      target_customer: meta.target_customer || null,
      website_url: meta.website_url || null,
      industry: meta.industry || null,
      company_size: meta.company_size || null,
      deal_size: meta.deal_size || null,
      channels: meta.preferred_channels || ["email"],
      icp_template_id: meta.icp_template_id || null,
      setup_complete: meta.setup_complete || false,
    }),
    { headers: json }
  );
}

// PUT /api/icp — Save/update ICP
export async function PUT(req: NextRequest) {
  const auth = await authenticate(req);
  if ("error" in auth) {
    return new Response(JSON.stringify({ error: auth.error }), { status: auth.status, headers: json });
  }

  const body = await req.json();
  const {
    product_description,
    target_customer,
    website_url,
    industry,
    company_size,
    deal_size,
    channels,
    icp_template_id,
  } = body;

  const supabase = getAdmin();

  const updates: Record<string, unknown> = {};
  if (product_description !== undefined) updates.product_description = product_description;
  if (target_customer !== undefined) updates.target_customer = target_customer;
  if (website_url !== undefined) updates.website_url = website_url;
  if (industry !== undefined) updates.industry = industry;
  if (company_size !== undefined) updates.company_size = company_size;
  if (deal_size !== undefined) updates.deal_size = deal_size;
  if (channels !== undefined) updates.preferred_channels = channels;
  if (icp_template_id !== undefined) updates.icp_template_id = icp_template_id;
  updates.setup_complete = true;

  const { error } = await supabase.auth.admin.updateUserById(auth.user.id, {
    user_metadata: { ...auth.user.user_metadata, ...updates },
  });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: json });
  }

  return new Response(
    JSON.stringify({ success: true, message: "ICP updated" }),
    { headers: json }
  );
}
