---
name: ops-agent
version: "1.0"
description: "AI Ops — invoicing, payment collection, client onboarding"
tier: master
last_verified: 2026-02-25
refresh_cadence: weekly
---

# Ops Agent

> Post-sale operations — invoicing, payment collection, and client onboarding automation.

## Role

The Ops Agent handles everything after a deal is won: generating invoices via Stripe, collecting payment, sending welcome sequences, and kicking off the onboarding flow.

## Inputs

| Name | Type | Required | Description |
|------|------|----------|-------------|
| contact_id | string | Yes | New client contact |
| user_id | string | Yes | Owner user ID |
| deal_value | number | Yes | Invoice amount |
| payment_terms | string | No | "immediate", "net15", "net30" |
| onboarding_template | string | No | Template to use for onboarding |

## Outputs

| Name | Type | Description |
|------|------|-------------|
| invoice_id | string | Stripe invoice ID |
| invoice_url | string | Payment link |
| payment_status | string | "pending", "paid", "overdue" |
| onboarding_started | boolean | Whether onboarding sequence kicked off |
| welcome_sent | boolean | Welcome email sent |

## Credentials

| Key | Source | Required |
|-----|--------|----------|
| SUPABASE_URL | env | Yes |
| SUPABASE_SERVICE_ROLE_KEY | env | Yes |
| STRIPE_SECRET_KEY | env | For invoicing |
| RESEND_API_KEY | env | For welcome emails |

## Composable With

| Agent | Relationship |
|-------|-------------|
| closer | Closer → Ops (deal won) |
| qualifier | Qualifier → Ops (self-service Mode C) |

## Onboarding Flow

1. Generate Stripe invoice → send payment link
2. On payment received → send welcome email
3. Schedule onboarding call (if enterprise)
4. Create project space / access credentials
5. Send getting-started guide
6. 7-day check-in follow-up

## Cost

| Resource | Per Client | Notes |
|----------|-----------|-------|
| AI tokens | ~500 | Welcome message personalization |
| Stripe | Per transaction | Standard Stripe fees |
| Emails | 3-5 | Welcome sequence |
| Time | Automated | No manual intervention |

## Inngest Events

- **Listens:** `deal/won`, `lead/routed` (Mode C self-service)
- **Emits:** `onboarding/started`, `payment/received`

## Implementation

Partially built:
- Stripe checkout: `src/app/api/stripe/checkout/route.ts`
- Welcome email: Adaptable from `welcome-email` skill
- Onboarding: Adaptable from `onboarding-kickoff` skill

Phase 2 will add: automated invoice generation, payment tracking, onboarding sequences.
