// ============================================
// Team & Leaderboard Types
// ============================================

export interface Team {
  id: string;
  name: string;
  owner_id: string;
  description: string | null;
  invite_code: string;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export type TeamRole = "owner" | "manager" | "member";

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: TeamRole;
  display_name: string;
  score: number;
  sessions_count: number;
  streak: number;
  badges: string[];
  last_active_at: string | null;
  joined_at: string;
}

export interface TeamCreateInput {
  name: string;
  description?: string;
}

export interface TeamStats {
  totalMembers: number;
  avgScore: number;
  totalSessions: number;
  topPerformer: TeamMember | null;
  activeToday: number;
}

// ============================================
// AI Agent Types
// ============================================

export type VoiceProvider = "openai" | "elevenlabs";
export type InterruptSensitivity = "low" | "medium" | "high";
export type AgentTemplate = "cold_call" | "qualification" | "booking" | "support" | "follow_up" | "survey" | null;

export interface AIAgent {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  // Voice & Language
  voice_provider: VoiceProvider;
  voice_id: string;
  language: string;
  // AI Configuration
  system_prompt: string;
  greeting: string;
  model: string;
  temperature: number;
  max_tokens: number;
  // Behavior
  objective: string | null;
  knowledge_base: Array<{ source: string; content: string; type: string }>;
  tools_enabled: string[];
  objection_responses: Record<string, string>;
  // Call Settings
  max_call_duration_seconds: number;
  silence_timeout_seconds: number;
  interrupt_sensitivity: InterruptSensitivity;
  end_call_phrases: string[];
  // Template
  template_id: AgentTemplate;
  is_active: boolean;
  // Stats
  total_calls: number;
  avg_score: number;
  // Meta
  created_at: string;
  updated_at: string;
}

export interface AgentCreateInput {
  name: string;
  description?: string;
  voice_provider?: VoiceProvider;
  voice_id?: string;
  language?: string;
  system_prompt?: string;
  greeting?: string;
  model?: string;
  temperature?: number;
  objective?: string;
  template_id?: AgentTemplate;
  knowledge_base?: Array<{ source: string; content: string; type: string }>;
  tools_enabled?: string[];
  objection_responses?: Record<string, string>;
  max_call_duration_seconds?: number;
  silence_timeout_seconds?: number;
  interrupt_sensitivity?: InterruptSensitivity;
  end_call_phrases?: string[];
}

// ============================================
// Phone Number Types
// ============================================

export type PhoneProvider = "twilio" | "exotel";

export interface PhoneNumber {
  id: string;
  user_id: string;
  phone_number: string;
  friendly_name: string | null;
  provider: PhoneProvider;
  twilio_sid: string | null;
  country_code: string;
  capabilities: { voice: boolean; sms: boolean };
  assigned_agent_id: string | null;
  is_active: boolean;
  total_calls: number;
  monthly_calls: number;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// AI Calling Types
// ============================================

export type CampaignType = "outbound" | "inbound";
export type CampaignStatus = "draft" | "active" | "paused" | "completed";

export interface AICallCampaign {
  id: string;
  user_id: string;
  name: string;
  type: CampaignType;
  status: CampaignStatus;
  script: string | null;
  objective: string | null;
  voice_id: string;
  phone_number: string | null;
  contact_list_filter: Record<string, unknown>;
  settings: {
    max_duration_seconds: number;
    transfer_enabled: boolean;
    recording_enabled: boolean;
  };
  stats: {
    total_calls: number;
    connected: number;
    meetings_booked: number;
    avg_duration: number;
  };
  // New fields from migration 006
  agent_id: string | null;
  schedule: {
    timezone: string;
    days: number[];
    start_hour: number;
    end_hour: number;
  } | null;
  max_concurrent: number;
  retry_attempts: number;
  retry_delay_minutes: number;
  created_at: string;
  updated_at: string;
}

export type CallDirection = "outbound" | "inbound";
export type CallStatus = "queued" | "ringing" | "in_progress" | "completed" | "failed" | "no_answer" | "voicemail";
export type CallOutcome = "meeting_booked" | "callback_scheduled" | "interested" | "not_interested" | "wrong_number" | "voicemail" | "no_answer";
export type CallSentiment = "positive" | "neutral" | "negative";

export interface TranscriptEntry {
  speaker: "agent" | "contact";
  text: string;
  timestamp: number; // seconds from call start
}

export interface CostBreakdown {
  telephony: number;
  stt: number;
  llm: number;
  tts: number;
  total: number;
}

export interface ScoreBreakdown {
  discovery: number;
  rapport: number;
  objection_handling: number;
  closing: number;
  overall: number;
}

export interface AICall {
  id: string;
  user_id: string;
  campaign_id: string | null;
  contact_id: string | null;
  direction: CallDirection;
  status: CallStatus;
  phone_number: string | null;
  contact_name: string | null;
  duration_seconds: number;
  recording_url: string | null;
  transcript: string | null;
  summary: string | null;
  outcome: CallOutcome | null;
  sentiment: CallSentiment | null;
  ai_score: number | null;
  metadata: Record<string, unknown>;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
  // New fields from migration 006
  agent_id: string | null;
  phone_number_id: string | null;
  twilio_call_sid: string | null;
  from_number: string | null;
  to_number: string | null;
  answered_at: string | null;
  cost_breakdown: CostBreakdown | null;
  score_breakdown: ScoreBreakdown | null;
  transcript_json: TranscriptEntry[];
  objections_detected: string[];
  key_topics: string[];
  next_steps: string | null;
}

export interface CampaignCreateInput {
  name: string;
  type: CampaignType;
  script?: string;
  objective?: string;
  voice_id?: string;
  agent_id?: string;
}

export interface CallDashboardStats {
  totalCalls: number;
  connectedCalls: number;
  meetingsBooked: number;
  avgDuration: number;
  connectRate: number;
  meetingRate: number;
}

// ============================================
// CRM Integration Types
// ============================================

export type IntegrationProvider = "salesforce" | "hubspot" | "pipedrive" | "zoho";
export type IntegrationStatus = "connected" | "disconnected" | "error" | "syncing";

export interface CRMIntegration {
  id: string;
  user_id: string;
  provider: IntegrationProvider;
  status: IntegrationStatus;
  instance_url: string | null;
  sync_config: {
    contacts: boolean;
    deals: boolean;
    activities: boolean;
    auto_sync: boolean;
    sync_interval_hours: number;
  };
  last_sync_at: string | null;
  error_message: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export const INTEGRATION_PROVIDERS: Record<IntegrationProvider, {
  label: string;
  description: string;
  color: string;
  bgColor: string;
}> = {
  salesforce: {
    label: "Salesforce",
    description: "Sync contacts, deals, and activities with Salesforce CRM",
    color: "text-[#00A1E0]",
    bgColor: "bg-[#00A1E0]/10",
  },
  hubspot: {
    label: "HubSpot",
    description: "Connect your HubSpot CRM for bidirectional sync",
    color: "text-[#FF7A59]",
    bgColor: "bg-[#FF7A59]/10",
  },
  pipedrive: {
    label: "Pipedrive",
    description: "Sync your Pipedrive pipeline and contacts",
    color: "text-[#017737]",
    bgColor: "bg-[#017737]/10",
  },
  zoho: {
    label: "Zoho CRM",
    description: "Connect Zoho CRM for contact and deal sync",
    color: "text-[#E42527]",
    bgColor: "bg-[#E42527]/10",
  },
};

export const VOICE_OPTIONS = [
  { id: "alloy", name: "Alloy", description: "Neutral, professional", provider: "openai" as const },
  { id: "echo", name: "Echo", description: "Warm, friendly", provider: "openai" as const },
  { id: "fable", name: "Fable", description: "Energetic, persuasive", provider: "openai" as const },
  { id: "onyx", name: "Onyx", description: "Deep, authoritative", provider: "openai" as const },
  { id: "nova", name: "Nova", description: "Bright, conversational", provider: "openai" as const },
  { id: "shimmer", name: "Shimmer", description: "Calm, empathetic", provider: "openai" as const },
];

export const AGENT_TEMPLATES: Record<string, {
  name: string;
  description: string;
  system_prompt: string;
  greeting: string;
  objective: string;
  icon: string;
}> = {
  cold_call: {
    name: "Cold Call",
    description: "Initial outreach to new prospects",
    system_prompt: `You are a professional sales development representative making a cold call. Your goal is to introduce your company and product, identify if the prospect has relevant pain points, and book a demo meeting if there's interest.

Rules:
- Be concise and respectful of their time
- Ask open-ended questions to uncover pain points
- If they're not interested, thank them and end gracefully
- Never be pushy or aggressive
- If they mention a competitor, acknowledge it positively
- Always try to book a next step (demo, meeting, callback)`,
    greeting: "Hi {{contact_name}}, this is {{agent_name}} from {{company}}. I know I'm calling out of the blue — do you have a quick moment?",
    objective: "Book a demo meeting",
    icon: "PhoneOutgoing",
  },
  qualification: {
    name: "Lead Qualification",
    description: "Qualify leads with BANT framework",
    system_prompt: `You are a sales representative qualifying a lead using the BANT framework (Budget, Authority, Need, Timeline). Your goal is to determine if this prospect is a good fit.

Ask about:
1. Budget: What's their budget for this type of solution?
2. Authority: Are they the decision maker? Who else is involved?
3. Need: What problem are they trying to solve?
4. Timeline: When do they need a solution by?

Be conversational, not interrogative. If they qualify, schedule a meeting with a senior rep.`,
    greeting: "Hi {{contact_name}}, this is {{agent_name}} following up on your interest in {{company}}. I'd love to learn more about what you're looking for.",
    objective: "Qualify lead and schedule follow-up",
    icon: "ClipboardCheck",
  },
  booking: {
    name: "Meeting Booking",
    description: "Book meetings with interested prospects",
    system_prompt: `You are a scheduling assistant. Your sole goal is to book a meeting between the prospect and the sales team. You have access to the calendar.

Be efficient:
- Offer 2-3 time slots
- Confirm their email for the calendar invite
- Let them know what to expect in the meeting
- If no slots work, offer to send a scheduling link`,
    greeting: "Hi {{contact_name}}, this is {{agent_name}} from {{company}}. I'm calling to get a convenient time on your calendar for a quick demo. Do you have your calendar handy?",
    objective: "Book a calendar meeting",
    icon: "Calendar",
  },
  follow_up: {
    name: "Follow-Up",
    description: "Follow up after initial contact",
    system_prompt: `You are following up with a prospect who previously showed interest. Reference any previous conversations or materials sent. Your goal is to move them to the next stage.

Guidelines:
- Reference what was discussed before
- Ask if they had any questions about materials sent
- Address any concerns or objections
- Try to advance to the next step (meeting, proposal, etc.)`,
    greeting: "Hi {{contact_name}}, this is {{agent_name}} from {{company}}. I'm following up on our previous conversation. Is this a good time?",
    objective: "Advance deal to next stage",
    icon: "ArrowRight",
  },
  survey: {
    name: "Customer Survey",
    description: "Collect feedback from existing customers",
    system_prompt: `You are conducting a brief customer satisfaction survey. Be friendly and appreciative. Ask 3-5 questions about their experience. Thank them for their time.

Questions to cover:
1. Overall satisfaction (1-10)
2. What they like most
3. What could be improved
4. Would they recommend to others
5. Any additional feedback`,
    greeting: "Hi {{contact_name}}, this is {{agent_name}} from {{company}}. We really value your business and would love to get your quick feedback. Do you have 2 minutes?",
    objective: "Complete customer feedback survey",
    icon: "MessageSquare",
  },
};
