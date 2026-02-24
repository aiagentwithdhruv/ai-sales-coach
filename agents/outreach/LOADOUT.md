---
name: outreach-agent
version: "1.0"
description: "AI Outreach — multi-channel sequences (email, LinkedIn, WhatsApp, call)"
tier: master
last_verified: 2026-02-25
refresh_cadence: weekly
---

# Outreach Agent

> Executes personalized multi-channel outreach sequences for qualified leads.

## Role

The Outreach Agent creates and executes personalized outreach sequences across email, LinkedIn, WhatsApp, and cold calls. It uses enrichment data and qualification context to craft relevant messages that convert.

## Inputs

| Name | Type | Required | Description |
|------|------|----------|-------------|
| contact_id | string | Yes | Contact to reach out to |
| user_id | string | Yes | Owner user ID |
| channels | string[] | No | Channels to use (email, linkedin, whatsapp, call) |
| sequence_id | string | No | Existing sequence to enroll in |
| tone | string | No | "formal", "casual", "direct" (default: casual) |
| urgency | string | No | "high", "medium", "low" |

## Outputs

| Name | Type | Description |
|------|------|-------------|
| sequence_started | boolean | Whether sequence was activated |
| messages_queued | number | Messages scheduled |
| channels_used | string[] | Active channels |
| first_message | object | First message draft for review |

## Credentials

| Key | Source | Required |
|-----|--------|----------|
| SUPABASE_URL | env | Yes |
| SUPABASE_SERVICE_ROLE_KEY | env | Yes |
| RESEND_API_KEY | env | For email |
| TWILIO_ACCOUNT_SID | env | For SMS/call |
| TWILIO_AUTH_TOKEN | env | For SMS/call |
| ANTHROPIC_API_KEY | env | For message generation |

## Composable With

| Agent | Relationship |
|-------|-------------|
| qualifier | Qualifier → Outreach (qualified leads) |
| closer | Outreach → Closer (when buying intent detected) |
| researcher | Researcher → Outreach (enrichment for personalization) |

## Sequence Templates

| Template | Steps | Channels | Duration |
|----------|-------|----------|----------|
| Standard B2B | 7 | Email (5), LinkedIn (2) | 21 days |
| Aggressive | 10 | Email (4), Call (3), LinkedIn (2), WhatsApp (1) | 14 days |
| Nurture | 5 | Email (3), LinkedIn (2) | 45 days |
| Re-engagement | 3 | Email (2), WhatsApp (1) | 7 days |

## Cost

| Resource | Per Sequence | Notes |
|----------|-------------|-------|
| AI tokens | ~2000 | Message personalization |
| Email sends | 3-5 | Via Resend |
| SMS | 0-2 | Via Twilio |
| Time | Spread over days | Automated scheduling |

## Inngest Events

- **Listens:** `lead/routed` (Mode A and B), `followup/trigger`
- **Emits:** `followup/send` (per message)

## Implementation

Partially built in Phase 1:
- Follow-up execution: `src/inngest/functions/lead-pipeline.ts`
- Sequence schema: `src/lib/crm/follow-ups.ts`
- Cron processor: `processDueFollowUps` (every 5 min)
- Message sending: `sendFollowUpMessage` (email via Resend, SMS via Twilio)

Phase 2 will add: multi-channel orchestration, AI message generation, A/B testing.
