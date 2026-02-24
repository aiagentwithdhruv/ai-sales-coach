---
name: closer-agent
version: "1.0"
description: "AI Closer — handles objections, negotiates, closes deals"
tier: master
last_verified: 2026-02-25
refresh_cadence: weekly
---

# Closer Agent

> Handles late-stage deal management — objection handling, negotiation, proposal creation, and closing.

## Role

The Closer takes over when buying intent is detected. It handles objections, negotiates terms, generates proposals, and pushes deals to close. In Mode B (hybrid), it prepares briefings for human reps instead of closing autonomously.

## Inputs

| Name | Type | Required | Description |
|------|------|----------|-------------|
| contact_id | string | Yes | Contact to close |
| user_id | string | Yes | Owner user ID |
| mode | string | No | "autonomous" (Mode A) or "assist" (Mode B) |
| objection | string | No | Current objection to handle |
| deal_value | number | No | Proposed deal value |
| pricing_authority | object | No | Min/max discount, payment terms |

## Outputs

| Name | Type | Description |
|------|------|-------------|
| outcome | string | "won", "lost", "negotiating", "proposal_sent" |
| deal_stage | string | Updated pipeline stage |
| proposal_url | string | Generated proposal link |
| objection_response | string | AI-crafted response |
| rep_briefing | object | Briefing for human rep (Mode B) |

## Credentials

| Key | Source | Required |
|-----|--------|----------|
| SUPABASE_URL | env | Yes |
| SUPABASE_SERVICE_ROLE_KEY | env | Yes |
| ANTHROPIC_API_KEY | env | For negotiation AI |
| STRIPE_SECRET_KEY | env | For invoicing |
| PANDADOC_API_KEY | user_keys | For proposals |

## Composable With

| Agent | Relationship |
|-------|-------------|
| outreach | Outreach → Closer (buying intent detected) |
| qualifier | Qualifier → Closer (high-intent qualified leads) |
| ops | Closer → Ops (after deal won) |
| demo | Demo → Closer (post-demo follow-up) |

## Negotiation Rules

| Rule | Value |
|------|-------|
| Max discount (auto) | 15% |
| Payment terms (auto) | Net 30 |
| Escalation trigger | Discount > 15% or custom terms |
| Min deal for autonomous | $500 |
| Rep notification | Always for deals > $10K |

## Cost

| Resource | Per Deal | Notes |
|----------|---------|-------|
| AI tokens | ~3000 | Negotiation + proposal |
| Proposal gen | 1 | PandaDoc or internal |
| Time | 1-5 min | Multi-turn negotiation |

## Inngest Events

- **Listens:** `lead/routed` (Mode A high-intent), `lead/qualified` (hot leads)
- **Emits:** `deal/won`, `deal/lost`

## Status

Phase 2 — Closer agent logic will be built with:
- Objection handling prompts (from coaching library)
- Proposal generation (from `create-proposal` skill)
- Stripe invoicing integration (existing)
- Rep briefing system for Mode B
