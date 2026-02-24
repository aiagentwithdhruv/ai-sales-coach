# Phase 2: The Outreach Engine
## LOADOUT.md | QuotaHit Build Phase 2

> Multi-channel outreach so AI reaches prospects everywhere. AI writes its own templates. No human creates anything.

**Depends on:** Phase 1 (scoring, qualification, routing, follow-up execution, Inngest)
**Estimated build:** ~3-4 hours (Claude Code speed, not the 12-17 hr human estimate)

---

## Schema

### Inputs
| Input | Type | Source |
|-------|------|--------|
| Phase 1 pipeline | Inngest events + scoring + routing | `src/inngest/` |
| Existing Resend email | Email sending infra | `src/lib/crm/follow-ups.ts` |
| Existing Twilio SMS | SMS infra | `src/inngest/functions/lead-pipeline.ts` |
| Gallabox WhatsApp keys | From Onsite project | Onsite `.env` |
| Enrichment data | Perplexity enrichment | `src/app/api/contacts/[id]/enrich/` |

### Outputs
| Output | Type | Destination |
|--------|------|------------|
| AI Template Generator | LLM-powered template creation | `src/lib/outreach/templates.ts` |
| Multi-Channel Sequencer | Orchestrate cross-channel sequences | `src/lib/outreach/sequencer.ts` |
| WhatsApp Integration | Send/receive via Gallabox API | `src/lib/channels/whatsapp.ts` |
| LinkedIn Outreach | Connection requests + DMs | `src/lib/channels/linkedin.ts` |
| Cold Email Engine | Instantly-style sending at scale | `src/lib/channels/cold-email.ts` |
| Inngest outreach functions | Durable multi-step sequences | `src/inngest/functions/outreach.ts` |

---

## Build Items (5)

### Item 7: AI Template Generator
**Time:** ~30 min | **Priority:** P0

AI writes email/LinkedIn/WhatsApp templates from enrichment data. No human ever writes a template.

**What it does:**
- Takes contact enrichment data (company, pain points, tech stack, conversation starters)
- Generates personalized messages per channel (email subject + body, LinkedIn DM, WhatsApp msg)
- Stores templates in `follow_up_messages` table with metadata
- Tracks performance (open rate, reply rate) for self-improvement (Phase 3)

**Implementation:**
```
src/lib/outreach/templates.ts
├── generateEmailTemplate(contact, enrichmentData, tone, purpose)
├── generateLinkedInDM(contact, enrichmentData, connectionNote)
├── generateWhatsAppMessage(contact, enrichmentData, tone)
├── generateColdEmailVariants(contact, enrichmentData, count=3) // A/B testing
└── personalizeTemplate(template, contact) // variable substitution
```

**AI Models:** Claude Haiku (fast, cheap) for template generation. ~$0.001 per template.

---

### Item 8: Multi-Channel Sequencer
**Time:** ~45 min | **Priority:** P0

Orchestrates sequences across email → LinkedIn → WhatsApp → call. Each step fires via Inngest with configurable delays.

**What it does:**
- Creates multi-channel sequences with configurable steps
- Each step: channel + delay + template + conditions
- Auto-selects channel based on contact data (has email? has phone? has LinkedIn?)
- Respects daily/hourly sending limits per channel
- Pauses sequence on positive reply (detected by Inngest webhook)

**Sequence schema:**
```json
{
  "name": "Standard B2B Outreach",
  "steps": [
    { "day": 0, "channel": "email", "template": "intro", "subject": "AI-generated" },
    { "day": 2, "channel": "linkedin", "template": "connection_request" },
    { "day": 5, "channel": "email", "template": "followup_1" },
    { "day": 7, "channel": "whatsapp", "template": "casual_checkin" },
    { "day": 10, "channel": "email", "template": "value_add" },
    { "day": 14, "channel": "call", "template": "discovery_call" },
    { "day": 21, "channel": "email", "template": "breakup" }
  ]
}
```

**Implementation:**
```
src/lib/outreach/sequencer.ts
├── createSequence(userId, contactId, sequenceTemplate)
├── enrollContact(userId, contactId, sequenceId)
├── executeStep(messageId) // called by Inngest
├── pauseSequence(sequenceId, reason) // on positive reply
├── getSequenceProgress(sequenceId)
└── PRESET_SEQUENCES: { standard_b2b, aggressive, nurture, re_engagement }

src/inngest/functions/outreach.ts
├── executeSequenceStep // fires each step on schedule
├── handleReply // pauses sequence, notifies, routes to qualifier/closer
└── sequenceCompleted // log outcome, update contact stage
```

**Inngest Events:**
- `outreach/step.due` → execute step
- `outreach/reply.received` → pause + route
- `outreach/sequence.completed` → log outcome

---

### Item 9: WhatsApp Integration
**Time:** ~30 min | **Priority:** P1

Send/receive WhatsApp messages via Gallabox BSP API. We already have the keys from Onsite.

**What it does:**
- Send template messages (pre-approved by WhatsApp)
- Send session messages (within 24hr window after user replies)
- Receive incoming messages via webhook
- Log all messages in activities timeline

**Implementation:**
```
src/lib/channels/whatsapp.ts
├── sendWhatsApp(to, body, templateName?)
├── sendTemplateMessage(to, templateId, variables)
├── handleIncomingWebhook(payload) // from Gallabox
└── GALLABOX_CONFIG: { apiKey, channelId, phoneNumber }

src/app/api/webhooks/gallabox/route.ts
├── POST: receive incoming WhatsApp messages
└── Logs to activities, triggers outreach/reply.received event
```

**Credentials:**
- `GALLABOX_API_KEY` — from Onsite project
- `GALLABOX_CHANNEL_ID` — 642ead91fe1098cbbd157509
- `GALLABOX_PHONE` — +918448009366

**Fallback:** If Meta Cloud API keys are set, use direct Meta API instead of Gallabox.

---

### Item 10: LinkedIn Outreach
**Time:** ~45 min | **Priority:** P1

Automated connection requests + personalized DMs via LinkedIn API (or Phantombuster/Waalaxy proxy).

**What it does:**
- Send connection requests with personalized notes (<300 chars)
- Send follow-up DMs after connection accepted
- Track connection status (pending, accepted, declined)
- Respect LinkedIn daily limits (20-30 connections/day)

**Implementation:**
```
src/lib/channels/linkedin.ts
├── sendConnectionRequest(linkedinUrl, note)
├── sendDirectMessage(linkedinUrl, message)
├── checkConnectionStatus(linkedinUrl)
├── getLinkedInProfile(linkedinUrl) // basic data scraping
└── LINKEDIN_LIMITS: { connections_per_day: 25, messages_per_day: 50 }
```

**Strategy:** Phase 2 starts with Phantombuster/Waalaxy API proxy (fastest to ship). Phase 5+ replaces with direct LinkedIn API (requires LinkedIn partnership).

**Note:** LinkedIn outreach is the highest-converting B2B channel but most rate-limited. AI must be strategic about who gets a connection request (only qualified + enriched contacts).

---

### Item 11: Cold Email Engine
**Time:** ~30 min | **Priority:** P0

Instantly-style cold email at scale with rotation, warmup awareness, and deliverability tracking.

**What it does:**
- Send cold emails from rotating sender accounts
- Respect per-domain daily limits (50/domain/day default)
- Auto-detect and avoid spam triggers
- Track opens, clicks, replies (via Resend webhooks)
- Unsubscribe link in every email (CAN-SPAM)

**Implementation:**
```
src/lib/channels/cold-email.ts
├── sendColdEmail(from, to, subject, body, trackingId)
├── rotateSender(userId) // round-robin across configured senders
├── checkDeliverability(email) // basic MX + disposable check
├── handleResendWebhook(event) // open, click, bounce, complaint
└── COLD_EMAIL_LIMITS: { per_domain_per_day: 50, warmup_daily_increase: 5 }

src/app/api/webhooks/resend/route.ts
├── POST: handle email events (open, click, bounce, unsubscribe)
└── Updates message status + triggers outreach/reply.received if reply detected
```

**Email Sending Strategy:**
1. Primary: Resend (already integrated, transactional + cold)
2. Future: Instantly API for dedicated cold email infra
3. Warmup: Start at 10/day/domain, increase by 5/day until limit

---

## Supabase Migrations Needed

```sql
-- 013_outreach_channels.sql

-- Track which channels are configured per user
CREATE TABLE IF NOT EXISTS outreach_channels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'linkedin', 'whatsapp', 'call', 'sms')),
  config JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  daily_limit INTEGER DEFAULT 50,
  sent_today INTEGER DEFAULT 0,
  last_reset_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Track individual message delivery events
CREATE TABLE IF NOT EXISTS message_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL,
  user_id UUID NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('sent', 'delivered', 'opened', 'clicked', 'replied', 'bounced', 'unsubscribed', 'complained')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE message_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_channels ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_message_events_message ON message_events(message_id);
CREATE INDEX idx_message_events_user ON message_events(user_id, created_at DESC);
CREATE INDEX idx_outreach_channels_user ON outreach_channels(user_id, channel);
```

---

## Success Criteria

Phase 2 is DONE when:
- [ ] AI generates personalized email/LinkedIn/WhatsApp templates from enrichment data
- [ ] Multi-channel sequences execute automatically (email → LinkedIn → WhatsApp → call)
- [ ] WhatsApp messages send and receive via Gallabox
- [ ] LinkedIn connection requests + DMs send via proxy
- [ ] Cold emails send with rotation, tracking, and unsubscribe
- [ ] Sequence pauses automatically when prospect replies positively
- [ ] All channel events logged in activities timeline
- [ ] Daily sending limits respected per channel

---

## What This Enables

After Phase 2, the pipeline is: **Lead enters → Auto-scored → Auto-qualified → AI writes templates → Multi-channel outreach fires → Replies detected → Routed to closer/rep**

The AI writes its own outreach. No human creates templates. No human sends emails. No human manages sequences.
