# Product Requirements Document: QuotaHit — AI Sales Coach (Current Build)

**Version:** 2.0
**Last Updated:** 2026-02-12
**Status:** Live / Production

---

## 1. Executive Summary

QuotaHit (formerly AI Sales Coach) is a real-time AI-powered sales training and enablement platform that helps sales representatives improve their skills through live voice practice, call analysis, contextual coaching, CRM, AI calling, and follow-up automation. The platform supports multiple AI providers via a BYOAPI (Bring Your Own API Key) architecture, uses OpenAI's Realtime API for natural voice conversations, and includes a module-based pricing model.

### Vision Statement
> Enable every sales rep to practice, improve, and close more deals through AI-powered real-time coaching — without needing a manager or peer available.

---

## 2. Product Overview

### 2.1 Core Value Proposition
- **Practice Anytime**: Live AI role-play available 24/7
- **Context-Aware Training**: Upload company materials for realistic practice
- **Instant Feedback**: Real-time coaching and post-call analysis
- **Bring Your Own Keys**: Users manage their own API keys — no markup on AI costs
- **Module-Based Pricing**: Pay only for the modules you need
- **Multi-Provider AI**: Choose from OpenAI, Anthropic, Google, xAI, Perplexity, and more

### 2.2 Target Users
| User Type | Description | Primary Use Case |
|-----------|-------------|------------------|
| Sales Reps (SDR/AE) | Frontline sellers | Practice calls, get feedback |
| Sales Managers | Team leads | Monitor rep readiness |
| Sales Enablement | Training owners | Standardize training content |
| Admins | Platform administrators | User management, impersonation, configuration |

### 2.3 Tech Stack
- **Frontend**: Next.js 16, React, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes (serverless on Vercel)
- **AI Providers (BYOAPI)**: OpenAI, Anthropic (Claude Opus 4.6, Sonnet 4.5, Haiku 4.5), OpenRouter, Perplexity (Sonar, Sonar Pro, Sonar Reasoning Pro)
- **Web Search**: Perplexity (preferred), Tavily
- **Voice & Audio**: OpenAI Realtime API (voice), ElevenLabs (TTS), Whisper (transcription), Deepgram
- **Telephony**: Twilio (outbound/inbound calling)
- **Auth & Database**: Supabase (PostgreSQL + Auth + Row Level Security)
- **Payments**: Stripe (module-based subscriptions)
- **Styling**: Custom dark theme (gunmetal + neon blue accents)
- **Hosting**: Vercel (auto-deploy from GitHub main branch)

### 2.4 AI Models Available
| Model | Provider | Type | Notes |
|-------|----------|------|-------|
| GPT-4.1 | OpenAI | Text | Default for analysis |
| GPT-4.1 Mini | OpenAI | Text | Budget option |
| GPT-4o | OpenAI | Text + Voice | Realtime voice practice |
| Claude Opus 4.6 | Anthropic | Text | Premium reasoning |
| Claude Sonnet 4.5 | Anthropic | Text | Balanced |
| Claude Haiku 4.5 | Anthropic | Text | Fast + cheap |
| Grok 4.1 Fast | xAI (via OpenRouter) | Text | Fast inference |
| Gemini 2.5 Pro | Google (via OpenRouter) | Text | Long context |
| Kimi K2.5 | Moonshot (via OpenRouter) | Text | Budget |
| Sonar | Perplexity | Search + Text | Web search with citations |
| Sonar Pro | Perplexity | Search + Text | Advanced search |
| Sonar Reasoning Pro | Perplexity | Search + Text | Deep reasoning + search |

---

## 3. Feature Specifications

### 3.1 Live Call Practice (Voice Role-Play)

**Objective**: Allow reps to practice sales conversations with AI-powered prospects in real-time voice.

#### User Stories
- As a sales rep, I want to practice cold calls with realistic AI prospects so I can improve my pitch.
- As a sales rep, I want to upload my company's product docs so the AI responds with accurate context.
- As a sales rep, I want to select different buyer personas so I can practice with various customer types.
- As a sales rep, I want real-time coaching during the call so I can improve while practicing.

#### Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| LC-01 | Real-time voice conversation with AI | P0 | ✅ Done |
| LC-02 | Persona selection (5+ buyer types) | P0 | ✅ Done |
| LC-03 | Scenario selection (discovery, demo, negotiation, etc.) | P0 | ✅ Done |
| LC-04 | Training focus selector (7 options) | P0 | ✅ Done |
| LC-05 | Context upload: PDF/Image files | P0 | ✅ Done |
| LC-06 | Context upload: Website URL | P0 | ✅ Done |
| LC-07 | Script coaching mode (real-time guidance) | P1 | ✅ Done |
| LC-08 | Microphone mute/unmute | P0 | ✅ Done |
| LC-09 | Session end and reset | P0 | ✅ Done |
| LC-10 | Transcript display (live) | P1 | ✅ Done |

#### Technical Implementation
```
Files:
├── src/app/dashboard/practice/page.tsx       # Practice setup UI
├── src/components/features/practice/
│   ├── RealtimeVoiceChat.tsx                 # Voice chat component
│   └── PersonaSelector.tsx                   # Persona picker
├── src/hooks/useRealtimeVoice.ts             # WebSocket + audio handling
├── src/app/api/ai/realtime-token/route.ts    # Token generation API
└── src/lib/ai/attachments.ts                 # Attachment processing
```

#### API Flow
1. User selects persona, scenario, training focus
2. (Optional) User uploads context materials
3. User clicks "Start Call"
4. Frontend requests ephemeral token from `/api/ai/realtime-token`
5. Token includes full session config (voice, instructions, context)
6. WebSocket connects to OpenAI Realtime API
7. Audio streams bidirectionally in PCM16 format
8. Turn detection (server VAD) manages conversation flow

#### Personas Available
| Persona | Title | Difficulty | Industry |
|---------|-------|------------|----------|
| Sarah Mitchell | VP of Sales | Medium | SaaS |
| Michael Chen | IT Director | Hard | Technology |
| Jennifer Rodriguez | Operations Manager | Easy | Healthcare |
| David Thompson | CFO | Hard | Finance |
| Amanda Foster | Marketing Director | Medium | Retail |

#### Training Focus Options
- Sales Call (General)
- Discovery Questions
- Product Demo
- Objection Handling
- Negotiation
- Closing Techniques
- General Training

---

### 3.2 Call Analyzer

**Objective**: Enable reps to upload recorded sales calls and receive AI-powered analysis and improvement suggestions.

#### User Stories
- As a sales rep, I want to upload a call recording and get a score so I know how I performed.
- As a sales rep, I want specific feedback on objection handling so I can improve weak areas.
- As a sales manager, I want to see talk ratio data so I can coach reps on listening skills.

#### Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| CA-01 | Audio file upload (mp3, wav, m4a) | P0 | ✅ Done |
| CA-02 | Auto-transcription (Whisper) | P0 | ✅ Done |
| CA-03 | AI analysis with overall score | P0 | ✅ Done |
| CA-04 | Breakdown scores (discovery, rapport, objection, next steps) | P0 | ✅ Done |
| CA-05 | Strengths and improvements list | P0 | ✅ Done |
| CA-06 | Key moments (positive + improvement) | P0 | ✅ Done |
| CA-07 | Talk ratio calculation | P1 | ✅ Done |
| CA-08 | Next steps suggestions | P1 | ✅ Done |
| CA-09 | Mock transcript data (training) | P2 | ✅ Done |
| CA-10 | MP4/video rejection (explicit block) | P1 | ✅ Done |

#### Technical Implementation
```
Files:
├── src/app/dashboard/calls/page.tsx          # Call analyzer UI
└── src/app/api/ai/analyze-call/route.ts      # Analysis API
```

#### Analysis Output Schema
```json
{
  "summary": "Brief call summary",
  "scores": {
    "overall": "0-100",
    "discovery": "0-100",
    "rapport": "0-100",
    "objectionHandling": "0-100",
    "nextSteps": "0-100"
  },
  "talkRatio": { "rep": "0-100", "prospect": "0-100" },
  "strengths": ["..."],
  "improvements": ["..."],
  "keyMoments": [
    { "type": "positive|improvement", "text": "..." }
  ],
  "nextSteps": ["..."]
}
```

#### Mock Training Data
6 pre-built call transcripts covering:
- Initial discovery call
- Product demo follow-up
- Enterprise security objections
- Pricing negotiation
- Objection handling
- Closing call

---

### 3.3 AI Coach (Text-Based)

**Objective**: Provide on-demand text-based coaching for objection handling and sales questions with multi-model support.

#### User Stories
- As a sales rep, I want to ask how to handle a specific objection so I get an immediate response.
- As a sales rep, I want to attach company materials so the coach gives relevant advice.
- As a sales rep, I want to choose which AI model powers my coaching (GPT-4.1, Claude Opus, Grok, etc.).

#### Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| AC-01 | Text chat with AI coach | P0 | ✅ Done |
| AC-02 | Streaming responses | P1 | ✅ Done |
| AC-03 | Attachment support (PDF/Image/URL) | P1 | ✅ Done |
| AC-04 | Multi-model selection (user picks model) | P0 | ✅ Done |
| AC-05 | BYOAPI key resolution (user's own keys) | P0 | ✅ Done |

#### Technical Implementation
```
Files:
├── src/app/dashboard/coach/page.tsx          # Coach UI with model selector
├── src/app/api/ai/coach/route.ts             # Coach API (multi-provider)
└── src/lib/ai/key-resolver.ts                # Resolves user vs platform keys
```

---

### 3.4 BYOAPI Key Management

**Objective**: Allow users to bring their own API keys for AI providers, web search, and voice services — eliminating markup costs and giving full control.

#### Provider Categories

**AI Providers:**
| Provider | Key Prefix | Models Available |
|----------|-----------|-----------------|
| OpenAI | `sk-...` | GPT-4.1, GPT-4o, Whisper |
| Anthropic | `sk-ant-...` | Claude Opus 4.6, Sonnet 4.5, Haiku 4.5 |
| OpenRouter | `sk-or-...` | Grok 4.1 Fast, Gemini, Kimi K2.5, 200+ models |

**Web Search:**
| Provider | Key Prefix | Use Case |
|----------|-----------|----------|
| Perplexity | `pplx-...` | AI-powered web search with citations (preferred) |
| Tavily | `tvly-...` | Web research and contact enrichment |

**Voice & Audio:**
| Provider | Key Prefix | Use Case |
|----------|-----------|----------|
| ElevenLabs | N/A | Premium text-to-speech for AI calling |

#### Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| BK-01 | Store API keys per user (encrypted) | P0 | ✅ Done |
| BK-02 | AES-256-GCM encryption at rest | P0 | ✅ Done |
| BK-03 | Key validation on save (lightweight test call) | P0 | ✅ Done |
| BK-04 | Fallback to platform keys if user key missing | P1 | ✅ Done |
| BK-05 | Grouped settings UI (AI / Search / Voice) | P1 | ✅ Done |
| BK-06 | Key masking in UI (show last 4 chars only) | P0 | ✅ Done |

#### Technical Implementation
```
Files:
├── src/app/settings/page.tsx                 # Settings UI with grouped BYOAPI sections
├── src/app/api/user-keys/route.ts            # CRUD for encrypted keys
├── src/lib/user-keys.ts                      # Validation + provider info
├── src/lib/encryption.ts                     # AES-256-GCM encrypt/decrypt
└── src/lib/ai/key-resolver.ts                # Resolves user key vs platform key
```

#### Key Resolution Flow
1. User makes AI request (coach, analysis, voice, etc.)
2. `key-resolver.ts` checks for user's own key for that provider
3. If found → decrypt and use user's key (no cost to platform)
4. If not found → fall back to platform's key (platform pays)
5. Infrastructure keys (Twilio, Deepgram, Resend) always use platform keys

---

### 3.5 Admin System

**Objective**: Provide platform administrators with user management, impersonation, and configuration capabilities.

#### Admin Detection
Admin role is detected client-side by matching the signed-in email against a hardcoded `ADMIN_EMAILS` array. This array is kept in sync across:
- `src/app/dashboard/layout.tsx`
- `src/components/layout/Header.tsx`
- `src/app/admin/page.tsx`

#### Admin Emails
```
aiwithdhruv@gmail.com
dhruv@aiwithdruv.com
admin@aiwithdruv.com
dhruvtomar7008@gmail.com
```

#### Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| AD-01 | Admin badge in profile dropdown | P0 | ✅ Done |
| AD-02 | Admin Dashboard link in header | P0 | ✅ Done |
| AD-03 | User impersonation (view as user) | P1 | ✅ Done |
| AD-04 | User management (list, search) | P1 | ✅ Done |

#### Technical Implementation
```
Files:
├── src/app/admin/page.tsx                    # Admin dashboard
├── src/app/api/admin/impersonate/route.ts    # Impersonation API
├── src/app/dashboard/layout.tsx              # Admin role detection
├── src/components/layout/Header.tsx          # Admin badge + dashboard link
└── src/components/ui/impersonation-banner.tsx # Banner when impersonating
```

---

### 3.6 Module-Based Pricing

**Objective**: Flexible pricing where users pick only the modules they need, with a free tier for basic access.

#### Pricing Model
- **Free Tier**: Basic access with limited features (no credit card required)
- **Modules**: Individual paid modules that unlock specific feature sets
- **Bundle**: All modules at a discounted rate

#### Modules
| Module | Description |
|--------|-------------|
| Practice | Live voice role-play with AI prospects |
| Call Analyzer | Upload and analyze sales call recordings |
| AI Coach | Text-based AI coaching with multi-model support |
| Follow-up Autopilot | AI-generated follow-up emails and scheduling |
| Company Brain | Knowledge base training and quiz generation |

#### Technical Implementation
```
Files:
├── src/app/pricing/page.tsx                  # Module-based pricing page
├── src/lib/plans.ts                          # Plan definitions
├── src/app/api/stripe/checkout/route.ts      # Stripe checkout session
├── src/app/api/stripe/portal/route.ts        # Billing portal
└── src/app/api/stripe/webhook/route.ts       # Stripe webhook handler
```

---

### 3.7 CRM & Contact Management

**Objective**: Built-in lightweight CRM for managing contacts, deals, and pipeline.

#### Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| CR-01 | Contact CRUD (create, read, update, delete) | P0 | ✅ Done |
| CR-02 | Contact import (CSV) | P1 | ✅ Done |
| CR-03 | Contact enrichment (AI-powered) | P1 | ✅ Done |
| CR-04 | Activity logging | P0 | ✅ Done |
| CR-05 | Pipeline stages | P1 | ✅ Done |
| CR-06 | Deal forecasting | P2 | ✅ Done |
| CR-07 | Notifications | P1 | ✅ Done |
| CR-08 | Analytics dashboard | P1 | ✅ Done |

#### Technical Implementation
```
Files:
├── src/app/dashboard/crm/page.tsx            # CRM UI
├── src/app/dashboard/crm/analytics/page.tsx   # CRM analytics
├── src/app/api/contacts/route.ts             # Contacts CRUD
├── src/app/api/contacts/[id]/route.ts        # Single contact operations
├── src/app/api/contacts/[id]/enrich/route.ts # AI enrichment
├── src/app/api/contacts/analytics/route.ts   # Pipeline analytics
├── src/lib/crm/contacts.ts                   # Contact business logic
├── src/lib/crm/activities.ts                 # Activity tracking
├── src/lib/crm/analytics.ts                  # Analytics calculations
└── src/lib/crm/follow-ups.ts                 # Follow-up automation
```

---

### 3.8 AI Calling (Outbound)

**Objective**: AI-powered outbound calling for lead qualification, meeting booking, and CRM updates.

#### Technical Implementation
```
Files:
├── src/app/dashboard/ai-calling/page.tsx     # Calling UI
├── src/app/api/calling/route.ts              # Call management
├── src/app/api/calling/campaigns/route.ts    # Campaign CRUD
├── src/app/api/calls/outbound/route.ts       # Outbound call initiation
├── src/app/api/webhooks/twilio/              # Twilio webhooks (voice, gather, recording, status)
├── src/lib/calling/twilio.ts                 # Twilio integration
├── src/lib/calling/tts.ts                    # Text-to-speech (ElevenLabs)
├── src/lib/calling/deepgram.ts               # Speech-to-text
├── src/lib/calling/pipeline.ts               # Call flow pipeline
└── src/lib/calling/campaign-executor.ts      # Campaign execution engine
```

---

## 4. Non-Functional Requirements

### 4.1 Performance
| Metric | Target | Current |
|--------|--------|---------|
| Voice latency | < 500ms | ~300ms |
| Token generation | < 2s | ~1s |
| Call analysis | < 30s | ~15-20s |
| Page load (dashboard) | < 2s | ~1.5s |

### 4.2 Security & Privacy
- No call recordings stored by default (process and discard)
- Ephemeral tokens (60s expiry) for voice sessions
- Supabase auth with Row Level Security
- API keys encrypted with AES-256-GCM (server-side `ENCRYPTION_KEY`)
- Admin role detection via hardcoded email list (client-side)
- User impersonation with audit trail

### 4.3 Scalability
- Serverless API routes on Vercel (auto-scaling)
- WebSocket per-session (no persistent connections)
- Stateless architecture
- Supabase PostgreSQL with connection pooling

---

## 5. Design System

### 5.1 Color Palette
| Name | Hex | Usage |
|------|-----|-------|
| Obsidian | #050505 | Page background |
| Onyx | #0D0D0D | Section background |
| Graphite | #1A1A1A | Cards |
| Gunmetal | #2A2A2A | Borders |
| Charcoal | #333333 | Secondary |
| Mist | #6B7280 | Muted text |
| Silver | #9CA3AF | Body text |
| Platinum | #E5E7EB | Headings |
| Neon Blue | #3B82F6 | Primary accent |
| Electric Blue | #2563EB | Hover state |
| Automation Green | #10B981 | Success/CTA |
| Warning Amber | #F59E0B | Warnings, admin |
| Alert Red | #EF4444 | Errors |

### 5.2 Typography
- Font: System UI / Inter
- Headings: Platinum (#E5E7EB)
- Body: Silver (#9CA3AF)
- Muted: Mist (#6B7280)

### 5.3 Components
- Cards with `bg-graphite border-gunmetal`
- Buttons: Primary (neon blue), CTA (automation green), Destructive (alert red)
- Badges for status indicators (role, plan, status)
- Consistent 6px border radius
- Cursor glow orb effect (180px) on landing/pricing pages

---

## 6. Success Metrics

| Metric | Definition | Target |
|--------|------------|--------|
| Practice Sessions/User | Avg sessions per user per week | 5+ |
| Session Duration | Avg time per practice call | 5-10 min |
| Calls Analyzed/User | Uploads per user per month | 10+ |
| Feature Adoption | % users using context upload | 60%+ |
| BYOAPI Key Setup | % users adding their own keys | 40%+ |
| Module Conversion | Free → paid conversion rate | 10%+ |

---

## 7. Known Limitations

| Limitation | Impact | Planned Fix |
|------------|--------|-------------|
| No MP4/video support | Users must convert video | Extract audio in future |
| English only | Limited global use | Multilingual in v2 |
| Admin via hardcoded emails | Not scalable | Database-backed role system |
| No transcript storage (default) | Can't review past calls | Optional storage with consent |

---

## 8. File Structure Reference

```
ai-sales-coach/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── ai/
│   │   │   │   ├── realtime-token/route.ts    # Ephemeral voice token
│   │   │   │   ├── analyze-call/route.ts      # Call analysis
│   │   │   │   ├── chat/route.ts              # General AI chat
│   │   │   │   ├── coach/route.ts             # AI coaching
│   │   │   │   ├── research/route.ts          # AI research
│   │   │   │   ├── speak/route.ts             # TTS
│   │   │   │   ├── summarize/route.ts         # Summarization
│   │   │   │   ├── transcribe/route.ts        # Whisper STT
│   │   │   │   ├── text-practice/route.ts     # Text-based practice
│   │   │   │   └── tools/route.ts             # AI tool calls
│   │   │   ├── admin/impersonate/route.ts     # User impersonation
│   │   │   ├── user-keys/route.ts             # BYOAPI key CRUD
│   │   │   ├── contacts/                      # CRM endpoints (CRUD, enrich, analytics, pipeline)
│   │   │   ├── calling/                       # AI calling (campaigns, execute, progress)
│   │   │   ├── calls/outbound/route.ts        # Outbound call initiation
│   │   │   ├── follow-ups/                    # Follow-up automation
│   │   │   ├── phone-numbers/                 # Phone number management
│   │   │   ├── agents/                        # AI agent management
│   │   │   ├── teams/                         # Team management
│   │   │   ├── quotations/                    # Quote generation + send
│   │   │   ├── presentations/generate/        # Presentation generation
│   │   │   ├── integrations/route.ts          # Third-party integrations
│   │   │   ├── stripe/                        # Payments (checkout, portal, webhook)
│   │   │   ├── webhooks/twilio/               # Twilio webhooks (voice, gather, recording, status)
│   │   │   ├── usage/route.ts                 # Usage tracking
│   │   │   └── auth/confirm/route.ts          # Auth confirmation
│   │   ├── dashboard/
│   │   │   ├── layout.tsx                     # Dashboard layout + auth guard
│   │   │   ├── page.tsx                       # Dashboard home
│   │   │   ├── practice/page.tsx              # Voice practice
│   │   │   ├── text-practice/page.tsx         # Text practice
│   │   │   ├── calls/page.tsx                 # Call analyzer
│   │   │   ├── coach/page.tsx                 # AI coach
│   │   │   ├── crm/page.tsx                   # CRM
│   │   │   ├── ai-calling/page.tsx            # AI calling
│   │   │   ├── follow-ups/page.tsx            # Follow-ups
│   │   │   ├── analytics/page.tsx             # Analytics
│   │   │   ├── company-brain/page.tsx         # Knowledge base
│   │   │   ├── deal-risk/page.tsx             # Deal risk engine
│   │   │   ├── marketplace/page.tsx           # Persona marketplace
│   │   │   ├── agents/page.tsx                # AI agents
│   │   │   ├── integrations/page.tsx          # Integrations
│   │   │   ├── quotations/page.tsx            # Quotations
│   │   │   ├── objections/page.tsx            # Objection library
│   │   │   ├── leaderboard/page.tsx           # Team leaderboard
│   │   │   ├── compliance/page.tsx            # Compliance
│   │   │   └── ...                            # + more pages
│   │   ├── settings/page.tsx                  # User settings + BYOAPI keys
│   │   ├── admin/page.tsx                     # Admin dashboard
│   │   ├── pricing/page.tsx                   # Module-based pricing
│   │   ├── login/page.tsx                     # Login
│   │   ├── signup/page.tsx                    # Signup
│   │   └── globals.css                        # Global styles + cursor glow
│   ├── components/
│   │   ├── features/practice/
│   │   │   ├── RealtimeVoiceChat.tsx          # Voice chat component
│   │   │   ├── PersonaSelector.tsx            # Persona picker
│   │   │   └── ChatInterface.tsx              # Chat UI
│   │   ├── layout/
│   │   │   ├── DashboardLayout.tsx            # Layout wrapper
│   │   │   ├── Header.tsx                     # Top header + admin detection
│   │   │   └── Sidebar.tsx                    # Collapsible sidebar
│   │   └── ui/                                # shadcn components
│   ├── hooks/
│   │   ├── useRealtimeVoice.ts                # WebSocket + audio
│   │   ├── useAudioPractice.ts                # Audio practice
│   │   └── useCredits.ts                      # Credit management
│   └── lib/
│       ├── ai/
│       │   ├── key-resolver.ts                # User key vs platform key resolution
│       │   ├── providers.ts                   # AI provider config
│       │   ├── attachments.ts                 # File processing
│       │   └── prompts/                       # System prompts (coaching, practice, tools)
│       ├── crm/                               # CRM business logic (contacts, activities, analytics, etc.)
│       ├── calling/                           # Calling pipeline (twilio, tts, deepgram, campaign)
│       ├── supabase/                          # DB client (client.ts, server.ts)
│       ├── user-keys.ts                       # BYOAPI key CRUD + validation
│       ├── encryption.ts                      # AES-256-GCM encrypt/decrypt
│       ├── pricing.ts                         # Model pricing
│       ├── plans.ts                           # Subscription plans
│       ├── stripe.ts                          # Stripe client
│       ├── usage.ts                           # Usage tracking
│       └── utils.ts                           # Utilities
├── supabase/migrations/
│   ├── 001_user_credits.sql                   # Credits + subscriptions
│   ├── 002_crm_contacts.sql                   # CRM contacts
│   ├── 003_crm_activities.sql                 # Activity logging
│   ├── 004_notifications_and_analytics.sql    # Notifications
│   ├── 005_tier3_teams_calling_integrations.sql # Teams + calling
│   ├── 006_ai_agents_phone_numbers.sql        # AI agents + phone numbers
│   ├── 007_external_id.sql                    # External ID mapping
│   ├── 008_follow_up_automation.sql           # Follow-up automation
│   └── 009_platform_restructuring.sql         # BYOAPI + module pricing
├── docs/
│   ├── PRD_CURRENT.md                         # This file
│   ├── PRD_ROADMAP.md                         # Roadmap features
│   └── design/                                # Design system + feature design docs
├── PRODUCT_ROADMAP.md                         # Summary roadmap
└── HOW-WE-BUILT-IT.md                        # Build case study
```

---

## 9. Appendix

### 9.1 API Endpoints Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/ai/realtime-token` | POST | Generate ephemeral token for voice |
| `/api/ai/analyze-call` | POST | Upload and analyze call recording |
| `/api/ai/chat` | POST | General AI chat session |
| `/api/ai/coach` | POST | Text-based coaching (multi-model) |
| `/api/ai/research` | POST | AI-powered research |
| `/api/ai/speak` | POST | Text-to-speech (ElevenLabs) |
| `/api/ai/transcribe` | POST | Audio transcription (Whisper) |
| `/api/ai/text-practice` | POST | Text-based practice session |
| `/api/user-keys` | GET/POST/DELETE | BYOAPI key management |
| `/api/admin/impersonate` | POST | User impersonation (admin only) |
| `/api/contacts` | GET/POST | Contact CRUD |
| `/api/contacts/[id]/enrich` | POST | AI contact enrichment |
| `/api/contacts/analytics` | GET | Pipeline analytics |
| `/api/calling/campaigns` | GET/POST | Campaign management |
| `/api/calls/outbound` | POST | Initiate outbound call |
| `/api/follow-ups` | GET/POST | Follow-up management |
| `/api/stripe/checkout` | POST | Create checkout session |
| `/api/stripe/webhook` | POST | Handle Stripe events |
| `/api/usage` | GET | Usage statistics |

### 9.2 Environment Variables Required
```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI Providers (platform fallback keys)
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
OPENROUTER_API_KEY=
PERPLEXITY_API_KEY=
TAVILY_API_KEY=
ELEVENLABS_API_KEY=

# Encryption
ENCRYPTION_KEY=                    # 32-byte hex for AES-256-GCM

# Telephony
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# Speech
DEEPGRAM_API_KEY=

# Payments
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Email
RESEND_API_KEY=
```

---

**Product Name:** QuotaHit
**Domain:** [quotahit.com](https://www.quotahit.com)
**Document Owner:** Engineering Team
**Review Cycle:** Monthly
**Next Review:** 2026-03-01
