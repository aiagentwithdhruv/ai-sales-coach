# Product Requirements Document: AI Sales Coach (Current Build)

**Version:** 1.0  
**Last Updated:** 2026-02-01  
**Status:** Live / MVP  

---

## 1. Executive Summary

AI Sales Coach is a real-time AI-powered sales training and enablement platform that helps sales representatives improve their skills through live voice practice, call analysis, and contextual coaching. The platform uses OpenAI's Realtime API for natural voice conversations and advanced AI models for analysis and feedback.

### Vision Statement
> Enable every sales rep to practice, improve, and close more deals through AI-powered real-time coaching — without needing a manager or peer available.

---

## 2. Product Overview

### 2.1 Core Value Proposition
- **Practice Anytime**: Live AI role-play available 24/7
- **Context-Aware Training**: Upload company materials for realistic practice
- **Instant Feedback**: Real-time coaching and post-call analysis
- **No Recording Storage**: Privacy-first approach (process and discard)

### 2.2 Target Users
| User Type | Description | Primary Use Case |
|-----------|-------------|------------------|
| Sales Reps (SDR/AE) | Frontline sellers | Practice calls, get feedback |
| Sales Managers | Team leads | Monitor rep readiness |
| Sales Enablement | Training owners | Standardize training content |

### 2.3 Tech Stack
- **Frontend**: Next.js 16, React, Tailwind CSS
- **Backend**: Next.js API Routes
- **AI**: OpenAI Realtime API (voice), GPT-4.1 (analysis), Whisper (transcription)
- **Auth**: Supabase
- **Styling**: Custom dark theme (gunmetal + neon blue accents)

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
    "overall": 0-100,
    "discovery": 0-100,
    "rapport": 0-100,
    "objectionHandling": 0-100,
    "nextSteps": 0-100
  },
  "talkRatio": { "rep": 0-100, "prospect": 0-100 },
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

**Objective**: Provide on-demand text-based coaching for objection handling and sales questions.

#### User Stories
- As a sales rep, I want to ask how to handle a specific objection so I get an immediate response.
- As a sales rep, I want to attach company materials so the coach gives relevant advice.

#### Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| AC-01 | Text chat with AI coach | P0 | ✅ Done |
| AC-02 | Streaming responses | P1 | ✅ Done |
| AC-03 | Attachment support (PDF/Image/URL) | P1 | ✅ Done |
| AC-04 | Credit deduction per query | P1 | ✅ Done |

#### Technical Implementation
```
Files:
├── src/app/dashboard/coach/page.tsx          # Coach UI
└── src/app/api/ai/coach/route.ts             # Coach API
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
- No call recordings stored (process and discard)
- Ephemeral tokens (60s expiry)
- Supabase auth for user sessions
- API keys server-side only

### 4.3 Scalability
- Serverless API routes (auto-scaling)
- WebSocket per-session (no persistent connections)
- Stateless architecture

---

## 5. Design System

### 5.1 Color Palette
| Name | Hex | Usage |
|------|-----|-------|
| Onyx | #0D0D0D | Background |
| Graphite | #1A1A1A | Cards |
| Gunmetal | #2A2A2A | Borders |
| Charcoal | #333333 | Secondary |
| Mist | #6B7280 | Muted text |
| Silver | #9CA3AF | Body text |
| Platinum | #E5E7EB | Headings |
| Neon Blue | #3B82F6 | Primary accent |
| Automation Green | #10B981 | Success/CTA |
| Alert Red | #EF4444 | Errors |

### 5.2 Typography
- Font: System UI / Inter
- Headings: Platinum (#E5E7EB)
- Body: Silver (#9CA3AF)
- Muted: Mist (#6B7280)

### 5.3 Components
- Cards with `bg-graphite border-gunmetal`
- Buttons: Primary (automation green), Secondary (outline)
- Badges for status indicators
- Consistent 6px border radius

---

## 6. Success Metrics

| Metric | Definition | Target |
|--------|------------|--------|
| Practice Sessions/User | Avg sessions per user per week | 5+ |
| Session Duration | Avg time per practice call | 5-10 min |
| Calls Analyzed/User | Uploads per user per month | 10+ |
| Feature Adoption | % users using context upload | 60%+ |
| Script Coaching Adoption | % users enabling script mode | 30%+ |

---

## 7. Known Limitations

| Limitation | Impact | Planned Fix |
|------------|--------|-------------|
| No MP4/video support | Users must convert video | Extract audio in future |
| No transcript storage | Can't review past calls | Optional storage with consent |
| English only | Limited global use | Multilingual in v2 |
| No CRM integration | Manual follow-ups | Integration planned |

---

## 8. File Structure Reference

```
ai-sales-coach/
├── src/
│   ├── app/
│   │   ├── api/ai/
│   │   │   ├── realtime-token/route.ts
│   │   │   ├── analyze-call/route.ts
│   │   │   ├── chat/route.ts
│   │   │   └── coach/route.ts
│   │   ├── dashboard/
│   │   │   ├── practice/page.tsx
│   │   │   ├── calls/page.tsx
│   │   │   └── coach/page.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── features/practice/
│   │   │   ├── RealtimeVoiceChat.tsx
│   │   │   ├── PersonaSelector.tsx
│   │   │   └── ChatInterface.tsx
│   │   ├── layout/
│   │   │   ├── DashboardLayout.tsx
│   │   │   ├── Header.tsx
│   │   │   └── Sidebar.tsx
│   │   └── ui/ (shadcn components)
│   ├── hooks/
│   │   ├── useRealtimeVoice.ts
│   │   ├── useAudioPractice.ts
│   │   └── useCredits.ts
│   └── lib/
│       └── ai/attachments.ts
├── docs/
│   ├── PRD_CURRENT.md (this file)
│   └── PRD_ROADMAP.md
└── PRODUCT_ROADMAP.md
```

---

## 9. Appendix

### 9.1 API Endpoints Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/ai/realtime-token` | POST | Generate ephemeral token for voice |
| `/api/ai/analyze-call` | POST | Upload and analyze call recording |
| `/api/ai/chat` | POST | Practice chat session |
| `/api/ai/coach` | POST | Text-based coaching |

### 9.2 Environment Variables Required
```
OPENAI_API_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

---

**Document Owner:** Engineering Team  
**Review Cycle:** Monthly  
**Next Review:** 2026-03-01
