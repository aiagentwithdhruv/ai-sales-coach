---
name: demo-agent
version: "1.0"
description: "AI Demo Agent — conducts product demonstrations"
tier: master
last_verified: 2026-02-25
refresh_cadence: monthly
---

# Demo Agent

> Conducts personalized product demos, handles Q&A, and generates post-demo follow-ups.

## Role

The Demo Agent handles the product demonstration phase. It prepares personalized demo flows based on the prospect's industry and pain points, conducts interactive demos, answers technical questions, and triggers post-demo follow-up sequences.

## Inputs

| Name | Type | Required | Description |
|------|------|----------|-------------|
| contact_id | string | Yes | Contact for demo |
| user_id | string | Yes | Owner user ID |
| demo_type | string | No | "live", "recorded", "interactive" |
| focus_areas | string[] | No | Features to highlight |
| industry | string | No | Prospect's industry for customization |

## Outputs

| Name | Type | Description |
|------|------|-------------|
| demo_completed | boolean | Whether demo was delivered |
| engagement_score | number | Prospect engagement (0-100) |
| questions_asked | string[] | Prospect's questions |
| follow_up_scheduled | boolean | Post-demo follow-up queued |
| recording_url | string | Demo recording link |

## Credentials

| Key | Source | Required |
|-----|--------|----------|
| SUPABASE_URL | env | Yes |
| SUPABASE_SERVICE_ROLE_KEY | env | Yes |
| ANTHROPIC_API_KEY | env | For Q&A handling |

## Composable With

| Agent | Relationship |
|-------|-------------|
| outreach | Outreach → Demo (meeting booked) |
| closer | Demo → Closer (post-demo closing) |
| ops | Demo → Ops (if prospect converts immediately) |

## Cost

| Resource | Per Demo | Notes |
|----------|---------|-------|
| AI tokens | ~2000 | Q&A + follow-up generation |
| Time | 15-30 min | Interactive demo session |

## Inngest Events

- **Listens:** `demo/scheduled`
- **Emits:** `demo/completed`

## Status

Phase 3 — Future build. Will integrate with:
- Calendar booking (Cal.com or Google Calendar)
- Screen recording (Loom API or custom)
- AI Q&A with product knowledge base
