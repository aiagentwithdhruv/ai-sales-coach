# Phase 1: The Qualification Machine
## LOADOUT.md | QuotaHit Build Phase 1

> Turn the existing CRM into an autonomous qualification engine.

---

## Schema

### Inputs
| Input | Type | Source |
|-------|------|--------|
| Existing CRM codebase | Next.js 16 + Supabase | `ai-sales-coach/` |
| Existing AI provider routing | Multi-model (25+) | `src/api/ai/` |
| Existing agent infrastructure | Agent builder + Sarah | `src/api/agents/` |
| Existing Twilio calling | Outbound + campaigns | `src/api/calling/` |
| Existing Stripe integration | Checkout + webhooks | `src/api/stripe/` |
| Existing follow-up schema | DB tables exist, no execution | `supabase/migrations/` |

### Outputs
| Output | Type | Destination |
|--------|------|------------|
| Lead Scoring Engine | API route + scoring logic | `/api/leads/score` |
| Qualification Agent | AI agent with BANT+ | `/api/agents/qualifier` |
| Smart Router | Assignment logic (Mode A/B/C) | `/api/leads/route` |
| QuotaHit MCP Server | FastMCP, stdio, 15+ tools | `tools/quotahit_mcp.py` |
| Follow-Up Executor | Sends emails/messages on schedule | `/api/follow-ups/execute` |
| Agent Loadout Structure | LOADOUT.md for each of 7 agents | `agents/` |
| VoiceInput Component | Universal voice for all fields | `src/components/ui/voice-input.tsx` |
| Inngest Integration | Durable agent workflows | `src/inngest/` |
| Consent Service | TCPA compliance + audit trail | `/api/compliance/` |

### Dependencies
| Dependency | Version | Why |
|-----------|---------|-----|
| inngest | latest | Durable agent workflow orchestration |
| @upstash/redis | latest | Event streaming + caching |
| mcp (FastMCP) | 1.26.0+ | MCP server for QuotaHit |

---

## Build Items (9 total, ~18-26 hours)

### Item 1: Lead Scoring Engine (2-3 hrs)
**What:** Auto-score every lead 0-100 on entry/update.
**Where:** New API route `/api/leads/score` + scoring utility.
**How:**
- Enrichment data (already exists from Perplexity) → extract signals
- Scoring weights: ICP match (20), company size (15), decision maker (15), budget signals (15), tech fit (10), growth (10), geo (5), intent (10)
- Trigger: on contact create, on enrichment complete, manual re-score
- Store in `contacts.lead_score` field (already exists in schema)
- Inngest event: `lead.scored` → triggers next step

### Item 2: Auto-Qualification Agent (3-4 hrs)
**What:** AI agent that has BANT+ conversations to qualify leads.
**Where:** New agent config + conversation API.
**How:**
- System prompt with BANT+ framework (Budget, Authority, Need, Timeline, Competition)
- Conversational (not survey-like) — answers prospect questions too
- Channels: email reply, chat widget, WhatsApp (future)
- Output: QUALIFIED / NURTURE / DISQUALIFIED + structured data
- Inngest event: `lead.qualified` → triggers router

### Item 3: Smart Routing / Assignment (2-3 hrs)
**What:** Route qualified leads to Mode A (autonomous), B (hybrid/rep), or C (self-service).
**Where:** New API route `/api/leads/route` + routing logic.
**How:**
- Organization config: which mode(s) enabled
- Mode A: → Closer agent pipeline (auto)
- Mode B: → Best-fit rep selection (territory, expertise, capacity, win rate) → notify via email/WhatsApp → AI prepares briefing
- Mode C: → Direct payment link (high-intent leads)
- Inngest event: `lead.routed` → triggers downstream agent

### Item 4: QuotaHit MCP Server (2-3 hrs)
**What:** MCP server exposing CRM, agents, campaigns as tools/resources.
**Where:** `tools/quotahit_mcp.py` (FastMCP, stdio).
**How:**
- Resources: contacts, deals, agents, campaigns, analytics, qualification queue
- Tools: create_contact, enrich_lead, score_lead, qualify_lead, start_sequence, make_call, send_email, assign_to_rep, update_deal_stage
- Prompts: qualify_lead, handle_objection, write_outreach, summarize_deal
- Connects to Supabase via service role key
- Pattern: same as Agent Loadouts MCP server (we know how to build this)

### Item 5: Activate Follow-Up Execution (2-3 hrs)
**What:** Wire up existing follow-up schema to actually send emails/messages.
**Where:** Inngest function triggered by schedule + events.
**How:**
- Read `follow_up_sequences` and `follow_up_messages` tables (already exist)
- Inngest cron: check for due messages every 5 minutes
- Send via Resend (email), Twilio (SMS) — already integrated
- Update message status: pending → sent → delivered/failed
- Track opens/clicks (via Resend webhooks)

### Item 6: Agent Loadout Structure (1-2 hrs)
**What:** Create LOADOUT.md for each of the 7 agents with typed schemas.
**Where:** `agents/{scout,researcher,qualifier,outreach,closer,demo,ops}/LOADOUT.md`
**How:**
- Each loadout: inputs, outputs, credentials, composable-with, cost tables
- agent.config.json: model, temperature, tools, channels
- prompts/: system prompt files
- chains.json: composition chains (full-auto, hybrid, inbound, re-engage)

### Item 7: Universal VoiceInput Component (2-3 hrs)
**What:** Mic button on every text field. Level 1 (transcribe) + Level 2 (instruct AI).
**Where:** `src/components/ui/voice-input.tsx`
**How:**
- Web Speech API (free) as default STT
- Deepgram WebSocket as fallback
- Level 1: raw transcription into text field
- Level 2: parse instruction → call appropriate API (e.g., "send email to Sarah" → compose email with CRM context)
- Safety: confirm before destructive actions
- Props: mode, provider, crmContext, confirmBeforeAction

### Item 8: Inngest Integration (2-3 hrs)
**What:** Set up Inngest for durable agent workflows.
**Where:** `src/inngest/` directory + `src/app/api/inngest/route.ts`
**How:**
- Install inngest package
- Create Inngest client with event types
- Define functions: lead.scored → lead.qualified → lead.routed → follow-up chain
- Each function step: enrich, score, qualify, route, send
- Inngest dashboard for observability
- Replace any long-running API routes with Inngest functions

### Item 9: Consent + Compliance Service (2-3 hrs)
**What:** TCPA consent tracking, AI call disclosure, DNC enforcement, audit trail.
**Where:** New Supabase table `consent_records` + API route `/api/compliance/`
**How:**
- consent_records table: contact_id, consent_type, consent_given, consent_method, timestamp, seller_id
- DNC check: before every call, query DNC flag + federal DNC registry
- AI disclosure: auto-prepend to every AI call script: "This call uses AI technology..."
- Audit trail: log every agent action (who, what, when, outcome) to `audit_log` table
- Unsubscribe: honor within 10 days (CAN-SPAM), track in contact record

---

## Success Criteria

Phase 1 is DONE when:
- [ ] A lead enters CRM → auto-scored within seconds
- [ ] Scored lead → AI qualification conversation starts (if score > 40)
- [ ] Qualified lead → auto-routed to Mode A, B, or C
- [ ] MCP server running → can manage pipeline from Claude Code
- [ ] Follow-up messages → actually sending on schedule
- [ ] Every agent has a LOADOUT.md with typed schema
- [ ] Any text field → mic button → voice input works
- [ ] Agent workflows → survive Vercel timeout (Inngest working)
- [ ] AI calls → include disclosure + consent check + DNC enforcement
- [ ] Every action → logged in audit trail

---

## Order of Build

1. Inngest Integration (foundation — everything else depends on it)
2. Lead Scoring Engine (core logic)
3. Auto-Qualification Agent (uses scoring output)
4. Smart Routing / Assignment (uses qualification output)
5. Follow-Up Execution (uses routing output)
6. VoiceInput Component (UX improvement, parallel)
7. QuotaHit MCP Server (control layer, parallel)
8. Consent + Compliance Service (parallel)
9. Agent Loadout Structure (documentation, parallel)

Items 6-9 can be built in parallel once 1-5 are done.

---

*Phase 1 Loadout | QuotaHit Autonomous AI Sales Department*
*Created: 2026-02-25 | Status: READY TO BUILD*
