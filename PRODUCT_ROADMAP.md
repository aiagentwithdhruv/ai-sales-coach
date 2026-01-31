# AI Sales Coach — Product Roadmap (Summary for Design Doc)

Last updated: 2026-02-01

## 1) What is already built (live in UI)

### Practice (Live Call)
- Real-time voice role-play using OpenAI Realtime API.
- Persona + scenario selection.
- Company context upload: PDF/Image + Website URL.
- Training focus selector (Sales Call, Discovery, Demo, Objection, Negotiation, Closing, General).
- Script Coaching mode (optional): when a script is added, coach gives real-time guidance instead of role-playing as prospect.

Key files:
- `src/app/dashboard/practice/page.tsx`
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

### AI Coach (Text)
- Objection handling with attachments (PDF/Image/URL).
- Streaming response with credit deduction.

Key files:
- `src/app/dashboard/coach/page.tsx`
- `src/app/api/ai/coach/route.ts`

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

### AI Calling Agent (Outbound)
AI calls lead lists, qualifies, books meetings, and updates CRM.

Notes:
- High demand but requires compliance planning
- Country-by-country call rules and disclosure handling

### Multilingual Global Training
Localized coaching with cultural etiquette.
Enterprise-scale enablement for international teams.

---

## 5) Current limitations / guardrails

- Audio uploads only (mp3/wav/m4a). MP4 removed.
- No transcript storage yet (process and discard).
- Auto-send follow-ups not implemented yet (planned with safeguards).

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

---

## 8) Design system reminder

Gunmetal + charcoal base, soft off-white canvas, controlled neon blue accents.
Enterprise, premium, futuristic — not flashy.
