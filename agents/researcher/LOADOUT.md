---
name: researcher-agent
version: "1.0"
description: "AI Researcher — enriches and scores every lead"
tier: master
last_verified: 2026-02-25
refresh_cadence: weekly
---

# Researcher Agent

> Enriches raw leads with company intel, scores them, and prepares context for qualification.

## Role

The Researcher takes raw contacts from Scout (or manual entry) and enriches them with company data, pain points, tech stack, recent news, and conversation starters. It then runs lead scoring to prioritize the pipeline.

## Inputs

| Name | Type | Required | Description |
|------|------|----------|-------------|
| contact_id | string | Yes | Contact to research |
| user_id | string | Yes | Owner user ID |
| depth | string | No | "basic" (company only) or "deep" (full enrichment) |

## Outputs

| Name | Type | Description |
|------|------|-------------|
| enrichment_data | object | company_overview, industry, pain_points, tech_stack, etc. |
| lead_score | number | Updated 0-100 score |
| score_breakdown | object | Points by category |
| conversation_starters | string[] | Personalized openers |

## Credentials

| Key | Source | Required |
|-----|--------|----------|
| SUPABASE_URL | env | Yes |
| SUPABASE_SERVICE_ROLE_KEY | env | Yes |
| PERPLEXITY_API_KEY | env | Preferred |
| OPENROUTER_API_KEY | user_keys | Fallback |

## Composable With

| Agent | Relationship |
|-------|-------------|
| scout | Scout → Researcher (enrichment after discovery) |
| qualifier | Researcher → Qualifier (when score > 40) |
| outreach | Researcher → Outreach (for personalized messaging) |

## Cost

| Resource | Per Run | Notes |
|----------|---------|-------|
| AI tokens | ~1500 | Perplexity Sonar research |
| API calls | 1 | Single enrichment call |
| Supabase | 2 writes | Update contact + log activity |
| Time | 5-15s | API latency |

## Inngest Events

- **Listens:** `contact/created`, `contact/enriched`
- **Emits:** `lead/scored`

## Implementation

Already built in Phase 1:
- Enrichment: `src/app/api/contacts/[id]/enrich/route.ts`
- Scoring: `src/inngest/functions/lead-pipeline.ts` → `scoreLeadOnCreate`
- Re-scoring: `src/inngest/functions/lead-pipeline.ts` → `scoreLeadOnEnrich`
