---
name: scout-agent
version: "1.0"
description: "AI Scout — finds leads matching ICP 24/7"
tier: master
last_verified: 2026-02-25
refresh_cadence: weekly
---

# Scout Agent

> Autonomous lead discovery — finds prospects matching your ICP across LinkedIn, Apollo, web, and imports.

## Role

The Scout is the top-of-funnel engine. It runs 24/7 scanning data sources for leads matching the Ideal Customer Profile, then feeds them into the pipeline for enrichment and scoring.

## Inputs

| Name | Type | Required | Description |
|------|------|----------|-------------|
| icp_criteria | object | Yes | Industry, company size, geography, titles, tech stack |
| sources | string[] | No | Data sources to scan (linkedin, apollo, web, import) |
| max_leads_per_run | number | No | Limit per batch (default: 50) |
| exclude_domains | string[] | No | Companies to skip |
| user_id | string | Yes | Owner user ID |

## Outputs

| Name | Type | Description |
|------|------|-------------|
| leads | Contact[] | New contacts created in CRM |
| count | number | Number of leads found |
| sources_scanned | string[] | Which sources were checked |
| quality_score | number | Avg ICP match score (0-100) |

## Credentials

| Key | Source | Required |
|-----|--------|----------|
| SUPABASE_URL | env | Yes |
| SUPABASE_SERVICE_ROLE_KEY | env | Yes |
| APOLLO_API_KEY | user_keys | No |
| LINKEDIN_COOKIE | user_keys | No |
| APIFY_API_KEY | user_keys | No |

## Composable With

| Agent | Relationship |
|-------|-------------|
| researcher | Scout → Researcher (enrich found leads) |
| qualifier | Scout → Researcher → Qualifier (full pipeline) |
| orchestrator | Orchestrator triggers Scout on schedule/demand |

## Cost

| Resource | Per Run | Notes |
|----------|---------|-------|
| AI tokens | ~500 tokens | ICP matching only |
| API calls | 1-50 | Depends on source |
| Supabase | 50 inserts | One per lead |
| Time | 30-120s | Depends on batch size |

## Inngest Events

- **Emits:** `contact/created` (for each new lead)
- **Listens:** None (triggered by cron or orchestrator)

## Status

Phase 2 — Scout agent logic will be built on top of existing `scrape-leads` and `gmaps-leads` skills from the skills library.
