import { createClient } from "@supabase/supabase-js";
import type {
  Contact,
  ContactCreateInput,
  ContactUpdateInput,
  ContactFilters,
  DealStage,
  PipelineStats,
  DEAL_STAGES,
} from "@/types/crm";
import { calculateLeadScore, STAGE_CONFIG } from "@/types/crm";

const getSupabaseAdmin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

/**
 * Authenticate user from Bearer token, return userId
 */
export async function authenticateUser(
  authHeader: string | null
): Promise<{ userId: string } | { error: string; status: number }> {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { error: "Unauthorized", status: 401 };
  }
  const token = authHeader.replace("Bearer ", "");
  const supabase = getSupabaseAdmin();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);
  if (error || !user) {
    return { error: "Invalid token", status: 401 };
  }
  return { userId: user.id };
}

/**
 * Get paginated contacts with filters
 */
export async function getContacts(
  userId: string,
  filters: ContactFilters = {}
): Promise<{ contacts: Contact[]; total: number }> {
  const supabase = getSupabaseAdmin();
  const {
    search,
    stage,
    tags,
    sortBy = "created_at",
    sortOrder = "desc",
    page = 1,
    limit = 50,
  } = filters;

  let query = supabase
    .from("contacts")
    .select("*", { count: "exact" })
    .eq("user_id", userId);

  if (stage && stage !== "all") {
    query = query.eq("deal_stage", stage);
  }

  if (search) {
    query = query.or(
      `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,company.ilike.%${search}%,phone.ilike.%${search}%`
    );
  }

  if (tags && tags.length > 0) {
    query = query.overlaps("tags", tags);
  }

  // Sort mapping
  const sortColumn =
    sortBy === "name" ? "first_name" : sortBy;
  query = query.order(sortColumn, { ascending: sortOrder === "asc" });

  // Pagination
  const from = (page - 1) * limit;
  query = query.range(from, from + limit - 1);

  const { data, count, error } = await query;
  if (error) {
    console.error("[CRM] getContacts error:", error);
    return { contacts: [], total: 0 };
  }

  return { contacts: (data || []) as Contact[], total: count || 0 };
}

/**
 * Get a single contact by ID
 */
export async function getContact(
  userId: string,
  contactId: string
): Promise<Contact | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("contacts")
    .select("*")
    .eq("id", contactId)
    .eq("user_id", userId)
    .single();

  if (error) return null;
  return data as Contact;
}

/**
 * Create a new contact
 */
export async function createContact(
  userId: string,
  input: ContactCreateInput
): Promise<Contact | null> {
  const supabase = getSupabaseAdmin();

  const probability =
    STAGE_CONFIG[input.deal_stage || "new"]?.probability || 10;

  const { data, error } = await supabase
    .from("contacts")
    .insert({
      user_id: userId,
      first_name: input.first_name,
      last_name: input.last_name || null,
      email: input.email || null,
      phone: input.phone || null,
      company: input.company || null,
      title: input.title || null,
      deal_stage: input.deal_stage || "new",
      deal_value: input.deal_value || 0,
      probability,
      tags: input.tags || [],
      notes: input.notes || null,
      source: input.source || "manual",
      lead_score: calculateLeadScore({
        email: input.email || null,
        phone: input.phone || null,
        company: input.company || null,
        deal_value: input.deal_value || 0,
        deal_stage: input.deal_stage || "new",
        enrichment_status: "pending",
      }),
    })
    .select()
    .single();

  if (error) {
    console.error("[CRM] createContact error:", error);
    return null;
  }

  return data as Contact;
}

/**
 * Update a contact
 */
export async function updateContact(
  userId: string,
  contactId: string,
  input: ContactUpdateInput
): Promise<Contact | null> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("contacts")
    .update(input)
    .eq("id", contactId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    console.error("[CRM] updateContact error:", error);
    return null;
  }

  return data as Contact;
}

/**
 * Delete a contact and all activities
 */
export async function deleteContact(
  userId: string,
  contactId: string
): Promise<boolean> {
  const supabase = getSupabaseAdmin();

  const { error } = await supabase
    .from("contacts")
    .delete()
    .eq("id", contactId)
    .eq("user_id", userId);

  return !error;
}

/**
 * Update deal stage with probability auto-set
 */
export async function updateDealStage(
  userId: string,
  contactId: string,
  newStage: DealStage
): Promise<{ contact: Contact | null; previousStage: string | null }> {
  const supabase = getSupabaseAdmin();

  // Get current stage
  const current = await getContact(userId, contactId);
  if (!current) return { contact: null, previousStage: null };

  const probability = STAGE_CONFIG[newStage]?.probability || 10;

  const { data, error } = await supabase
    .from("contacts")
    .update({
      deal_stage: newStage,
      probability,
      last_contacted_at: new Date().toISOString(),
    })
    .eq("id", contactId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    console.error("[CRM] updateDealStage error:", error);
    return { contact: null, previousStage: current.deal_stage };
  }

  return { contact: data as Contact, previousStage: current.deal_stage };
}

/**
 * Get contacts grouped by stage (for pipeline view)
 */
export async function getContactsByStage(
  userId: string
): Promise<Record<DealStage, Contact[]>> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("contacts")
    .select("*")
    .eq("user_id", userId)
    .order("deal_value", { ascending: false });

  if (error || !data) {
    return {
      new: [],
      contacted: [],
      qualified: [],
      proposal: [],
      negotiation: [],
      won: [],
      lost: [],
    };
  }

  const grouped: Record<DealStage, Contact[]> = {
    new: [],
    contacted: [],
    qualified: [],
    proposal: [],
    negotiation: [],
    won: [],
    lost: [],
  };

  for (const contact of data as Contact[]) {
    if (grouped[contact.deal_stage]) {
      grouped[contact.deal_stage].push(contact);
    }
  }

  return grouped;
}

/**
 * Get pipeline statistics
 */
export async function getPipelineStats(
  userId: string
): Promise<PipelineStats> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("contacts")
    .select("deal_stage, deal_value, probability, next_follow_up_at, created_at")
    .eq("user_id", userId);

  const stats: PipelineStats = {
    totalContacts: 0,
    totalPipelineValue: 0,
    weightedValue: 0,
    stageBreakdown: {
      new: { count: 0, value: 0 },
      contacted: { count: 0, value: 0 },
      qualified: { count: 0, value: 0 },
      proposal: { count: 0, value: 0 },
      negotiation: { count: 0, value: 0 },
      won: { count: 0, value: 0 },
      lost: { count: 0, value: 0 },
    },
    needsFollowUp: 0,
    recentlyAdded: 0,
  };

  if (error || !data) return stats;

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  for (const row of data) {
    const stage = row.deal_stage as DealStage;
    const value = Number(row.deal_value) || 0;
    const prob = Number(row.probability) || 0;

    stats.totalContacts++;
    if (stage !== "lost") {
      stats.totalPipelineValue += value;
      stats.weightedValue += value * (prob / 100);
    }

    if (stats.stageBreakdown[stage]) {
      stats.stageBreakdown[stage].count++;
      stats.stageBreakdown[stage].value += value;
    }

    if (
      row.next_follow_up_at &&
      new Date(row.next_follow_up_at) <= now
    ) {
      stats.needsFollowUp++;
    }

    if (new Date(row.created_at) >= weekAgo) {
      stats.recentlyAdded++;
    }
  }

  return stats;
}

/**
 * Batch import contacts (CSV import)
 */
export async function importContacts(
  userId: string,
  contacts: ContactCreateInput[]
): Promise<{ imported: number; skipped: number; errors: string[] }> {
  const supabase = getSupabaseAdmin();
  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const input of contacts) {
    if (!input.first_name) {
      errors.push(`Skipped row: missing first_name`);
      skipped++;
      continue;
    }

    // Deduplicate by email
    if (input.email) {
      const { data: existing } = await supabase
        .from("contacts")
        .select("id")
        .eq("user_id", userId)
        .eq("email", input.email)
        .maybeSingle();

      if (existing) {
        skipped++;
        continue;
      }
    }

    const result = await createContact(userId, {
      ...input,
      source: "csv_import",
    });

    if (result) {
      imported++;
    } else {
      errors.push(`Failed to import: ${input.first_name} ${input.last_name || ""}`);
    }
  }

  return { imported, skipped, errors };
}
