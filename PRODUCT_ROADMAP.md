# QuotaHit — Product Roadmap (Summary for Design Doc)

Last updated: 2026-02-12

## 1) What is already built (live in UI)

### Practice (Live Call)
- Real-time voice role-play using OpenAI Realtime API.
- Persona + scenario selection.
- Company context upload: PDF/Image + Website URL.
- Training focus selector (Sales Call, Discovery, Demo, Objection, Negotiation, Closing, General).
- Script Coaching mode (optional): when a script is added, coach gives real-time guidance instead of role-playing as prospect.
- Text-based practice mode (alternative to voice).

Key files:
- `src/app/dashboard/practice/page.tsx`
- `src/app/dashboard/text-practice/page.tsx`
- `src/components/features/practice/RealtimeVoiceChat.tsx`
- `src/hooks/useRealtimeVoice.ts`
- `src/app/api/ai/realtime-token/route.ts`
- `src/lib/ai/attachments.ts`

### Call Analyzer (MVP)
- Upload audio files (mp3, wav, m4a).
- Auto transcription + AI analysis report:
  - Overall score
  - Discovery / rapport / objection handling / next steps
  - Strengths, improvements, key moments, next steps
  - Talk ratio
- No storage yet (process and discard).
- Mock transcript data added for future training.

Key files:
- `src/app/dashboard/calls/page.tsx`
- `src/app/api/ai/analyze-call/route.ts`

### AI Coach (Text) — Multi-Model
- Objection handling with attachments (PDF/Image/URL).
- Streaming response.
- **Multi-model support**: Users choose from GPT-4.1, Claude Opus 4.6, Sonnet 4.5, Haiku 4.5, Grok 4.1 Fast, Gemini, Kimi K2.5, Perplexity Sonar models.
- Uses BYOAPI keys when available, falls back to platform keys.

Key files:
- `src/app/dashboard/coach/page.tsx`
- `src/app/api/ai/coach/route.ts`
- `src/lib/ai/key-resolver.ts`

### BYOAPI Key Management (NEW — Feb 2026)
- Users bring their own API keys for 6 providers.
- **AI Providers**: OpenAI, Anthropic, OpenRouter
- **Web Search**: Perplexity (preferred), Tavily
- **Voice & Audio**: ElevenLabs
- Keys encrypted with AES-256-GCM, validated on save.
- Grouped settings UI by category.
- Platform keys used as fallback when user keys are missing.

Key files:
- `src/app/settings/page.tsx`
- `src/app/api/user-keys/route.ts`
- `src/lib/user-keys.ts`
- `src/lib/encryption.ts`
- `src/lib/ai/key-resolver.ts`

### Admin System (NEW — Feb 2026)
- Email-based admin detection (ADMIN_EMAILS array).
- Admin badge in profile dropdown.
- Admin Dashboard link in header.
- User impersonation (view app as another user).
- User search and management.

Key files:
- `src/app/admin/page.tsx`
- `src/app/api/admin/impersonate/route.ts`
- `src/components/layout/Header.tsx`
- `src/app/dashboard/layout.tsx`

### Module-Based Pricing (NEW — Feb 2026)
- Free tier with basic access.
- 5 paid modules: Practice, Call Analyzer, AI Coach, Follow-up Autopilot, Company Brain.
- Bundle discount for all modules.
- Stripe integration for payments.
- Replaced old credit-based system.

Key files:
- `src/app/pricing/page.tsx`
- `src/lib/plans.ts`
- `src/app/api/stripe/checkout/route.ts`
- `supabase/migrations/009_platform_restructuring.sql`

### CRM & Contact Management
- Contact CRUD with import (CSV) and AI enrichment.
- Activity logging and pipeline stages.
- Deal forecasting and analytics dashboard.
- Notifications system.

Key files:
- `src/app/dashboard/crm/page.tsx`
- `src/app/api/contacts/route.ts`
- `src/lib/crm/contacts.ts`

### AI Calling (Outbound)
- Campaign-based outbound calling via Twilio.
- ElevenLabs TTS + Deepgram STT.
- Call pipeline with qualification flow.
- Campaign execution engine with progress tracking.
- Phone number management.

Key files:
- `src/app/dashboard/ai-calling/page.tsx`
- `src/app/api/calling/campaigns/route.ts`
- `src/lib/calling/pipeline.ts`
- `src/lib/calling/campaign-executor.ts`

### Additional Features Built
- Team management and invitations
- AI agent configuration
- Follow-up automation
- Quotation/proposal generation
- Presentation generation
- Objection library
- Leaderboard
- Third-party integrations (Zoho CRM, etc.)
- Session history and progress tracking
- Landing page with OG images for social sharing

---

## 2) What we are building next (priority)

### A) Follow-up Autopilot (High ROI)
Goal: auto-generate and auto-send follow-ups using call context + company materials.

Features:
- Context-aware follow-up drafts
- Auto-send (with safeguards) + scheduling
- Multi-channel: email, LinkedIn, SMS/WhatsApp, CRM tasks (v1 pick 1–2 providers)

Why it sells:
- Saves hours per rep
- Improves conversion and consistency

### B) Sales Readiness Platform (Training at scale)
Goal: reduce ramp time and standardize rep performance.

Features:
- Company Brain training (docs + product updates)
- Live coaching (already built)
- Standardized scoring and improvement plans

Why it sells:
- Time-to-productivity directly impacts revenue

---

## 3) Medium-term modules (premium upsell)

### Company Brain Training
Upload docs, pricing changes, new messaging and auto-generate:
- training drills
- updated talk tracks
- summary updates for reps

### Role-Play Marketplace
Prebuilt industry personas:
- SaaS, finance, healthcare, enterprise procurement, security, etc.

### Deal Momentum + Risk Engine
Detect stalled deals, missing stakeholders, weak next steps.
Push coaching prompts and risk alerts.

### Talk-Track Compliance
Enforce approved messaging; flag risky claims.
Best for regulated industries.

### Quotation / Proposal Generator
Auto-create proposals using approved templates + call notes.
One-click send to customer.

---

## 4) Long-term / enterprise modules

### AI Calling Agent (Inbound)
AI answers incoming calls 24/7, pre-qualifies, routes, books meetings.
(Outbound already built — see Section 1.)

Notes:
- High demand but requires compliance planning
- Country-by-country call rules and disclosure handling

### Multilingual Global Training
Localized coaching with cultural etiquette.
Enterprise-scale enablement for international teams.

### CRM Deep Integrations
Salesforce, HubSpot, Pipedrive native OAuth integrations.
Bidirectional sync (contacts, deals, activities).

---

## 5) Current limitations / guardrails

- Audio uploads only (mp3/wav/m4a). MP4 removed.
- No transcript storage yet (process and discard).
- Auto-send follow-ups not implemented yet (planned with safeguards).
- Admin role via hardcoded email list (not database-backed yet).
- English only (multilingual planned).

---

## 6) Target market focus

Initial: mid-market companies (paying customers but manageable complexity).
Expansion: enterprise and regulated industries with compliance needs.

---

## 7) Why customers will pay

- Faster ramp time
- Standardized training and messaging
- More consistent follow-ups
- Clearer next steps and higher win rates
- Bring your own API keys — no AI cost markup
- Module pricing — pay only for what you use

---

## 8) Design system reminder

Gunmetal + charcoal base, soft off-white canvas, controlled neon blue accents.
Enterprise, premium, futuristic — not flashy.
