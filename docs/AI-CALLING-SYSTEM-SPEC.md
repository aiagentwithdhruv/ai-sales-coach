# AI Calling & Follow-Up System - Complete Technical Specification

> **Status:** Research Complete | Ready for Build
> **Author:** Dhruv Tomar (AIwithDhruv)
> **Last Updated:** Feb 9, 2026
> **Competitors Analyzed:** PreCallAI, SquadStack.ai, Vapi.ai, Retell.ai, Bland.ai

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Competitive Landscape Deep Dive](#2-competitive-landscape-deep-dive)
3. [What Makes Us 100x Better](#3-what-makes-us-100x-better)
4. [System Architecture](#4-system-architecture)
5. [Feature Specifications](#5-feature-specifications)
6. [API & Technology Stack](#6-api--technology-stack)
7. [Database Schema](#7-database-schema)
8. [Pricing Model](#8-pricing-model)
9. [Cost Analysis Per Call](#9-cost-analysis-per-call)
10. [Implementation Roadmap](#10-implementation-roadmap)
11. [Security & Compliance](#11-security--compliance)
12. [Integrations](#12-integrations)

---

## 1. Executive Summary

### The Vision
Build an **all-in-one AI Sales Intelligence Platform** that combines:
- **AI Voice Agents** (inbound + outbound calling)
- **Sales Coaching** (practice, analyze, improve)
- **Automated Follow-ups** (email + SMS + WhatsApp sequences)
- **Contact Intelligence** (mini-CRM with AI enrichment)
- **Campaign Management** (bulk outbound with smart scheduling)

**Nobody offers all 5 in one platform.** PreCallAI does calling only. SquadStack does calling only. Gong does analytics only. Our Sales Coach already has coaching + practice + analysis. Adding calling + follow-ups makes us the **only end-to-end AI sales platform** at a fraction of enterprise pricing.

### Target Market
- **Primary:** Indian SMBs, startups, solo founders, SDR teams (1-50 reps)
- **Secondary:** International small sales teams
- **TAM:** AI in Sales $24.6B (2024) → $63.5B+ (2032)

---

## 2. Competitive Landscape Deep Dive

### 2.1 PreCallAI (precallai.com)

**What they do:** AI Voice Platform for automated inbound/outbound calls

**Pricing:**
| Plan | Platform Fee | Per Minute | Concurrent Calls | Daily Limit |
|------|-------------|------------|-------------------|-------------|
| Starter | $0/mo | $0.10/min | 20 | 100 min |
| Growth | $29/mo | $0.10/min | 20 | 2,000 min |
| Professional | $79/mo | $0.10/min | 20 | 5,000 min |
| Enterprise | Custom | $0.05/min | Unlimited | Unlimited |

**Features:**
- Inbound AI Calls, Outbound AI Calls
- AI Chatbot widget
- AI SMS Bot
- Knowledge Base training
- Call Logs with recordings
- Workflow builder (visual)
- Campaign management
- Contact & Segment management
- Integrations: HubSpot, Salesforce, GoHighLevel, Zoho, WhatsApp, SMTP
- Voice providers: ElevenLabs, Cartesia, Rime, Neuphonic, LMNT, Inworld, Hume
- HIPAA compliant (Growth+)
- 30+ languages

**Weaknesses (our opportunity):**
- NO sales coaching or practice
- NO call scoring/analysis (just recordings)
- NO follow-up email automation
- NO deal risk analysis
- NO presentation/proposal generation
- Basic analytics (call metrics only, no skill radar)
- $0.10/min is expensive for Indian market
- 20 concurrent call limit on all non-enterprise plans
- No real-time AI coaching during human calls
- No objection handling training

### 2.2 SquadStack.ai

**What they do:** Enterprise Voice AI Agents built for India

**Key stats:**
- Trained on **600M+ minutes** of real Indian sales calls
- Latency: <0.8s
- Voice Quality: 4.23 MOS
- Clients: Upstox, PhonePe, Kotak Securities, Tata Digital, Zepto, AngelOne

**Products:**
- Humanoid AI Agent (flagship)
- In-App Voice AI Assistant (NEW - just launched)
- Agent Management Platform
- AI Call Quality Analysis
- Analytics & Reporting
- Vetted & Trained Telecallers (human fallback)
- Lead Management & Omnichannel Outreach

**Use Cases:** Sales, Workforce Hiring, Loan EMI Collections, Customer Support

**Pricing:** Custom enterprise only (not self-serve)

**Weaknesses:**
- Enterprise-only pricing (no SMB/startup plan)
- No self-serve signup
- India-only focus
- No sales coaching/training component
- No practice mode
- No objection library
- Closed ecosystem (no custom LLM support)
- No email/SMS follow-up automation in platform

### 2.3 Vapi.ai (Developer Platform)

**What they do:** Developer-first API for building voice AI agents

**Pricing (layered, per component):**
| Component | Cost/Min |
|-----------|----------|
| Vapi Platform Fee | $0.05 |
| STT (Deepgram) | ~$0.01 |
| LLM (GPT-4o) | ~$0.06-0.10 |
| TTS (ElevenLabs) | ~$0.04 |
| Telephony (Twilio) | ~$0.01-0.05 |
| **Total Real Cost** | **$0.17-0.33** |

**Key Features:**
- Assistants API, Squads (multi-agent chaining)
- Function Calling (trigger APIs mid-call)
- Knowledge Base (RAG)
- Server URLs (webhooks)
- Batch outbound calling
- Sub-600ms latency
- 1M+ concurrent call capacity
- BYO models (any LLM, STT, TTS)

**Why we should NOT use Vapi:**
- $0.05/min platform fee adds up fast
- Real cost is $0.25-0.33/min (3x what we could build ourselves)
- We already have OpenAI Realtime API for voice
- We can build our own orchestration layer
- Vapi is a middleman — we can go direct to Twilio + Deepgram + ElevenLabs

### 2.4 Retell.ai

**Pricing:** $0.07/min flat (includes STT), phone numbers $2/mo
**Strengths:** HIPAA/SOC2 compliant, clean API, good for healthcare
**Weakness:** ~800ms latency, smaller scale than Vapi

### 2.5 Bland.ai

**Pricing:** $0.09/min connected, $0.015 for <10s attempts
**Strengths:** Owns infra (not middleware), 20K+ calls/hour, enterprise-grade
**Weakness:** Enterprise-focused, expensive for startups

### 2.6 ElevenLabs Conversational AI

**Pricing:** $0.08-0.10/min (just voice, LLM costs separate)
**Strengths:** Best voice quality, 29+ languages, voice cloning
**Weakness:** No telephony built-in, need to add Twilio separately

---

## 3. What Makes Us 100x Better

### 3.1 The "All-in-One" Advantage

| Capability | Us | PreCallAI | SquadStack | Vapi | Gong | Yoodli |
|-----------|:---:|:---------:|:----------:|:----:|:----:|:------:|
| AI Voice Agents (in/out) | YES | YES | YES | YES | NO | NO |
| Sales Practice & Roleplay | YES | NO | NO | NO | NO | YES |
| Real-time Voice Practice | YES | NO | NO | NO | NO | NO |
| Call Recording & Analysis | YES | Partial | YES | NO | YES | NO |
| AI Coaching & Scoring | YES | NO | NO | NO | Partial | YES |
| Objection Handling Training | YES | NO | NO | NO | NO | Partial |
| Email Follow-up Automation | YES | NO | NO | NO | NO | NO |
| SMS/WhatsApp Follow-ups | YES | Partial | YES | NO | NO | NO |
| Presentation Generator | YES | NO | NO | NO | NO | NO |
| Quotation/Proposal Builder | YES | NO | NO | NO | NO | NO |
| Deal Risk Analysis | YES | NO | NO | NO | YES | NO |
| Company Brain (Knowledge) | YES | YES | YES | YES | NO | NO |
| Campaign Management | YES | YES | YES | NO | NO | NO |
| Contact Mini-CRM | YES | YES | YES | NO | YES | NO |
| Calendar Booking | YES | NO | NO | NO | NO | NO |
| Multi-AI Provider | YES | NO | NO | YES | NO | NO |
| Custom LLM Support | YES | NO | NO | YES | NO | NO |
| Self-Serve (no sales call) | YES | YES | NO | YES | NO | YES |
| **Price/user/month** | **$19-49** | **$29-79+** | **Custom** | **Dev tool** | **$108-250** | **$0-20** |

### 3.2 Unique Differentiators

1. **Practice → Call → Analyze → Follow-up Loop**
   - Practice with AI → Make real call → AI scores it → Auto-generate follow-up → Schedule send
   - Nobody has this closed loop

2. **AI Whisper Mode During Live Calls**
   - While rep talks to prospect, AI listens and shows real-time suggestions
   - "They mentioned budget concern — try the ROI reframe"
   - PreCallAI/SquadStack have AI-ONLY calls, not AI-ASSISTED human calls

3. **Dual Mode: AI Autonomous + Human Assisted**
   - Mode 1: AI makes the call autonomously (like PreCallAI)
   - Mode 2: Human makes the call, AI coaches in real-time (like Gong but live)
   - Switch modes per campaign

4. **Indian Market Optimization**
   - Hindi + English + Regional language support
   - Indian phone number support via Twilio/Exotel
   - INR pricing
   - Trained on Indian sales conversation patterns

5. **10x Cheaper AI Calls**
   - Build own orchestration (no Vapi $0.05/min middleman fee)
   - Use Deepgram Nova-3 ($0.0043/min) instead of expensive STT
   - Use OpenAI TTS ($0.015/min) or Cartesia for cheap TTS
   - Kimi K2.5 via OpenRouter for LLM ($0.001/1K tokens)
   - **Target: $0.03-0.06/min total cost vs $0.10-0.33/min competitors**

---

## 4. System Architecture

### 4.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js)                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │
│  │ Campaign  │ │ Contacts │ │  Dialer  │ │ Follow-up Queue  │   │
│  │ Manager   │ │   CRM    │ │  (WebRTC)│ │   (Email/SMS)    │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │
│  │ AI Agent  │ │  Call    │ │ Whisper  │ │  Analytics &     │   │
│  │ Builder   │ │  Logs    │ │  Coach   │ │  Reporting       │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴──────────┐
                    │   API Layer (Next.js)│
                    │   /api/calling/*     │
                    │   /api/contacts/*    │
                    │   /api/campaigns/*   │
                    │   /api/followups/*   │
                    │   /api/webhooks/*    │
                    └─────────┬──────────┘
                              │
        ┌─────────────────────┼──────────────────────┐
        │                     │                      │
┌───────┴───────┐  ┌──────────┴──────────┐  ┌───────┴───────┐
│   TELEPHONY   │  │    AI ENGINE        │  │   MESSAGING   │
│               │  │                     │  │               │
│ Twilio Voice  │  │ STT: Deepgram      │  │ Resend (Email)│
│ Twilio SIP    │  │ LLM: OpenRouter    │  │ Twilio SMS    │
│ Exotel (India)│  │ TTS: ElevenLabs    │  │ WhatsApp API  │
│ WebRTC (web)  │  │     / OpenAI TTS   │  │               │
│               │  │ Realtime: GPT-4o   │  │               │
└───────────────┘  └─────────────────────┘  └───────────────┘
                              │
                    ┌─────────┴──────────┐
                    │    DATA LAYER      │
                    │                    │
                    │ Supabase (Postgres)│
                    │ - contacts         │
                    │ - calls            │
                    │ - campaigns        │
                    │ - follow_ups       │
                    │ - recordings (S3)  │
                    │ - transcripts      │
                    │ - ai_agents        │
                    └────────────────────┘
```

### 4.2 Call Flow Architecture

#### Outbound AI Call Flow
```
1. Campaign triggers → API creates call via Twilio
2. Twilio connects to prospect's phone
3. Prospect answers → Twilio streams audio via WebSocket
4. Audio → Deepgram (real-time STT) → text
5. Text → LLM (OpenRouter/Kimi K2.5) → response
6. Response → ElevenLabs/OpenAI TTS → audio
7. Audio → Twilio → plays to prospect
8. Repeat 4-7 until call ends
9. On hangup → save recording, transcript, generate summary
10. Auto-trigger follow-up sequence based on call outcome
```

#### Outbound Human-Assisted Call Flow (Whisper Mode)
```
1. Rep clicks "Call" on contact → Twilio dials prospect
2. Rep talks directly to prospect (normal call)
3. Simultaneously: Twilio streams audio to our server
4. Audio → Deepgram STT → real-time transcript
5. Transcript → LLM → coaching suggestions
6. Suggestions displayed on rep's screen in real-time
7. Rep sees: objection tips, talking points, deal context
8. On hangup → full analysis, score, follow-up draft
```

#### Inbound AI Call Flow
```
1. Prospect calls our Twilio number
2. Twilio webhook → our /api/webhooks/incoming-call
3. We look up AI agent assigned to that number
4. Agent system prompt + knowledge base loaded
5. Same STT → LLM → TTS loop as outbound
6. AI can: answer questions, book meetings (Cal.com), transfer to human
7. On hangup → save everything, notify rep, trigger follow-up
```

### 4.3 Real-Time Audio Pipeline

```
                   WebSocket Stream
Phone ──────────► Twilio ──────────► Our Server
                                        │
                                   ┌────┴────┐
                                   │ Deepgram │ (STT, streaming)
                                   │ Nova-3   │ $0.0043/min
                                   └────┬────┘
                                        │ text chunks
                                   ┌────┴────┐
                                   │   LLM    │ (streaming)
                                   │ Kimi K2.5│ ~$0.001/1K tok
                                   └────┬────┘
                                        │ response text
                                   ┌────┴────┐
                                   │   TTS    │ (streaming)
                                   │ElevenLabs│ $0.08-0.10/min
                                   │or OpenAI │ $0.015/min
                                   └────┬────┘
                                        │ audio chunks
                                   ┌────┴────┐
                                   │  Twilio  │ (plays to caller)
                                   └─────────┘
```

**Target End-to-End Latency: <800ms**
- Deepgram streaming: ~100-200ms
- LLM first token: ~200-400ms (Kimi K2.5 is fast)
- TTS first chunk: ~100-200ms
- Network: ~50-100ms

---

## 5. Feature Specifications

### 5.1 AI Agent Builder

**Purpose:** Create and configure AI voice agents (like PreCallAI's Assistants)

**Features:**
- **Agent Templates:** Cold Call, Lead Qualification, Appointment Booking, Customer Support, Follow-up, Survey
- **System Prompt Editor:** Rich text editor with variables ({{contact.name}}, {{company}}, {{deal.value}})
- **Knowledge Base:** Upload PDFs, docs, website URLs → RAG pipeline
- **Voice Selection:** Pick from 20+ voices (ElevenLabs, OpenAI, custom cloned)
- **Language:** English, Hindi, + 10 regional (Telugu, Tamil, Bengali, Marathi, etc.)
- **Call Flow Builder:** Visual drag-and-drop conversation flow
  - Greeting → Qualification Questions → Pitch → Objection Handling → Close → Booking
  - Conditional branches based on prospect responses
- **Function Calling:** Mid-call actions
  - Book meeting (Cal.com integration)
  - Send SMS/WhatsApp with link
  - Look up CRM data
  - Transfer to human agent
  - Update deal stage
- **Testing:** Test call from browser (WebRTC) before going live
- **Role Play Mode:** Practice against your own AI agent as training

### 5.2 Campaign Management

**Purpose:** Run bulk outbound calling campaigns with AI agents

**Features:**
- **Campaign Types:**
  - Cold Outreach (first touch)
  - Follow-up Campaign (warm leads)
  - Re-engagement (dormant leads)
  - Event/Webinar Invite
  - Survey/Feedback
- **Contact Lists:** Import CSV, connect CRM, manual add
- **Smart Scheduling:**
  - Best time to call algorithm (based on past pickup rates)
  - Timezone-aware calling windows
  - Do Not Disturb hours (India: 9 PM - 9 AM)
  - Retry logic: try 3x with increasing delays
- **Concurrent Calls:** Up to 50 simultaneous calls (configurable)
- **Call Pacing:** Adjust speed based on available agents
- **Live Dashboard:**
  - Calls in progress, completed, failed
  - Real-time pickup rate, avg duration
  - Conversion funnel (called → answered → qualified → booked)
- **A/B Testing:** Test 2 different AI agents/scripts, see which converts better
- **Campaign Pause/Resume:** Stop mid-campaign, resume later
- **DNC (Do Not Call) List:** Automatic compliance

### 5.3 Contact Management (Mini-CRM)

**Purpose:** Store and manage all contacts and their interaction history

**Features:**
- **Contact Fields:**
  - Name, email, phone, company, title, source
  - Custom fields (unlimited)
  - Tags and segments
  - Lead score (AI-calculated)
  - Deal stage (pipeline tracking)
  - Timezone (auto-detected from phone number)
- **Interaction Timeline:**
  - Every call (with recording + transcript + score)
  - Every email sent/opened/clicked
  - Every SMS/WhatsApp message
  - Every meeting booked
  - Notes from rep
- **Smart Segments:**
  - "Answered but didn't convert" → re-engagement campaign
  - "Mentioned competitor" → send comparison sheet
  - "Asked about pricing" → send proposal
  - "No answer 3x" → switch to email
- **Import/Export:** CSV, Google Sheets, HubSpot, Salesforce sync
- **Duplicate Detection:** Phone/email matching
- **Enrichment:** Auto-lookup company info, LinkedIn, etc.

### 5.4 Follow-Up Automation Engine

**Purpose:** Automatically send email/SMS/WhatsApp follow-ups based on call outcomes

**Architecture:**
```
Call Ends → AI Analyzes Outcome → Triggers Sequence → Sends Messages → Tracks Engagement

Outcome Types:
├── BOOKED_MEETING → Send confirmation + calendar invite
├── INTERESTED_NOT_READY → Nurture sequence (5 emails over 14 days)
├── ASKED_FOR_INFO → Send relevant docs/proposal immediately
├── OBJECTION_RAISED → Send objection-specific content
├── NO_ANSWER → Try call again + send "sorry I missed you" SMS
├── VOICEMAIL → Send email "I left you a voicemail about..."
├── NOT_INTERESTED → Add to long-term nurture (monthly)
└── WRONG_NUMBER → Remove from campaign
```

**Follow-Up Channels:**

#### Email (via Resend API)
- **Pricing:** Free tier 3K/mo, $20/mo for 50K
- **Features:** React Email templates, open/click tracking, custom domain
- **Templates:** AI-generated from call context
- **Personalization:** {{firstName}}, {{companyName}}, {{painPoint}}, {{nextStep}}
- **Sequences:** Multi-step drip campaigns with delays
  ```
  Day 0: Thank you + meeting recap
  Day 2: Relevant case study
  Day 5: Check-in + additional value
  Day 10: "Are you still evaluating?"
  Day 14: Break-up email ("last message unless...")
  ```
- **Smart Send Time:** AI picks optimal send time per contact
- **Unsubscribe:** One-click, CAN-SPAM compliant

#### SMS (via Twilio)
- **India Pricing:** ~₹0.15-0.30/SMS
- **US Pricing:** ~$0.0079/SMS
- **Use Cases:** Appointment reminders, "just called you" nudges, quick links
- **Templates:** Pre-approved for A2P (Application-to-Person)
- **Opt-out:** STOP keyword handling

#### WhatsApp Business API (via Twilio)
- **India Pricing:** ~$0.0094-0.0107/marketing message
- **Pricing:** $0.005 Twilio fee + Meta's per-template fee
- **Use Cases:** Rich media follow-ups, document sharing, interactive buttons
- **Template Types:** Marketing, Utility, Authentication
- **24hr Rule:** Free replies within 24hr of customer message
- **Rich Content:** Images, PDFs, buttons, quick replies, catalogs

### 5.5 AI Whisper Coach (During Live Calls)

**Purpose:** Real-time AI coaching overlay while rep talks to prospect

**How it works:**
```
┌─────────────────────────────────────────────────┐
│  REP'S SCREEN DURING CALL                       │
│                                                  │
│  ┌──────────────────┐  ┌─────────────────────┐  │
│  │ LIVE TRANSCRIPT  │  │  AI COACH PANEL     │  │
│  │                  │  │                      │  │
│  │ Rep: "So what's  │  │ 💡 TIP: They said   │  │
│  │ your biggest     │  │ "tight budget" -    │  │
│  │ challenge?"      │  │ try ROI framing:    │  │
│  │                  │  │ "Most clients save  │  │
│  │ Prospect: "Well  │  │ 40% in first 90    │  │
│  │ honestly budget  │  │ days..."           │  │
│  │ is really tight  │  │                     │  │
│  │ right now..."    │  │ ⚠️ OBJECTION:       │  │
│  │                  │  │ Budget concern      │  │
│  │                  │  │ detected.           │  │
│  │                  │  │                     │  │
│  │                  │  │ 📊 SENTIMENT: 😐    │  │
│  │                  │  │ Neutral → trending  │  │
│  │                  │  │ negative            │  │
│  │                  │  │                     │  │
│  │                  │  │ 📋 NEXT STEPS:      │  │
│  │                  │  │ - Ask about ROI     │  │
│  │                  │  │ - Mention free trial│  │
│  │                  │  │ - Offer case study  │  │
│  └──────────────────┘  └─────────────────────┘  │
│                                                  │
│  [🔴 End Call]  [📝 Add Note]  [📅 Book Meeting] │
└─────────────────────────────────────────────────┘
```

**AI Coach Features:**
- Real-time objection detection + suggested responses
- Sentiment analysis (positive/neutral/negative) with trend
- Talk ratio monitoring (rep vs prospect)
- Filler word detection ("um", "like", "basically")
- Key topic extraction
- Competitor mention alerts
- Next-step suggestions based on conversation flow
- Company Brain context surfacing (relevant product info)
- Deal context from CRM (past interactions, deal value, stage)

### 5.6 Call Analytics Dashboard

**Metrics tracked per call:**
- Duration, talk ratio, filler words count
- Objections raised and handled (score each)
- Sentiment timeline (graph over call duration)
- Key topics discussed
- Questions asked (discovery quality)
- Next steps clarity score
- Overall call score (0-100)

**Campaign-level analytics:**
- Pickup rate, avg duration, conversion rate
- Best time to call heatmap
- Agent performance comparison (A/B test results)
- Cost per qualified lead
- Cost per booked meeting
- ROI calculator

**Team analytics:**
- Rep leaderboard (calls, conversions, scores)
- Skill radar per rep (discovery, rapport, objections, closing)
- Improvement trends over time
- Manager alerts (rep struggling, needs coaching)

### 5.7 Call Recording & Transcript Storage

- **Recording:** Dual-channel (rep + prospect separately)
- **Storage:** Supabase Storage / S3 (compressed MP3)
- **Transcription:** Deepgram Nova-3 (real-time during call + post-call refinement)
- **Speaker diarization:** Identify who said what
- **Searchable:** Full-text search across all transcripts
- **Compliance:** Recording consent announcement (configurable)
- **Retention:** 90 days free tier, unlimited on Pro
- **Export:** Download recording, transcript (PDF/TXT/JSON)

### 5.8 Phone Number Management

- **Buy Numbers:** Direct from Twilio within our app
  - US: ~$1.15/mo, India: via Exotel or virtual numbers
  - Toll-free, local, mobile options
- **Assign to Agents:** Map number → AI agent
- **Caller ID:** Show custom caller ID for outbound
- **Number Pooling:** Round-robin across multiple numbers (avoid spam flags)
- **Warm-up:** Gradually increase call volume per number

---

## 6. API & Technology Stack

### 6.1 Recommended Stack

| Component | Technology | Cost | Why |
|-----------|-----------|------|-----|
| **Telephony** | Twilio Programmable Voice | $0.04-0.05/min (India) | Most reliable, global coverage, SIP trunking |
| **India Telephony** | Exotel (fallback) | ~₹0.50-1.50/min | Indian numbers, DND compliance, local presence |
| **STT (Speech-to-Text)** | Deepgram Nova-3 | $0.0043/min (batch), $0.0077/min (stream) | Fastest, cheapest, best accuracy |
| **LLM (Brain)** | Kimi K2.5 via OpenRouter | ~$0.001/1K tokens | Cheapest high-quality, our default model |
| **LLM (Premium)** | GPT-4o via OpenAI | ~$0.005/1K tokens | For high-value calls, best reasoning |
| **TTS (Voice)** | ElevenLabs | $0.08-0.10/min | Best quality, 29+ languages, cloning |
| **TTS (Budget)** | OpenAI TTS | $0.015/min | 6 voices, good quality, 10x cheaper |
| **TTS (Ultra-fast)** | Cartesia Sonic | ~$0.04/min | <100ms latency, great for real-time |
| **Email** | Resend | $0 (3K/mo) → $20/mo | React Email, modern API, Next.js native |
| **SMS** | Twilio SMS | $0.0079/msg (US), ~₹0.15/msg (India) | Same platform as voice, simple |
| **WhatsApp** | Twilio WhatsApp API | $0.005 + Meta fee/msg | Already using Twilio for voice |
| **Calendar** | Cal.com API | Free (self-host) or $15/mo | Open source, great API, booking atoms |
| **Storage** | Supabase Storage | Included (1GB free) | Already using Supabase |
| **Queue/Jobs** | Inngest or Trigger.dev | Free tier | Serverless job scheduling for follow-ups |
| **Real-time** | WebSocket (native) | $0 | For live transcript + coaching UI |
| **Database** | Supabase (Postgres) | Already have | RLS, real-time subscriptions |

### 6.2 API Endpoints to Build

```
# ============ CALLING ============
POST   /api/calls/outbound          # Initiate outbound call
POST   /api/calls/outbound/batch    # Batch outbound (campaign)
POST   /api/webhooks/twilio/voice   # Twilio voice webhook (inbound)
POST   /api/webhooks/twilio/status  # Call status updates
WS     /api/calls/stream            # WebSocket for real-time audio
GET    /api/calls/:id               # Get call details
GET    /api/calls/:id/recording     # Get recording URL
GET    /api/calls/:id/transcript    # Get transcript
POST   /api/calls/:id/transfer      # Transfer to human agent
DELETE /api/calls/:id               # End call

# ============ AI AGENTS ============
POST   /api/agents                  # Create AI agent
GET    /api/agents                  # List agents
GET    /api/agents/:id              # Get agent config
PUT    /api/agents/:id              # Update agent
DELETE /api/agents/:id              # Delete agent
POST   /api/agents/:id/test        # Test call agent from browser
POST   /api/agents/:id/knowledge   # Upload knowledge base docs

# ============ CAMPAIGNS ============
POST   /api/campaigns               # Create campaign
GET    /api/campaigns               # List campaigns
GET    /api/campaigns/:id           # Campaign details + stats
PUT    /api/campaigns/:id           # Update campaign
POST   /api/campaigns/:id/start    # Start campaign
POST   /api/campaigns/:id/pause    # Pause campaign
POST   /api/campaigns/:id/resume   # Resume campaign
DELETE /api/campaigns/:id           # Delete campaign

# ============ CONTACTS ============
POST   /api/contacts                # Create contact
GET    /api/contacts                # List contacts (with filters)
GET    /api/contacts/:id            # Contact details + timeline
PUT    /api/contacts/:id            # Update contact
DELETE /api/contacts/:id            # Delete contact
POST   /api/contacts/import         # CSV import
POST   /api/contacts/segments       # Create segment

# ============ FOLLOW-UPS ============
POST   /api/followups/sequences     # Create sequence
GET    /api/followups/sequences     # List sequences
POST   /api/followups/send          # Send single email/SMS/WhatsApp
POST   /api/followups/schedule      # Schedule follow-up
GET    /api/followups/queue         # View scheduled follow-ups
POST   /api/webhooks/email/events   # Email open/click tracking
POST   /api/webhooks/sms/status     # SMS delivery status

# ============ PHONE NUMBERS ============
GET    /api/numbers/available       # Search available numbers
POST   /api/numbers/buy             # Purchase number
GET    /api/numbers                 # List owned numbers
PUT    /api/numbers/:id             # Assign agent to number
DELETE /api/numbers/:id             # Release number

# ============ WHISPER COACH ============
WS     /api/coach/live              # WebSocket for live coaching
GET    /api/coach/suggestions       # Get coaching suggestions
POST   /api/coach/note              # Save coaching note

# ============ ANALYTICS ============
GET    /api/analytics/calls         # Call analytics
GET    /api/analytics/campaigns     # Campaign performance
GET    /api/analytics/agents        # Agent performance comparison
GET    /api/analytics/followups     # Follow-up engagement stats
GET    /api/analytics/team          # Team performance
```

### 6.3 Key NPM Packages Needed

```json
{
  "twilio": "^5.x",           // Twilio Voice + SMS + WhatsApp
  "@deepgram/sdk": "^3.x",    // Real-time STT
  "elevenlabs": "^1.x",       // TTS
  "resend": "^4.x",           // Email
  "@react-email/components": "^0.x",  // Email templates
  "@calcom/atoms": "^1.x",    // Calendar booking
  "inngest": "^3.x",          // Job scheduling
  "ws": "^8.x",               // WebSocket server
  "uuid": "^11.x",            // IDs
  "papaparse": "^5.x",        // CSV parsing
  "libphonenumber-js": "^1.x" // Phone number validation
}
```

---

## 7. Database Schema

### 7.1 Core Tables (Supabase/Postgres)

```sql
-- ============ AI AGENTS ============
CREATE TABLE ai_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('cold_call', 'qualification', 'booking', 'support', 'follow_up', 'survey', 'custom')),
  system_prompt TEXT NOT NULL,
  first_message TEXT, -- What AI says first
  voice_id TEXT DEFAULT 'alloy', -- ElevenLabs or OpenAI voice
  voice_provider TEXT DEFAULT 'openai' CHECK (voice_provider IN ('elevenlabs', 'openai', 'cartesia')),
  llm_model TEXT DEFAULT 'moonshotai/kimi-k2.5',
  llm_provider TEXT DEFAULT 'openrouter',
  language TEXT DEFAULT 'en',
  max_duration_seconds INTEGER DEFAULT 300, -- 5 min default
  knowledge_base JSONB DEFAULT '[]', -- [{id, name, type, content}]
  tools JSONB DEFAULT '[]', -- [{name, description, parameters, endpoint}]
  transfer_number TEXT, -- Number to transfer to human
  end_call_phrases TEXT[] DEFAULT ARRAY['goodbye', 'not interested'],
  interruption_enabled BOOLEAN DEFAULT true,
  background_sound TEXT, -- office, none
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============ PHONE NUMBERS ============
CREATE TABLE phone_numbers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  number TEXT UNIQUE NOT NULL, -- E.164 format
  provider TEXT DEFAULT 'twilio' CHECK (provider IN ('twilio', 'exotel')),
  provider_sid TEXT, -- Twilio SID
  country_code TEXT DEFAULT 'US',
  type TEXT DEFAULT 'local' CHECK (type IN ('local', 'toll_free', 'mobile')),
  agent_id UUID REFERENCES ai_agents(id), -- Assigned AI agent for inbound
  monthly_cost DECIMAL(10,4),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============ CONTACTS ============
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT, -- E.164 format
  company TEXT,
  title TEXT,
  source TEXT, -- csv_import, manual, crm_sync, website
  lead_score INTEGER DEFAULT 0, -- 0-100, AI calculated
  deal_stage TEXT DEFAULT 'new' CHECK (deal_stage IN ('new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost')),
  deal_value DECIMAL(12,2),
  timezone TEXT, -- Auto-detected from phone
  tags TEXT[] DEFAULT '{}',
  custom_fields JSONB DEFAULT '{}',
  do_not_call BOOLEAN DEFAULT false,
  do_not_email BOOLEAN DEFAULT false,
  last_contacted_at TIMESTAMPTZ,
  next_follow_up_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_contacts_phone ON contacts(phone);
CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_contacts_user_stage ON contacts(user_id, deal_stage);

-- ============ CALLS ============
CREATE TABLE calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  contact_id UUID REFERENCES contacts(id),
  agent_id UUID REFERENCES ai_agents(id),
  campaign_id UUID REFERENCES campaigns(id),
  phone_number_id UUID REFERENCES phone_numbers(id),
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  mode TEXT NOT NULL CHECK (mode IN ('ai_autonomous', 'human_assisted')),
  status TEXT DEFAULT 'initiated' CHECK (status IN ('initiated', 'ringing', 'in_progress', 'completed', 'failed', 'no_answer', 'busy', 'voicemail')),
  twilio_call_sid TEXT,
  from_number TEXT,
  to_number TEXT,
  started_at TIMESTAMPTZ,
  answered_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  recording_url TEXT,
  recording_duration_seconds INTEGER,
  transcript JSONB, -- [{speaker, text, timestamp}]
  summary TEXT, -- AI-generated call summary
  outcome TEXT CHECK (outcome IN ('booked_meeting', 'interested', 'not_interested', 'callback_requested', 'wrong_number', 'voicemail', 'no_answer', 'transferred')),
  sentiment_score DECIMAL(3,2), -- -1.0 to 1.0
  call_score INTEGER, -- 0-100
  score_breakdown JSONB, -- {discovery: 85, rapport: 90, objections: 75, closing: 80}
  objections_detected TEXT[],
  key_topics TEXT[],
  next_steps TEXT,
  cost_amount DECIMAL(10,4), -- Total cost of this call
  cost_breakdown JSONB, -- {telephony, stt, llm, tts}
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_calls_user ON calls(user_id);
CREATE INDEX idx_calls_contact ON calls(contact_id);
CREATE INDEX idx_calls_campaign ON calls(campaign_id);
CREATE INDEX idx_calls_status ON calls(status);

-- ============ CAMPAIGNS ============
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('cold_outreach', 'follow_up', 'reengagement', 'event_invite', 'survey')),
  agent_id UUID REFERENCES ai_agents(id),
  phone_number_id UUID REFERENCES phone_numbers(id),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'running', 'paused', 'completed', 'cancelled')),
  contact_segment JSONB, -- Filter criteria for contacts
  total_contacts INTEGER DEFAULT 0,
  called_count INTEGER DEFAULT 0,
  answered_count INTEGER DEFAULT 0,
  converted_count INTEGER DEFAULT 0,
  schedule JSONB, -- {days: ['mon','tue'...], startTime: '09:00', endTime: '18:00', timezone: 'Asia/Kolkata'}
  max_concurrent INTEGER DEFAULT 5,
  retry_attempts INTEGER DEFAULT 3,
  retry_delay_minutes INTEGER DEFAULT 60,
  follow_up_sequence_id UUID REFERENCES follow_up_sequences(id),
  ab_test JSONB, -- {enabled: true, agentB_id: uuid, split: 50}
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============ FOLLOW-UP SEQUENCES ============
CREATE TABLE follow_up_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('call_outcome', 'manual', 'time_based', 'engagement')),
  trigger_condition JSONB, -- {outcome: 'interested', delay_hours: 0}
  steps JSONB NOT NULL, -- [{step: 1, channel: 'email', delay_hours: 0, template_id: uuid, subject, body}]
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============ FOLLOW-UP MESSAGES ============
CREATE TABLE follow_up_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  contact_id UUID REFERENCES contacts(id),
  sequence_id UUID REFERENCES follow_up_sequences(id),
  call_id UUID REFERENCES calls(id),
  channel TEXT NOT NULL CHECK (channel IN ('email', 'sms', 'whatsapp')),
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'sent', 'delivered', 'opened', 'clicked', 'replied', 'bounced', 'failed', 'cancelled')),
  subject TEXT, -- Email subject
  body TEXT NOT NULL,
  to_address TEXT NOT NULL, -- Email or phone
  from_address TEXT,
  scheduled_for TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  provider_id TEXT, -- Resend/Twilio message ID
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_followups_scheduled ON follow_up_messages(scheduled_for) WHERE status = 'scheduled';
CREATE INDEX idx_followups_contact ON follow_up_messages(contact_id);

-- ============ CALL COST TRACKING ============
CREATE TABLE call_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  call_id UUID REFERENCES calls(id),
  component TEXT NOT NULL CHECK (component IN ('telephony', 'stt', 'llm', 'tts', 'platform')),
  provider TEXT NOT NULL,
  amount DECIMAL(10,6) NOT NULL,
  currency TEXT DEFAULT 'USD',
  duration_seconds INTEGER,
  tokens_used INTEGER, -- For LLM
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 8. Pricing Model

### Our Platform Pricing

| Tier | Monthly | Included Minutes | Per Extra Min | Contacts | Campaigns | Features |
|------|---------|-----------------|---------------|----------|-----------|----------|
| **Free** | $0 | 20 min | N/A | 50 | 1 | AI calls, basic follow-ups, 1 agent |
| **Starter** | $19/mo | 200 min | $0.06/min | 500 | 5 | + Email follow-ups, 3 agents |
| **Pro** | $49/mo | 1,000 min | $0.05/min | 5,000 | Unlimited | + WhatsApp, Whisper Coach, unlimited agents |
| **Team** | $99/mo (5 users) | 5,000 min | $0.04/min | 25,000 | Unlimited | + Team analytics, leaderboard, API access |
| **Enterprise** | Custom | Custom | Custom | Unlimited | Unlimited | + SSO, SLA, dedicated support, custom voice |

### India-Specific Pricing (INR)

| Tier | Monthly | Included Minutes | Per Extra Min |
|------|---------|-----------------|---------------|
| **Free** | ₹0 | 20 min | N/A |
| **Starter** | ₹999/mo | 200 min | ₹5/min |
| **Pro** | ₹2,999/mo | 1,000 min | ₹4/min |
| **Team** | ₹6,999/mo | 5,000 min | ₹3/min |

### Why This Beats Competitors

| Platform | Cost for 1,000 min/mo |
|----------|----------------------|
| **Us (Pro)** | **$49 flat** (includes 1,000 min) |
| PreCallAI | $79 + $100 (1,000 min @ $0.10) = **$179** |
| Vapi.ai | 1,000 x $0.25 = **$250** (dev tool, no UI) |
| SquadStack | **Custom** (enterprise only, est. $500+) |
| Gong | **$108-250/user/mo** (no calling, just analytics) |

**We're 3-5x cheaper than every competitor while offering 3x more features.**

---

## 9. Cost Analysis Per Call

### Our Internal Cost Per Minute (What We Pay)

| Component | Provider | Cost/Min | Notes |
|-----------|----------|----------|-------|
| Telephony (India outbound) | Twilio | $0.0405 | Mobile calls |
| Telephony (US outbound) | Twilio | $0.014 | Outbound |
| STT (streaming) | Deepgram Nova-3 | $0.0077 | Real-time |
| LLM (budget) | Kimi K2.5 / OpenRouter | ~$0.005 | Avg tokens/min |
| LLM (premium) | GPT-4o | ~$0.03 | For high-value calls |
| TTS (budget) | OpenAI TTS | $0.015 | Good quality |
| TTS (premium) | ElevenLabs | $0.08 | Best quality |

**Budget Stack (India call):**
$0.0405 + $0.0077 + $0.005 + $0.015 = **$0.068/min** (~₹5.7/min)

**Premium Stack (US call):**
$0.014 + $0.0077 + $0.03 + $0.08 = **$0.132/min**

**Average Blended Cost:** ~$0.08/min

### Margin Analysis

| Plan | Revenue/min | Cost/min | Margin |
|------|-------------|----------|--------|
| Starter ($19/200 min) | $0.095 | $0.068 | 28% |
| Pro ($49/1,000 min) | $0.049 | $0.068 | -28% (subsidized) |
| Pro overage | $0.05 | $0.068 | -26% |
| Team ($99/5,000 min) | $0.020 | $0.068 | -70% (but platform value) |

**Note:** Pro/Team margins are negative on calling alone, but the platform value (coaching, follow-ups, CRM, analytics) drives retention and upsells. The real revenue is the SaaS subscription, not per-minute calling.

---

## 10. Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
- [ ] Supabase tables (all schemas above)
- [ ] Twilio account setup + phone number purchase
- [ ] Deepgram API integration
- [ ] Basic outbound call API (single call)
- [ ] Call recording + transcript storage
- [ ] Contact management CRUD + import

### Phase 2: AI Agent (Week 2-3)
- [ ] AI Agent builder UI
- [ ] System prompt + voice selection
- [ ] Real-time audio pipeline (Twilio → Deepgram → LLM → TTS → Twilio)
- [ ] Function calling (book meeting, send SMS)
- [ ] Knowledge base upload + RAG
- [ ] Test call from browser (WebRTC)

### Phase 3: Campaign Management (Week 3-4)
- [ ] Campaign creation UI
- [ ] Batch outbound calling engine
- [ ] Smart scheduling + retry logic
- [ ] Live campaign dashboard
- [ ] A/B testing support
- [ ] DNC list compliance

### Phase 4: Inbound Calling (Week 4)
- [ ] Inbound webhook handler
- [ ] Number → Agent routing
- [ ] Call transfer to human
- [ ] Voicemail detection
- [ ] Inbound analytics

### Phase 5: Follow-Up Engine (Week 4-5)
- [ ] Resend email integration
- [ ] Email template builder (React Email)
- [ ] Sequence builder UI
- [ ] Auto-trigger from call outcomes
- [ ] Open/click tracking
- [ ] Twilio SMS integration
- [ ] WhatsApp Business API integration
- [ ] Job scheduler (Inngest/Trigger.dev)

### Phase 6: Whisper Coach (Week 5-6)
- [ ] WebSocket for live transcript streaming
- [ ] Real-time coaching suggestion engine
- [ ] Sentiment analysis overlay
- [ ] Talk ratio monitoring
- [ ] Objection detection alerts
- [ ] Coaching panel UI

### Phase 7: Analytics & Polish (Week 6-7)
- [ ] Call analytics dashboard (real data)
- [ ] Campaign performance reports
- [ ] Agent comparison analytics
- [ ] Follow-up engagement metrics
- [ ] Cost tracking per call/campaign
- [ ] Team leaderboard (real data)

### Phase 8: Integrations (Week 7-8)
- [ ] Cal.com calendar booking
- [ ] HubSpot CRM sync (contacts + deals)
- [ ] Salesforce connector
- [ ] Zapier/Make webhook triggers
- [ ] API documentation for developers

---

## 11. Security & Compliance

### Data Protection
- [ ] All recordings encrypted at rest (AES-256)
- [ ] Call audio transmitted over TLS/WSS
- [ ] PII masking in transcripts (optional)
- [ ] Data retention policies (configurable per account)
- [ ] GDPR right to deletion

### Calling Compliance
- [ ] DND (Do Not Disturb) registry check for India (TRAI)
- [ ] TCPA compliance for US (consent tracking)
- [ ] Recording consent announcement (configurable)
- [ ] Call time restrictions (India: 9 AM - 9 PM, configurable)
- [ ] DNC list management
- [ ] Opt-out handling ("remove me from your list")
- [ ] Call frequency caps (max 3 attempts per contact)

### Email Compliance
- [ ] CAN-SPAM compliance (US)
- [ ] GDPR compliance (EU)
- [ ] One-click unsubscribe header
- [ ] SPF, DKIM, DMARC setup for custom domain
- [ ] Bounce handling + auto-cleanup

### Platform Security
- [ ] Supabase RLS on all tables
- [ ] API rate limiting per user
- [ ] Twilio webhook signature verification
- [ ] Environment variable encryption
- [ ] Audit logging for all actions

---

## 12. Integrations

### Priority 1 (Build Phase)
| Integration | Method | Purpose |
|------------|--------|---------|
| **Cal.com** | REST API | Book meetings during/after calls |
| **HubSpot** | REST API | 2-way contact + deal sync |
| **Google Calendar** | OAuth + API | Calendar availability |
| **Google Sheets** | API | Export data, import contacts |

### Priority 2 (Growth Phase)
| Integration | Method | Purpose |
|------------|--------|---------|
| **Salesforce** | REST API | Enterprise CRM sync |
| **Zoho CRM** | REST API | Indian market CRM |
| **Slack** | Webhook | Call notifications, summaries |
| **Zapier/Make** | Webhook | Connect to 5,000+ apps |
| **GoHighLevel** | REST API | Agency CRM |

### Priority 3 (Enterprise Phase)
| Integration | Method | Purpose |
|------------|--------|---------|
| **Microsoft Teams** | API | Enterprise communication |
| **Pipedrive** | REST API | Sales CRM |
| **Freshsales** | REST API | Indian market |
| **Intercom** | API | Support handoff |
| **Custom Webhook** | HTTP POST | Any system |

---

## Appendix A: PreCallAI Feature-by-Feature Comparison

Based on screenshots analyzed from app.precallai.com:

**Their Dashboard:**
- Total Calls count, Call Limit (100 min), Total Contacts
- Call Metrics chart (Inbound vs Outbound, last 7 days)
- Campaign Performance (Answered vs Failed)
- Call Sentiment Analysis (Positive/Negative/Neutral)
- Latest Call Recordings table
- Campaign Lists table

**Their Sidebar:**
Dashboard, Assistants, Numbers, Campaigns, Contacts, Segments, Chat Widget, SMS Bot Campaigns, Call Logs, Knowledge Base, Workflow (locked), Integrations

**Their Integrations:**
HubSpot, Salesforce, GoHighLevel, Zoho, SMTP, WhatsApp, ElevenLabs, Cartesia, Rime, Neuphonic, LMNT, Inworld, Hume

**Their Assistants:**
- Name + Language + Type (Outbound Voice Call)
- Setup, Test, Role Play buttons
- Simple card layout

**What we'll do better:**
1. Our agent builder will have visual flow editor (not just text prompt)
2. We include sales coaching + practice (they don't)
3. We include follow-up automation (they don't)
4. We include AI whisper coaching for human calls (they don't)
5. Our analytics go deeper (skill radar, sentiment timeline, not just counts)
6. We support custom LLMs (they're locked to their providers)
7. We're cheaper ($49/1,000 min vs their $179 for same volume)

---

## Appendix B: SquadStack Feature-by-Feature Comparison

**Their Products:**
- Humanoid AI Agent
- In-App Voice AI Assistant (just launched)
- Agent Management Platform
- AI Call Quality Analysis
- Analytics & Reporting
- Vetted & Trained Telecallers (human agents)
- Lead Management & Omnichannel Outreach

**Their Use Cases:** Sales, Workforce Hiring, Loan EMI Collections, Customer Support

**Their Clients:** Upstox, NIIT, Tata Digital, Zepto, AngelOne, Shiprocket, PhonePe, Kotak Securities, BankBazaar, Delhivery, SuperMoney

**Their Edge:** 600M+ min training data, <0.8s latency, 4.23 MOS quality

**What we'll do better:**
1. Self-serve (they require sales call to start)
2. We include training/coaching (they're calling-only)
3. We support international (they're India-only)
4. We're transparent pricing (they're custom enterprise only)
5. Our AI whisper mode lets humans use AI during calls (novel)
6. We integrate follow-ups natively (they need external tools)

---

## Appendix C: Quick Reference - All API Keys Needed

```env
# Telephony
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# Speech-to-Text
DEEPGRAM_API_KEY=your-deepgram-key

# Text-to-Speech (choose one or both)
ELEVENLABS_API_KEY=your-elevenlabs-key
OPENAI_API_KEY=your-openai-key  # Already have

# LLM (already have these)
OPENROUTER_API_KEY=already-configured
OPENAI_API_KEY=already-configured

# Email
RESEND_API_KEY=re_your-resend-key

# WhatsApp (via Twilio, same credentials)
# Uses TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN

# Calendar
CALCOM_API_KEY=cal_your-api-key

# India Telephony (optional)
EXOTEL_SID=your-exotel-sid
EXOTEL_TOKEN=your-exotel-token
```

---

*This document is the complete technical specification for building our AI Calling & Follow-Up System. When ready to build, start with Phase 1 (Foundation) and work sequentially. Each phase builds on the previous one.*
