// ============================================
// CRM Types — QuotaHit AI Sales Coach
// ============================================

// Deal pipeline stages (ordered)
export const DEAL_STAGES = [
  "new",
  "contacted",
  "qualified",
  "proposal",
  "negotiation",
  "won",
  "lost",
] as const;

export type DealStage = (typeof DEAL_STAGES)[number];

// Active stages (for pipeline kanban, excludes won/lost)
export const ACTIVE_STAGES: DealStage[] = [
  "new",
  "contacted",
  "qualified",
  "proposal",
  "negotiation",
];

// Stage display config
export const STAGE_CONFIG: Record<
  DealStage,
  { label: string; color: string; bgColor: string; probability: number }
> = {
  new: {
    label: "New",
    color: "text-silver",
    bgColor: "bg-silver/10",
    probability: 10,
  },
  contacted: {
    label: "Contacted",
    color: "text-neonblue",
    bgColor: "bg-neonblue/10",
    probability: 20,
  },
  qualified: {
    label: "Qualified",
    color: "text-electricblue",
    bgColor: "bg-electricblue/10",
    probability: 40,
  },
  proposal: {
    label: "Proposal",
    color: "text-warningamber",
    bgColor: "bg-warningamber/10",
    probability: 60,
  },
  negotiation: {
    label: "Negotiation",
    color: "text-purple-400",
    bgColor: "bg-purple-400/10",
    probability: 75,
  },
  won: {
    label: "Won",
    color: "text-automationgreen",
    bgColor: "bg-automationgreen/10",
    probability: 100,
  },
  lost: {
    label: "Lost",
    color: "text-errorred",
    bgColor: "bg-errorred/10",
    probability: 0,
  },
};

// Enrichment data shape
export interface EnrichmentData {
  company_overview?: string;
  key_people?: Array<{ name: string; title: string; insight: string }>;
  recent_news?: string[];
  pain_points?: string[];
  tech_stack?: string[];
  conversation_starters?: string[];
  linkedin_url?: string;
  website?: string;
  industry?: string;
  company_size?: string;
  funding?: string;
}

// Contact entity
export interface Contact {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  title: string | null;
  deal_stage: DealStage;
  deal_value: number;
  probability: number;
  lead_score: number;
  source: string;
  do_not_call: boolean;
  do_not_email: boolean;
  last_contacted_at: string | null;
  next_follow_up_at: string | null;
  expected_close_date: string | null;
  tags: string[];
  custom_fields: Record<string, unknown>;
  notes: string | null;
  enrichment_data: EnrichmentData;
  enrichment_status: "pending" | "enriching" | "enriched" | "failed";
  enriched_at: string | null;
  created_at: string;
  updated_at: string;
}

// Activity types
export type ActivityType =
  | "note"
  | "call"
  | "email_sent"
  | "email_opened"
  | "meeting"
  | "research"
  | "quote_sent"
  | "stage_change"
  | "score_change"
  | "enrichment"
  | "practice"
  | "task"
  | "system";

// Activity entity
export interface Activity {
  id: string;
  user_id: string;
  contact_id: string;
  type: ActivityType;
  title: string;
  description: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

// Form input for creating a contact (minimal fields)
export interface ContactCreateInput {
  first_name: string;
  last_name?: string;
  email?: string;
  phone?: string;
  company?: string;
  title?: string;
  deal_stage?: DealStage;
  deal_value?: number;
  tags?: string[];
  notes?: string;
  source?: string;
}

// Form input for updating
export type ContactUpdateInput = Partial<
  Omit<Contact, "id" | "user_id" | "created_at" | "updated_at">
>;

// Pipeline summary stats
export interface PipelineStats {
  totalContacts: number;
  totalPipelineValue: number;
  weightedValue: number;
  stageBreakdown: Record<DealStage, { count: number; value: number }>;
  needsFollowUp: number;
  recentlyAdded: number;
}

// Filters for contact list
export interface ContactFilters {
  search?: string;
  stage?: DealStage | "all";
  tags?: string[];
  sortBy?:
    | "name"
    | "company"
    | "deal_value"
    | "lead_score"
    | "created_at"
    | "last_contacted_at"
    | "next_follow_up_at";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

// Lead score calculation helpers
export function calculateLeadScore(contact: Partial<Contact>, activityCount = 0): number {
  let score = 0;
  if (contact.email) score += 10;
  if (contact.phone) score += 10;
  if (contact.company) score += 10;
  if (contact.enrichment_status === "enriched") score += 15;
  if (contact.deal_value && contact.deal_value > 0) score += 10;
  // Activity bonus: +5 per interaction, cap at 20
  score += Math.min(activityCount * 5, 20);
  // Stage bonus
  const stageBonus: Record<string, number> = {
    contacted: 5,
    qualified: 10,
    proposal: 15,
    negotiation: 20,
    won: 25,
  };
  if (contact.deal_stage && stageBonus[contact.deal_stage]) {
    score += stageBonus[contact.deal_stage];
  }
  return Math.min(score, 100);
}
