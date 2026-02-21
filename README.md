# QuotaHit — AI-Powered Sales Coaching Platform

> **Practice. Analyze. Close.** The all-in-one AI sales intelligence platform that replaces 5-7 separate SaaS tools — built by 1 person + AI in 1 week.

**Live:** [quotahit.com](https://www.quotahit.com)
**Built by:** [Dhruv Tomar](https://www.linkedin.com/in/aiwithdhruv/)

---

## What Is QuotaHit?

QuotaHit combines real-time AI voice practice, objection coaching, call analysis, CRM, AI calling, and performance analytics into a single platform — at a fraction of the cost of Gong, Salesloft, or Orum.

| Pain Point | Traditional Solution | QuotaHit |
|------------|---------------------|----------|
| No safe space to practice | Role-play with managers | Real-time voice with AI personas |
| Call reviews take hours | Gong ($108-250/user/mo) | AI analysis in seconds |
| CRM is a separate tool | Salesforce ($75-300/user/mo) | Built-in CRM with AI enrichment |
| Outbound calling is manual | Orum ($250/user/mo) | AI calling engine |
| No performance visibility | Spreadsheets | Real-time analytics dashboard |

**Total monthly cost to run:** ~$28-38/month (Vercel Free + Supabase Free + pay-as-you-go AI APIs)

---

## Features

### Core AI Features
- **AI Objection Coach** — Multi-model text coaching (GPT-4.1, Claude Opus 4.6, Grok 4.1 Fast, Kimi K2.5, Perplexity Sonar, 25+ models). Upload PDFs, images, or URLs for context-aware responses.
- **Real-Time Voice Practice** — Live voice conversations with AI buyer personas using OpenAI Realtime API. 4 built-in personas, 20+ scenarios, 8 training focuses.
- **Call Analyzer** — Upload sales call recordings (MP3/WAV/M4A). Auto-transcription via Whisper + AI scoring on Discovery, Rapport, Objection Handling, and Next Steps.
- **Text-Based Practice** — Chat-based alternative to voice practice with the same personas and scenarios.

### Sales Tools
- **Built-in CRM** — Contacts, pipeline stages, deal tracking, CSV import, AI enrichment, activity logging.
- **AI Calling Engine** — Outbound calling campaigns via Twilio + ElevenLabs TTS + Deepgram STT.
- **AI Agent Builder** — Create custom AI agents with their own personality, voice, knowledge base, and tools.
- **Performance Analytics** — Score trends, skills radar, activity heatmaps, session history, AI insights.
- **Team Management** — Multi-user teams with roles, leaderboards, shared CRM.

### Sales Agent (Sarah)
- **AI Sales Agent** — Floating chat widget on the pricing page powered by Grok 4.1 Fast. Auto-opens after 10 seconds, captures leads, answers product questions, and routes to Telegram + email via n8n.

### Feedback & Bug Reporting Widget
- **In-App Feedback System** — Floating widget on all pages with two tabs:
  - **Report Tab:** Category selection (Bug/Feature/Feedback/Improvement), 5-star rating, smart context-specific text fields, CleanShot-style region screenshot capture with annotation tools, drag-and-drop image upload.
  - **Vote Tab:** Upvote pre-defined feature suggestions. Votes tracked via localStorage + Google Sheet.
- **n8n Backend:** Submissions route through n8n webhook → Google Drive (screenshots) → Telegram + Gmail notifications → Google Sheet logging.

### SEO Blog Engine
- **Daily Automated Blog** — n8n workflow publishes one SEO-optimized blog post daily at 9AM IST. Claude Sonnet 4.6 writes content, Nano Banana generates hero images, stored in Supabase + Google Drive.
- **Blog Frontend** — Paginated blog listing with tag filtering, individual post pages with markdown rendering, full SEO metadata + JSON-LD structured data.

### Platform Features
- **BYOAPI Key Management** — Users bring their own API keys for 6 providers (OpenAI, Anthropic, OpenRouter, Perplexity, Tavily, ElevenLabs). AES-256-GCM encrypted.
- **Module-Based Pricing** — Free tier + 5 paid modules (Practice, Call Analyzer, AI Coach, Follow-up Autopilot, Company Brain). Stripe integration.
- **Admin System** — User impersonation, user management, admin dashboard.
- **Landing Page** — Responsive landing page with animated hero, feature grid, competitor comparison, pricing cards, JSON-LD schema.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, shadcn/ui |
| **Backend** | Next.js API Routes (serverless — no separate server) |
| **Database** | Supabase (PostgreSQL + Auth + Row Level Security) |
| **AI Models** | GPT-4.1, Claude Opus 4.6, Grok 4.1 Fast, Kimi K2.5, Gemini, Perplexity Sonar (25+ via OpenRouter) |
| **Voice** | OpenAI Realtime API (real-time voice-to-voice) |
| **TTS / STT** | ElevenLabs (TTS), Deepgram (STT), Whisper (transcription) |
| **Telephony** | Twilio (outbound AI calling) |
| **Payments** | Stripe (module-based subscriptions) |
| **Hosting** | Vercel (auto-deploy from GitHub) |
| **Automation** | n8n (self-hosted — feedback handling, blog publishing, sales agent leads) |
| **Screenshots** | html2canvas (region capture + annotation) |
| **State** | Zustand, React Query (TanStack) |
| **Charts** | Recharts |
| **Animations** | Framer Motion |

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account (free tier works)
- At least one AI provider API key

### 1. Clone and Install

```bash
git clone https://github.com/aiagentwithdhruv/ai-sales-coach.git
cd ai-sales-coach
npm install
```

### 2. Set Up Environment Variables

Copy the example env file and fill in your keys:

```bash
cp .env.example .env.local
```

**Required variables:**

```env
# Supabase (required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI Provider (at least one required)
OPENAI_API_KEY=sk-...
OPENROUTER_API_KEY=sk-or-...
ANTHROPIC_API_KEY=sk-ant-...

# Optional but recommended
PERPLEXITY_API_KEY=pplx-...
ELEVENLABS_API_KEY=sk_...
STRIPE_SECRET_KEY=sk_test_...
FEEDBACK_WEBHOOK_URL=https://your-n8n.cloud/webhook/feedback-widget
SALES_AGENT_WEBHOOK_URL=https://your-n8n.cloud/webhook/sales-agent-leads
```

See `.env.example` for the full list of available variables.

### 3. Set Up Supabase

Run the database migrations in order:

```bash
# Apply migrations from supabase/migrations/
supabase db push
```

This creates all tables (contacts, activities, teams, credits, etc.) with Row Level Security policies.

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 5. Deploy

```bash
# Push to GitHub — Vercel auto-deploys
git push origin main
```

Or deploy manually:

```bash
vercel --prod
```

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx                    # Landing page
│   ├── blog/                       # Blog pages (list + [slug])
│   ├── pricing/                    # Pricing page
│   ├── settings/                   # BYOAPI key management
│   ├── admin/                      # Admin dashboard
│   ├── dashboard/
│   │   ├── coach/                  # AI Objection Coach
│   │   ├── practice/               # Real-time voice practice
│   │   ├── text-practice/          # Text-based practice
│   │   ├── calls/                  # Call analyzer
│   │   ├── crm/                    # CRM & contacts
│   │   ├── ai-calling/             # AI calling campaigns
│   │   ├── analytics/              # Performance analytics
│   │   └── ...
│   └── api/
│       ├── ai/                     # AI endpoints (chat, voice, transcribe, analyze)
│       ├── agent/sales/            # Sales agent Sarah API
│       ├── blog/                   # Blog CRUD API
│       ├── feedback/               # Feedback + vote submission
│       ├── contacts/               # CRM API
│       ├── calling/                # AI calling API
│       ├── stripe/                 # Payment webhooks
│       ├── user-keys/              # BYOAPI key management
│       └── admin/                  # Admin APIs
├── components/
│   ├── feedback/                   # Feedback widget (5 components)
│   ├── agent/                      # Sales agent Sarah (3 components)
│   ├── features/                   # Feature components (practice, coach, etc.)
│   ├── layout/                     # Header, sidebar, navigation
│   └── ui/                         # shadcn/ui primitives
├── lib/
│   ├── ai/                         # AI provider routing, key resolution, tools
│   ├── calling/                    # Twilio integration, campaign executor
│   ├── crm/                        # Contact management
│   ├── screenshot.ts               # html2canvas capture + region crop
│   ├── suggestions.ts              # Pre-defined feature suggestions
│   ├── encryption.ts               # AES-256-GCM for API keys
│   ├── plans.ts                    # Module pricing definitions
│   └── supabase/                   # Database client + middleware
├── contexts/                       # Auth context provider
├── hooks/                          # Custom hooks (voice, credits, etc.)
└── types/                          # TypeScript type definitions

n8n-workflows/
└── feedback-widget.json            # n8n workflow for feedback handling

supabase/
└── migrations/                     # Database schema migrations (009+)

docs/
├── QUOTAHIT-FEATURES.md            # Complete feature documentation
└── ...
```

---

## n8n Automation Backend

QuotaHit uses self-hosted n8n for backend automation:

| Workflow | Purpose |
|----------|---------|
| **Feedback Widget Handler** | Receives feedback → uploads screenshots to Google Drive → sends Telegram + Gmail notifications → logs to Google Sheet |
| **Daily Blog Engine** | Publishes one SEO blog post daily at 9AM IST (Claude Sonnet + Nano Banana images) |
| **Sales Agent Leads** | Captures leads from AI sales agent Sarah → Telegram notification |

---

## Monthly Running Cost

| Service | Cost |
|---------|------|
| Vercel (hosting) | $0 (free tier) |
| Supabase (database + auth) | $0 (free tier) |
| OpenRouter AI (Kimi K2.5 default) | ~$3-8/mo |
| OpenAI (voice + transcription) | ~$5-10/mo |
| Claude Code (development) | $20/mo |
| Domain (quotahit.com) | $10/year |
| n8n (self-hosted) | $0 |
| **Total** | **~$28-38/mo** |

---

## Pricing

| Plan | Price | Includes |
|------|-------|----------|
| **Free** | $0/mo | 5 sessions/day, basic AI models, CRM |
| **Pro** | $19/mo | Unlimited sessions, all 25+ AI models, all tools |
| **Team** | $49/mo | 5 team members, leaderboards, team analytics |

---

## How It Was Built

**1 person + AI tools + 1 week.** See [HOW-WE-BUILT-IT.md](HOW-WE-BUILT-IT.md) for the full story.

| Phase | Tool |
|-------|------|
| Ideation & PRD | ChatGPT + Claude |
| UX Design | UX Pilot |
| Development | VS Code + Claude Code |
| Deployment | Vercel + GitHub |

---

## Links

- **Live App:** [quotahit.com](https://www.quotahit.com)
- **Blog:** [quotahit.com/blog](https://www.quotahit.com/blog)
- **Book a Demo:** [calendly.com/aiwithdhruv](https://calendly.com/aiwithdhruv/makeaiworkforyou)
- **LinkedIn:** [linkedin.com/in/aiwithdhruv](https://www.linkedin.com/in/aiwithdhruv/)
- **GitHub:** [github.com/aiagentwithdhruv](https://github.com/aiagentwithdhruv)

---

**Built by [Dhruv Tomar](https://www.linkedin.com/in/aiwithdhruv/) — QuotaHit: Where Sales Reps Become Closers**
