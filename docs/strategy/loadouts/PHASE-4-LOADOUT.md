# Phase 4: The Closer
## LOADOUT.md | QuotaHit Build Phase 4

> AI that handles money — proposals, invoices, onboarding. Lead → Money → Onboarded client. Zero touches.

**Depends on:** Phase 3 (orchestrator, self-improving, autonomous calling)
**Estimated build:** ~2-3 hours (Claude Code speed, not the 8-12 hr human estimate)

---

## Schema

### Inputs
| Input | Type | Source |
|-------|------|--------|
| Phase 3 orchestrator | Routing decisions, chain execution | `src/inngest/functions/orchestrator.ts` |
| Existing Stripe | Checkout, portal, webhooks | `src/app/api/stripe/` |
| Existing CRM | Contact + deal data + enrichment | `src/lib/crm/` |
| Qualification data | BANT+ scores, notes | `contacts.custom_fields` |
| `create-proposal` skill | PandaDoc integration | `.context/claude-skills/` |

### Outputs
| Output | Type | Destination |
|--------|------|------------|
| Proposal Generator | Auto-create proposals from deal data | `src/lib/closing/proposals.ts` |
| Invoice + Payment Collection | Stripe invoices in sequences | `src/lib/closing/invoicing.ts` |
| Auto-Onboarding | Post-payment welcome flow | `src/lib/closing/onboarding.ts` |
| Meeting Booking | Calendar integration in sequences | `src/lib/closing/calendar.ts` |

---

## Build Items (4)

### Item 18: Proposal Generator
**Time:** ~30 min | **Priority:** P0

Auto-create proposals from qualification data. AI writes the proposal, includes pricing, and sends via email.

**What it does:**
- Pull contact data + enrichment + BANT scores + deal value
- AI generates personalized proposal (company overview, pain points addressed, solution, pricing, timeline)
- Output as styled HTML email or PDF
- Track proposal opens and engagement
- Auto-send follow-up if no response in 3 days

**Implementation:**
```
src/lib/closing/proposals.ts
├── generateProposal(contactId, userId, options?) → { html, pdf_url, subject }
├── sendProposal(contactId, userId, proposal) → messageId
├── trackProposalEngagement(proposalId, event)
├── getProposalTemplate(industry?) → base template
└── PROPOSAL_SECTIONS: [executive_summary, pain_points, solution, pricing,
                          timeline, testimonials, next_steps, terms]
```

**AI Model:** Claude Sonnet for proposal generation (needs quality writing). ~$0.01 per proposal.

**Pricing logic:**
- Pull deal_value from contact
- If no deal_value, estimate from company size + industry benchmarks
- Apply any negotiation discounts from closer agent config
- Include payment terms (net 30 default, configurable)

---

### Item 19: Invoice + Payment Collection
**Time:** ~30 min | **Priority:** P0

Stripe invoices generated automatically, payment links included in follow-up sequences.

**What it does:**
- Generate Stripe invoice from deal data (amount, items, terms)
- Send payment link via email/WhatsApp
- Track payment status (pending → paid → overdue)
- Auto-send payment reminders (day 3, 7, 14 for unpaid)
- On payment received: trigger onboarding

**Implementation:**
```
src/lib/closing/invoicing.ts
├── createInvoice(contactId, userId, { amount, items, terms }) → stripeInvoiceId
├── sendPaymentLink(contactId, userId, invoiceId, channel)
├── checkPaymentStatus(invoiceId) → status
├── sendPaymentReminder(invoiceId, reminderNumber)
└── handlePaymentReceived(invoiceId) → trigger onboarding

src/app/api/webhooks/stripe/route.ts (extend existing)
├── invoice.paid → emit deal/won + onboarding/start
├── invoice.overdue → emit payment/reminder.due
└── invoice.voided → update deal stage to lost
```

**Inngest Events:**
- `invoice/created` → send payment link
- `invoice/reminder.due` → send reminder (day 3, 7, 14)
- `invoice/paid` → trigger onboarding chain
- `deal/won` → auto-create invoice (if Mode A/C)

---

### Item 20: Auto-Onboarding
**Time:** ~30 min | **Priority:** P1

Post-payment welcome sequence + account setup. Client goes from "paid" to "active" without human help.

**What it does:**
- Send personalized welcome email with getting-started guide
- Create client workspace/account setup
- Schedule onboarding call (if enterprise/high-value)
- Send 7-day check-in follow-up
- Track onboarding completion

**Implementation:**
```
src/lib/closing/onboarding.ts
├── startOnboarding(contactId, userId, dealValue)
├── sendWelcomeEmail(contactId, userId) // personalized from enrichment
├── scheduleOnboardingCall(contactId, userId) // if deal > $5K
├── sendGettingStartedGuide(contactId, userId)
├── sendCheckinFollowup(contactId, userId) // day 7
└── markOnboardingComplete(contactId, userId)

src/inngest/functions/onboarding.ts
├── executeOnboardingSequence // durable multi-step
├── scheduleCheckin // 7-day delayed step
└── onboardingCompleted // log, update contact stage to "customer"
```

**Onboarding flow:**
1. Payment received → Welcome email (immediate)
2. Getting-started guide (1 hour later)
3. Onboarding call invite (next business day, if enterprise)
4. Check-in email (day 7)
5. Mark as onboarded → move to "customer" stage

---

### Item 21: Meeting Booking (Calendar)
**Time:** ~30 min | **Priority:** P1

Calendly-style booking integrated into outreach sequences. AI includes booking links in follow-ups.

**What it does:**
- Generate personalized booking links (Cal.com or Calendly integration)
- Include booking link in email/WhatsApp sequences at right moment
- Auto-detect when prospect is ready for a meeting (high engagement score)
- Pre-fill meeting context (contact data, qualification summary)
- Send meeting reminders and post-meeting follow-up

**Implementation:**
```
src/lib/closing/calendar.ts
├── generateBookingLink(userId, contactId, meetingType)
├── insertBookingInSequence(sequenceId, stepIndex, meetingType)
├── handleMeetingBooked(calendarEvent) → update CRM, prep briefing
├── sendMeetingReminder(meetingId) // 24hr + 1hr before
├── sendPostMeetingFollowup(meetingId, notes?)
└── MEETING_TYPES: { discovery_call: 30min, demo: 45min, closing_call: 30min, onboarding: 60min }
```

**Integration options:**
1. Calendly API (if user has account) — webhook on booking
2. Cal.com API (open-source, self-hostable)
3. Google Calendar API (direct integration)
4. Fallback: suggest times via email, manual booking

---

## Supabase Migrations Needed

```sql
-- 015_closing_ops.sql

-- Track proposals
CREATE TABLE IF NOT EXISTS proposals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL,
  deal_value NUMERIC(12,2),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired')),
  html_content TEXT,
  pdf_url TEXT,
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Track onboarding progress
CREATE TABLE IF NOT EXISTS onboarding_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL,
  status TEXT DEFAULT 'started' CHECK (status IN ('started', 'welcome_sent', 'guide_sent', 'call_scheduled', 'checkin_sent', 'completed')),
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  steps_completed JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}'
);

ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_progress ENABLE ROW LEVEL SECURITY;
```

---

## Success Criteria

Phase 4 is DONE when:
- [ ] AI generates personalized proposals from contact + deal data
- [ ] Stripe invoices auto-created with payment links
- [ ] Payment reminders auto-send on schedule (day 3, 7, 14)
- [ ] Payment received → onboarding starts automatically
- [ ] Welcome email + getting-started guide sent without human
- [ ] Meeting booking links included in outreach sequences
- [ ] Full pipeline works end-to-end: Lead → Qualified → Outreach → Proposal → Payment → Onboarded

---

## What This Enables

After Phase 4: **QuotaHit is a complete autonomous sales department.** The full pipeline works from lead discovery to payment collection to client onboarding. Zero human touches in Mode A. This is when we start eating our own cooking — load 500 target companies and let AI sell QuotaHit.
