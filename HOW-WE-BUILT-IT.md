# How QuotaHit Was Built — Full Stack AI SaaS in 1 Week

> **1 person + AI tools + ~$28-38/month = production SaaS that competes with $100-250/user tools**

---

## The Team

**Solo founder + AI tools.** No traditional dev team, no designer, no backend engineer.

---

## Tools Used (by Phase)

| Phase | Tool | What It Did |
|-------|------|-------------|
| **Story & Ideation** | ChatGPT + Claude | Brainstormed product concept, market research, competitor analysis |
| **PRD & System Design** | Claude | Product Requirements Doc, architecture decisions, API design, database schema |
| **UX Design** | UX Pilot | Generated wireframes and UI mockups from text prompts |
| **Development** | VS Code + Claude Code | Wrote all frontend + backend code, debugging, CSS, animations |
| **Deployment** | Vercel (Free) + GitHub | Auto-deploy on every `git push` to main branch |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16 (App Router), Tailwind CSS, shadcn/ui |
| **Backend** | Next.js API Routes (serverless — no separate server needed) |
| **Auth + Database** | Supabase (PostgreSQL + Auth + Row Level Security) |
| **AI Models** | GPT-4.1, Claude Opus 4.6, Grok 4.1 Fast, Kimi K2.5, Gemini (via OpenRouter) |
| **Web Search** | Perplexity Sonar (preferred), Tavily |
| **Real-time Voice** | OpenAI Realtime API (GPT-4o voice-to-voice) |
| **TTS / STT** | ElevenLabs (TTS), Deepgram (STT), Whisper (transcription) |
| **Telephony** | Twilio (outbound AI calling) |
| **Payments** | Stripe (module-based subscriptions) |
| **Hosting** | Vercel (auto-deploy from GitHub) |
| **Domain** | quotahit.com |
| **Automation** | n8n (self-hosted — feedback handling, blog publishing, lead capture) |
| **Screenshots** | html2canvas (CleanShot-style region capture + annotation) |

---

## Monthly Running Cost

| Service | Plan | Cost |
|---------|------|------|
| **Claude Code** (AI development) | Pro ($20) / Max ($100) | $20/mo (Pro enough for 1 project) |
| **Vercel** (hosting + serverless) | Free | $0/mo |
| **Supabase** (auth + database) | Free | $0/mo |
| **OpenRouter** (AI chat — Kimi K2.5) | Pay-as-you-go | ~$3-8/mo |
| **OpenAI** (voice + transcription) | Pay-as-you-go | ~$5-10/mo |
| **Domain** (quotahit.com) | Annual | $10/year |
| **n8n** (self-hosted) | Free | $0/mo |
| | **Total** | **~$28-38/mo + $10/yr domain** |

> **Note on Claude Code:** Pro ($20/mo) is enough for a single project. Max ($100/mo) or Pro+ only needed if you're running multiple projects simultaneously. The $20 Pro plan handles this entire build.

> **Note on scaling:** If you need to scale beyond free tier limits, Vercel Pro is $20/mo and Supabase Pro is $25/mo. But for early stage with <1000 users, free tiers work fine.

### AI API Cost Breakdown (per 100 users, ~500 sessions/month)
- **Kimi K2.5** (text chat via OpenRouter): ~$0.50-2/mo — extremely cheap
- **Whisper** (audio transcription): ~$1-3/mo
- **GPT-4o Realtime** (voice practice): ~$5-15/mo — most expensive part
- **Total AI cost for 100 users: ~$7-20/month**

---

## What's Inside the App

### 3 Core Features (Production-Ready)

| Feature | What It Does | AI Model Used |
|---------|-------------|---------------|
| **AI Coach** | Type any sales question, get instant AI coaching (multi-model) | GPT-4.1, Claude Opus 4.6, Grok 4.1 Fast, Perplexity Sonar |
| **Voice Practice** | Live voice call with AI prospect — speaks and listens in real-time | GPT-4o Realtime API |
| **Call Analysis** | Upload a sales call recording, get AI scorecard with feedback | GPT-4.1 + Whisper |

### Additional Features Built
- Multi-provider AI with BYOAPI (users bring their own API keys for OpenAI, Anthropic, OpenRouter, Perplexity, Tavily, ElevenLabs)
- Module-based pricing (Practice, Call Analyzer, AI Coach, Follow-up Autopilot, Company Brain)
- Built-in CRM with contact management, pipeline stages, and AI enrichment
- AI outbound calling with Twilio + ElevenLabs TTS + Deepgram STT
- Follow-up automation and quotation generation
- Admin system with user impersonation
- Team management and leaderboards
- Session history and progress tracking
- Persona selection (different AI buyer personalities)
- Script coaching mode (AI coaches you through your script live)
- Landing page with OG images for social sharing
- Stripe-integrated pricing page with module selection

### AI Sales Agent — Sarah (Week 2)

Built a floating AI sales agent widget that lives on the pricing page:

- **What:** A chat widget powered by Grok 4.1 Fast (via OpenRouter) that proactively greets visitors after 10 seconds
- **Why:** Converts pricing page visitors into leads without a human being online
- **How it works:**
  1. Visitor lands on pricing page → widget auto-opens after 10s with audio chime
  2. Sarah introduces herself, answers product questions, handles objections
  3. Captures name + email when the visitor is interested
  4. Lead data routes to n8n webhook → Telegram notification + Google Sheet
- **Tech:** Floating widget with pulsing cyan glow, cookie-based visitor tracking (365-day), streaming AI responses, Web Audio API for notification sounds
- **Key files:** `src/components/agent/SalesAgentWidget.tsx`, `src/app/api/agent/sales/route.ts`

### Daily Blog Engine (Week 2)

Automated SEO blog publishing — one post per day, zero manual effort:

- **What:** n8n workflow generates and publishes a blog post every day at 9AM IST
- **Why:** SEO traffic is free distribution. 60 rotating topics across 10 categories (cold calling, objection handling, negotiation, etc.)
- **How it works:**
  1. n8n Schedule Trigger fires daily at 9AM IST
  2. Claude Sonnet 4.6 writes a 1500-word SEO-optimized blog post
  3. Nano Banana (via OpenRouter) generates a hero image
  4. Image uploads to Google Drive, post saves to Supabase `blog_posts` table
  5. Blog frontend renders with pagination, tag filtering, and full SEO metadata
- **Cost:** ~$1.80/month for daily posts (Claude Sonnet + image generation)
- **Key files:** `src/app/blog/page.tsx`, `src/app/api/blog/route.ts`

### Feedback & Bug Report Widget (Week 2)

Built a CleanShot-style feedback system directly into the app:

- **What:** Floating widget on every page with two tabs — Report (bugs/features/feedback) and Vote (upvote planned features)
- **Why:** Users and Dhruv during demos can report bugs with screenshots instantly. Feedback routes directly to Telegram + email.
- **How it works:**
  1. User clicks feedback button (bottom-left, amber glow)
  2. Selects category → fills in context-specific form fields → captures screenshot
  3. **CleanShot-style region capture:** Click "Select Area" → viewport freezes → drag to select region → cyan border with corner handles + dimension labels → crop
  4. Annotation tools: draw red rectangles and freehand lines to highlight issues
  5. Submit → POST to Next.js API → n8n webhook → screenshot uploads to Google Drive → Telegram + Gmail notification → Google Sheet logging
- **Tech:** html2canvas for viewport capture, Canvas API for region selection + annotation, React portal for fullscreen overlay, n8n workflow with 18 nodes
- **Suggestion voting:** Pre-defined features users can upvote, tracked via localStorage + Google Sheet
- **Key files:** `src/components/feedback/ScreenshotCapture.tsx`, `src/lib/screenshot.ts`, `n8n-workflows/feedback-widget.json`

---

## Architecture (How It Works)

```
User (Browser)
    │
    ▼
Next.js Frontend (Vercel — Free)
    │
    ├── /                         → Landing page (hero, features, pricing)
    ├── /blog                     → SEO blog (auto-published daily)
    ├── /pricing                  → Pricing page + AI Sales Agent Sarah
    ├── /dashboard/coach          → Text chat with AI coach
    ├── /dashboard/practice       → Real-time voice via WebSocket
    ├── /dashboard/calls          → Upload audio → Whisper → GPT analysis
    ├── /dashboard/crm            → Contact management + pipeline
    ├── /dashboard/ai-calling     → Outbound AI calling campaigns
    └── [Feedback Widget]         → Floating on ALL pages (bottom-left)
    │
    ▼
Next.js API Routes (Serverless Functions)
    │
    ├── /api/ai/chat              → Routes to OpenAI/Anthropic/OpenRouter/Perplexity
    ├── /api/ai/realtime-token    → Gets ephemeral token for voice
    ├── /api/ai/speak             → ElevenLabs TTS
    ├── /api/agent/sales          → Sales Agent Sarah (Grok 4.1 Fast)
    ├── /api/blog                 → Blog CRUD (auto-publish from n8n)
    ├── /api/feedback             → Feedback submission → n8n webhook
    ├── /api/feedback/vote        → Suggestion voting → n8n webhook
    ├── /api/user-keys            → BYOAPI key management (encrypted)
    ├── /api/contacts             → CRM contact management
    ├── /api/calling              → AI outbound calling (Twilio)
    └── /api/ai/transcribe        → Whisper transcription
    │
    ▼
Supabase (Free)                            n8n (Self-Hosted — Free)
├── Auth (email/password + OAuth)          ├── Feedback Handler (18 nodes)
├── PostgreSQL (users, contacts,           │   → Google Drive (screenshots)
│   teams, campaigns, API keys,            │   → Telegram + Gmail notification
│   blog_posts)                            │   → Google Sheet logging
└── Row Level Security                     ├── Daily Blog Engine (13 nodes)
                                           │   → Claude Sonnet + image gen
                                           │   → Google Drive + Supabase
                                           └── Sales Agent Leads
                                               → Telegram notification
```

**Key insight:** No separate backend server. Next.js API routes ARE the backend — they run as serverless functions on Vercel for free. n8n handles async automation (notifications, screenshots, blog publishing).

---

## Build Timeline

| Day | What Got Built |
|-----|---------------|
| **Day 1** | Project setup, auth system, database schema, basic UI |
| **Day 2** | Objection coach (chat), AI provider routing |
| **Day 3** | Real-time voice practice (OpenAI Realtime API + WebSocket) |
| **Day 4** | Call analysis (upload → transcribe → score) |
| **Day 5** | Credit system, personas, session history |
| **Day 6** | Landing page, pricing page, OG images, polish |
| **Day 7** | Deploy, test, fix bugs, go live |
| **Week 2** | AI Sales Agent Sarah, daily blog engine, feedback widget with CleanShot-style screenshot capture, n8n automation backend |

---

## Competitors vs Us

| Feature | QuotaHit | Gong ($108-250/user) | Yoodli ($20/mo) | Second Nature |
|---------|:--------:|:--------------------:|:----------------:|:-------------:|
| AI Voice Practice | YES | NO | NO real-time | YES (avatar) |
| AI Coaching (multi-model) | YES | Analytics only | YES | YES |
| Call Analysis | YES | YES | NO | NO |
| Built-in CRM | YES | NO | NO | NO |
| AI Outbound Calling | YES | NO | NO | NO |
| BYOAPI (own keys) | YES | NO | NO | NO |
| Price | **Free + modules** | **$108-250/mo** | **$20/mo** | **Custom** |
| Setup Time | Instant | Weeks + contract | Instant | Weeks |
| Multi-AI Provider | YES (6+) | NO | NO | NO |

---

## Key Lessons for Students

1. **No backend server needed** — Next.js API routes are serverless functions. No Express, no Docker, no server management, no DevOps.

2. **No designer needed** — UX Pilot generated designs from text prompts. Claude Code built them pixel-perfect with Tailwind CSS.

3. **AI wrote ~95% of the code** — Claude Code in VS Code handles everything: React components, API routes, database queries, CSS animations, deployment configs.

4. **Free tiers are powerful** — Vercel Free + Supabase Free = full production app with auth, database, and serverless functions at $0/month.

5. **Pay-as-you-go AI is cheap** — Kimi K2.5 costs fractions of a cent per message. Even GPT-4o Realtime voice costs ~$0.10-0.15 per minute.

6. **Ship fast, iterate later** — Week 1: core features. Week 2+: polish, marketing, monetization. Don't build everything before launching.

7. **n8n for async automation** — Instead of building notification systems, email senders, and screenshot uploaders in code, use n8n workflows. One webhook + a few nodes replaces hundreds of lines of code. Self-hosted n8n is free.

8. **html2canvas for in-app screenshots** — Users can capture and annotate screenshots without leaving the app. CleanShot-style region selection (drag to select area) makes bug reports 10x more useful than full-page screenshots.

---

## The Bottom Line

> You don't need a team of 10 or $50K to build a real SaaS product. **1 person + AI tools + ~$30/month** can ship what used to take months and tens of thousands of dollars. The barrier isn't technical skill anymore — it's having the idea and executing fast.

---

**Built by:** Dhruv Tomar ([@aiwithdhruv](https://www.linkedin.com/in/aiwithdhruv/))
**Live at:** [quotahit.com](https://www.quotahit.com)
**Book a demo:** [calendly.com/aiwithdhruv](https://calendly.com/aiwithdhruv/makeaiworkforyou)
