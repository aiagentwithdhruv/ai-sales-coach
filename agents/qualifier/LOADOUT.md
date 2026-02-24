---
name: qualifier-agent
version: "1.0"
description: "AI Qualifier — BANT+ conversations to pre-qualify leads"
tier: master
last_verified: 2026-02-25
refresh_cadence: weekly
---

# Qualifier Agent

> Conducts BANT+ qualification conversations via email, chat, or WhatsApp to determine lead readiness.

## Role

The Qualifier engages leads that score above threshold (40+) in natural conversation to assess Budget, Authority, Need, Timeline, and Competition. It determines whether a lead is Qualified, Nurture, or Disqualified.

## Inputs

| Name | Type | Required | Description |
|------|------|----------|-------------|
| contact_id | string | Yes | Contact to qualify |
| user_id | string | Yes | Owner user ID |
| channel | string | No | Qualification channel (email, chat, whatsapp) |
| score_threshold | number | No | Min score to qualify (default: 40) |

## Outputs

| Name | Type | Description |
|------|------|-------------|
| outcome | string | "qualified", "nurture", or "disqualified" |
| bant_scores | object | { budget, authority, need, timeline, competition } (0-100 each) |
| notes | string | AI qualification summary |
| next_action | string | Recommended next step |
| deal_stage | string | Updated pipeline stage |

## Credentials

| Key | Source | Required |
|-----|--------|----------|
| SUPABASE_URL | env | Yes |
| SUPABASE_SERVICE_ROLE_KEY | env | Yes |
| ANTHROPIC_API_KEY | env | Preferred (Claude Haiku) |
| OPENAI_API_KEY | env | Fallback (GPT-4o-mini) |

## Composable With

| Agent | Relationship |
|-------|-------------|
| researcher | Researcher → Qualifier (after scoring) |
| outreach | Qualifier → Outreach (for qualified leads) |
| closer | Qualifier → Closer (for high-intent qualified) |
| ops | Qualifier → Ops (for self-service Mode C) |

## BANT+ Framework

| Dimension | Weight | Scoring Criteria |
|-----------|--------|-----------------|
| Budget | 25% | Has budget allocated, can afford solution |
| Authority | 20% | Decision maker or strong influencer |
| Need | 25% | Clear pain point, urgency present |
| Timeline | 15% | Active buying timeline (<3 months ideal) |
| Competition | 15% | Evaluating alternatives, not locked in |

**Qualification Rules:**
- **Qualified:** Average ≥ 60 AND at least 3 dimensions ≥ 50
- **Nurture:** Average 30-59 OR only 1-2 dimensions strong
- **Disqualified:** Average < 30 OR critical blocker (no budget + no authority)

## Cost

| Resource | Per Run | Notes |
|----------|---------|-------|
| AI tokens | ~800 | Claude Haiku or GPT-4o-mini |
| Supabase | 3 writes | Update contact + custom_fields + activity |
| Time | 2-5s | Single API call |

## Inngest Events

- **Listens:** `lead/scored` (when score ≥ 40)
- **Emits:** `lead/qualified`

## Implementation

Built in Phase 1:
- `src/inngest/functions/qualification.ts` → `qualifyLead`
- AI-powered with rule-based fallback
- Auto-advances deal_stage on qualification
