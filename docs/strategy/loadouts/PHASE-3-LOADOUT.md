# Phase 3: The Brain
## LOADOUT.md | QuotaHit Build Phase 3

> Self-improving AI + composition chains that get smarter with every interaction. The system optimizes itself.

**Depends on:** Phase 2 (outreach engine, multi-channel, templates)
**Estimated build:** ~3-4 hours (Claude Code speed, not the 15-21 hr human estimate)

---

## Schema

### Inputs
| Input | Type | Source |
|-------|------|--------|
| Phase 2 outreach data | Templates, sequences, message events | `src/lib/outreach/` |
| Phase 1 pipeline | Scoring, qualification, routing | `src/inngest/functions/` |
| Existing calling infra | Twilio + ElevenLabs + Deepgram | `src/lib/calling/` |
| Message events | Opens, clicks, replies, bounces | `message_events` table |
| VoiceInput Level 1+2 | Web Speech API + voice-command API | `src/components/ui/voice-input.tsx` |

### Outputs
| Output | Type | Destination |
|--------|------|------------|
| Orchestrator Agent | Event-driven router between all 7 agents | `src/inngest/functions/orchestrator.ts` |
| Self-Improving Templates | A/B test + auto-optimize outreach | `src/lib/outreach/optimizer.ts` |
| Feedback Loop Pipeline | Outcomes → scoring + agent improvement | `src/inngest/functions/feedback.ts` |
| Autonomous Cold Calling | Fully autonomous outbound calls | `src/lib/calling/autonomous.ts` |
| Composition Engine | Dynamic agent chaining | `src/lib/agents/composer.ts` |
| Voice Commands Engine | Natural language → CRM actions | `src/lib/voice/commands.ts` |

---

## Build Items (6)

### Item 12: Orchestrator Agent
**Time:** ~30 min | **Priority:** P0

The Brain — unified event listener that routes between all 7 agents via composition chains. Replaces the individual Inngest triggers with a single intelligent router.

**What it does:**
- Listens to ALL pipeline events
- Looks up contact state + org settings
- Decides which agent should act next (using rule-based routing + chain definitions)
- Handles edge cases: stuck leads, escalation, re-engagement
- Logs every routing decision for analytics

**Implementation:**
```
src/inngest/functions/orchestrator.ts
├── onPipelineEvent // master listener for all events
├── routeToAgent(contactId, event) → { agent, action, reasoning }
├── handleStuckLeads // cron: find leads with no activity > 7 days
├── handleEscalation // high-value deals that need human attention
└── logRoutingDecision(contactId, fromAgent, toAgent, reasoning)
```

**Routing rules (from chains.json):**
- `contact/created` → Researcher
- `lead/scored` → score < 40: nurture queue | 40-70: Qualifier | 70+: fast-track Outreach
- `lead/qualified` → qualified: Router | nurture: Outreach (nurture) | disqualified: archive
- `lead/routed` → Mode A: Outreach→Closer | Mode B: Outreach+Rep | Mode C: Ops
- `call/completed` → Follow-up trigger
- `deal/won` → Ops (onboarding)
- `deal/lost` → Re-engagement queue (monthly)

---

### Item 13: Self-Improving Templates
**Time:** ~30 min | **Priority:** P0

AI tracks which templates perform best and auto-generates better variants. Kills underperformers. Promotes winners.

**What it does:**
- Track per-template metrics: sent, opened, clicked, replied, converted
- Calculate performance score per template variant
- Every 100 sends: compare variants, kill lowest performer, generate new variant
- Auto-adjust send timing based on open rate by hour/day
- No human ever touches email copy

**Implementation:**
```
src/lib/outreach/optimizer.ts
├── trackTemplatePerformance(templateId, event) // called on every message event
├── evaluateTemplates(userId) // compare all variants for a step
├── generateNewVariant(baseTemplate, performanceData) // AI creates better version
├── killUnderperformer(templateId) // mark as inactive
├── promoteWinner(templateId) // increase send weight
├── optimizeSendTiming(userId) // analyze opens by hour, recommend best times
└── getTemplateLeaderboard(userId) // dashboard data

// Inngest cron: runs weekly
src/inngest/functions/feedback.ts → optimizeTemplates
```

**Self-improvement cycle:**
```
Send templates (A/B/C variants)
  → Track opens, clicks, replies
  → After 100 sends per variant: compare
  → Kill worst performer
  → AI generates new variant from winner + fresh angle
  → Repeat forever
```

---

### Item 14: Feedback Loop Pipeline
**Time:** ~30 min | **Priority:** P0

Outcomes feed back into scoring weights, qualification questions, and agent prompts. The system calibrates itself.

**What it does:**
- Track which scored leads actually close (or don't)
- Recalibrate scoring weights monthly (if referral leads close 3x more → increase referral weight)
- Track which BANT questions best predict conversion
- Store outcome data for future ML training
- Generate monthly "what's working" report

**Implementation:**
```
src/inngest/functions/feedback.ts
├── onDealOutcome // listen to deal/won and deal/lost
├── recalibrateScoring // monthly: adjust scoring weights based on outcomes
├── trackQualificationAccuracy // did AI-qualified leads actually convert?
├── trackChannelEffectiveness // which outreach channel leads to closes?
├── generatePerformanceReport(userId) // monthly insights email
└── storeOutcomeData(contactId, outcome, timeline, signals)

// New table
outcomes_tracking:
  contact_id, scored_at, score_at_time, qualified_at, qualification_verdict,
  outreach_started_at, channels_used, replied_at, deal_stage_changes[],
  closed_at, outcome (won/lost), deal_value, time_to_close_days
```

---

### Item 15: Autonomous Cold Calling
**Time:** ~45 min | **Priority:** P1

Wire existing Twilio + ElevenLabs + Deepgram into fully autonomous outbound calling via Inngest.

**What it does:**
- AI initiates calls to qualified contacts
- Opens with AI disclosure ("This call uses AI technology...")
- Conducts discovery/qualification conversation
- Detects buying intent → routes to closer or books meeting
- Records + transcribes + summarizes every call
- Updates CRM with call outcome, next steps, BANT signals

**Implementation:**
```
src/lib/calling/autonomous.ts
├── initiateAutonomousCall(contactId, userId, purpose)
├── handleCallConversation(callSid) // real-time AI responses
├── processCallOutcome(callSid, transcript, summary)
└── AUTONOMOUS_RULES: { max_calls_per_hour: 5, min_score_to_call: 50, quiet_hours: [22,8] }

src/inngest/functions/calling.ts
├── executeAutonomousCall // durably initiates + processes
├── processCallTranscript // post-call analysis
└── triggerPostCallActions // update CRM, trigger follow-up, route
```

**Compliance (from Phase 1):**
- Pre-call: `preCallCheck()` → DNC + consent + time-of-day check
- Call start: AI disclosure first 3 seconds
- Recording: consent announcement
- Post-call: audit log entry

---

### Item 16: Loadout Composition Engine
**Time:** ~20 min | **Priority:** P1

Dynamic agent chaining — run pre-built or custom chains that pipe output from one agent to the next.

**What it does:**
- Execute a composition chain (e.g., `full-autonomous-pipeline`)
- Pass output from each agent as input to the next
- Handle branching (inbound pipeline: high/medium/low intent)
- Handle handoff points (Mode B: AI → human → AI)
- Track chain progress and timing

**Implementation:**
```
src/lib/agents/composer.ts
├── executeChain(chainName, initialData, userId)
├── executeStep(agentName, input) → output
├── handleBranch(conditions, data) → nextAgent
├── handleHandoff(repId, briefingData) → wait for human completion
├── getChainProgress(chainExecutionId)
└── CHAINS: loaded from agents/orchestrator/chains.json
```

---

### Item 17: Voice Commands Engine (Level 3)
**Time:** ~30 min | **Priority:** P2

Natural language voice → multi-step CRM actions. "I just got off a call with Mike from TechCorp" → AI extracts BANT, updates CRM, drafts follow-up, schedules next touchpoint. All automatically.

**What it does:**
- Parse complex voice instructions into multi-step action chains
- Use full CRM context (current contact, recent activities, pipeline state)
- Execute chained actions: update contact + log activity + draft email + schedule task
- Confirm destructive actions before executing

**Implementation:**
```
src/lib/voice/commands.ts
├── parseVoiceOrchestration(transcript, crmContext) → ActionChain[]
├── executeActionChain(actions, userId)
├── confirmDestructiveActions(actions) → filtered actions
└── ACTION_TYPES: { update_contact, log_activity, draft_email, create_task,
                     move_stage, schedule_followup, start_sequence, make_call }

src/app/api/ai/voice-orchestrate/route.ts
├── POST: receives transcript + context
├── Returns: proposed action chain + confirmation prompt
└── PATCH: confirm and execute chain
```

---

## Supabase Migrations Needed

```sql
-- 014_feedback_outcomes.sql

CREATE TABLE IF NOT EXISTS outcomes_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL,
  scored_at TIMESTAMPTZ,
  score_at_time INTEGER,
  qualified_at TIMESTAMPTZ,
  qualification_verdict TEXT,
  outreach_started_at TIMESTAMPTZ,
  channels_used TEXT[] DEFAULT '{}',
  first_reply_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  outcome TEXT CHECK (outcome IN ('won', 'lost', 'stalled', 'disqualified')),
  deal_value NUMERIC(12,2),
  time_to_close_days INTEGER,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Template performance tracking
CREATE TABLE IF NOT EXISTS template_performance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  template_id TEXT NOT NULL,
  variant TEXT DEFAULT 'A',
  channel TEXT NOT NULL,
  sent INTEGER DEFAULT 0,
  opened INTEGER DEFAULT 0,
  clicked INTEGER DEFAULT 0,
  replied INTEGER DEFAULT 0,
  converted INTEGER DEFAULT 0,
  performance_score NUMERIC(5,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE outcomes_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_performance ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_outcomes_user ON outcomes_tracking(user_id, closed_at DESC);
CREATE INDEX idx_template_perf ON template_performance(user_id, channel, is_active);
```

---

## Success Criteria

Phase 3 is DONE when:
- [ ] Orchestrator routes all events to correct agent via chains
- [ ] Templates self-optimize: worst variant auto-killed, new variant auto-generated
- [ ] Outcome tracking: closed deals feed back into scoring weight adjustment
- [ ] Autonomous calls execute end-to-end (initiate → converse → summarize → update CRM)
- [ ] Composition chains execute dynamically (full-auto, hybrid, inbound, re-engage)
- [ ] Voice commands execute multi-step CRM actions from natural language
- [ ] Monthly performance report auto-generates

---

## What This Enables

After Phase 3: **The system improves itself.** Templates get better every week. Scoring gets more accurate every month. The orchestrator routes intelligently. Voice controls everything. Cold calling is autonomous. This is where QuotaHit becomes truly autonomous — not just executing, but optimizing.
