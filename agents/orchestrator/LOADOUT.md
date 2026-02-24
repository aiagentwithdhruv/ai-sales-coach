---
name: orchestrator-agent
version: "1.0"
description: "The Brain — routes leads between agents, decides next actions"
tier: master
last_verified: 2026-02-25
refresh_cadence: weekly
---

# Orchestrator Agent (The Brain)

> Central intelligence that routes leads between agents, decides next actions, and learns from outcomes.

## Role

The Orchestrator is the decision-making layer above all 7 agents. It listens to every pipeline event, decides which agent should act next, handles escalations, and optimizes the pipeline based on outcome data.

## Inputs

| Name | Type | Required | Description |
|------|------|----------|-------------|
| event | object | Yes | Any Inngest pipeline event |
| user_id | string | Yes | Owner user ID |
| org_settings | object | No | Routing preferences, rep assignments |

## Outputs

| Name | Type | Description |
|------|------|-------------|
| next_agent | string | Which agent should act next |
| action | string | Specific action for that agent |
| mode | string | A (autonomous), B (hybrid), C (self-service) |
| reasoning | string | Why this routing decision |

## Routing Logic

```
Event received
  ├── contact/created → Researcher (enrich + score)
  ├── lead/scored
  │   ├── score < 40 → Nurture queue (no action)
  │   ├── score 40-70 → Qualifier (BANT+ conversation)
  │   └── score > 70 → Fast-track to Outreach
  ├── lead/qualified
  │   ├── qualified → Router (Mode A/B/C)
  │   ├── nurture → Outreach (nurture sequence)
  │   └── disqualified → Archive
  ├── lead/routed
  │   ├── Mode A → Outreach → Closer (autonomous)
  │   ├── Mode B → Outreach + Rep notification
  │   └── Mode C → Ops (self-service payment)
  ├── call/completed → Follow-up trigger
  ├── deal/won → Ops (onboarding)
  └── deal/lost → Re-engagement queue
```

## Composition Chains

| Chain | Agents | Mode | Description |
|-------|--------|------|-------------|
| full-autonomous | Scout → Researcher → Qualifier → Outreach → Closer → Ops | A | End-to-end autonomous |
| hybrid | Scout → Researcher → Qualifier → Outreach | B | AI qualifies, human closes |
| inbound | Researcher → Qualifier → branch by intent | C | Score and route inbound leads |
| re-engagement | Researcher → Outreach | — | Re-score cold leads monthly |

## Credentials

| Key | Source | Required |
|-----|--------|----------|
| SUPABASE_URL | env | Yes |
| SUPABASE_SERVICE_ROLE_KEY | env | Yes |
| INNGEST_EVENT_KEY | env | Yes |

## Cost

| Resource | Per Decision | Notes |
|----------|-------------|-------|
| AI tokens | 0 | Rule-based routing (no LLM) |
| Supabase | 1-2 reads | Check contact state + org settings |
| Time | <100ms | Fast routing |

## Inngest Events

- **Listens:** All events (contact/*, lead/*, call/*, deal/*, followup/*)
- **Emits:** Triggers for downstream agents

## Implementation

Built in Phase 1:
- Scoring + routing: `src/inngest/functions/lead-pipeline.ts`
- Qualification: `src/inngest/functions/qualification.ts`
- Smart routing: `src/inngest/functions/routing.ts`
- Follow-up execution: `src/inngest/functions/lead-pipeline.ts`

The orchestrator is currently implemented as a set of Inngest functions that chain together. Phase 2 will add a unified orchestrator with learning/optimization.
