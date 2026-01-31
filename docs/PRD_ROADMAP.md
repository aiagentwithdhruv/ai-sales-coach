# Product Requirements Document: AI Sales Coach (Roadmap Features)

**Version:** 1.0  
**Last Updated:** 2026-02-01  
**Status:** Planning / Proposed  

---

## 1. Executive Summary

This document outlines the features planned for AI Sales Coach beyond the current MVP. These features are prioritized based on customer value, revenue potential, and implementation complexity. The roadmap is divided into three phases: Short-term (next 2-3 months), Medium-term (3-6 months), and Long-term (6-12 months).

### Strategic Goals
1. **Increase Revenue Per Account**: Add premium features that justify higher pricing
2. **Expand to Enterprise**: Build compliance and admin features
3. **Create Sticky Workflows**: Integrate into daily sales routines (not just training)
4. **Generate AI-Ready Data**: Build training datasets for proprietary models

---

## 2. Roadmap Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         PRODUCT ROADMAP                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  PHASE 1: SHORT-TERM (0-3 months)                                      │
│  ├── Follow-up Autopilot                                               │
│  ├── Transcript Storage (opt-in)                                       │
│  └── Dashboard Analytics                                               │
│                                                                         │
│  PHASE 2: MEDIUM-TERM (3-6 months)                                     │
│  ├── Company Brain Training                                            │
│  ├── Role-Play Marketplace                                             │
│  ├── Deal Momentum & Risk Engine                                       │
│  ├── Talk-Track Compliance                                             │
│  └── Quotation Generator                                               │
│                                                                         │
│  PHASE 3: LONG-TERM (6-12 months)                                      │
│  ├── AI Calling Agent (Outbound + Inbound)                             │
│  ├── CRM Integrations (Salesforce, HubSpot)                            │
│  ├── Multilingual Training                                             │
│  └── Team Analytics & Leaderboards                                     │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Phase 1: Short-Term Features

### 3.1 Follow-up Autopilot

**Priority:** P0 (High Revenue Impact)  
**Effort:** Large  
**Dependencies:** Call Analyzer, Email integration  

#### Problem Statement
Sales reps spend 2-3 hours daily writing follow-up emails. Many deals go cold because follow-ups are delayed or generic. Managers can't ensure consistent messaging.

#### Solution
AI-generated, context-aware follow-up emails that can be auto-sent or queued for approval.

#### User Stories
- As a sales rep, I want follow-up emails auto-generated after a call so I save time.
- As a sales rep, I want the follow-up to reference specific points from the call so it feels personal.
- As a sales manager, I want to review follow-ups before sending so I ensure quality.
- As a sales rep, I want to schedule follow-ups for optimal times so I get better response rates.

#### Functional Requirements

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| FA-01 | Generate follow-up from call transcript | P0 | Core feature |
| FA-02 | Include specific call references | P0 | "You mentioned X..." |
| FA-03 | Multi-channel: Email, LinkedIn | P1 | Start with email |
| FA-04 | Queue for approval (manager review) | P0 | Enterprise need |
| FA-05 | Auto-send with delay | P1 | With safeguards |
| FA-06 | Template library | P2 | Customizable |
| FA-07 | Tone selection (formal/casual) | P2 | User preference |
| FA-08 | CRM task creation | P2 | Integration needed |

#### Technical Approach
```
New Files:
├── src/app/dashboard/follow-ups/page.tsx     # Follow-up queue UI
├── src/app/api/ai/generate-followup/route.ts # Generation API
├── src/components/features/followup/
│   ├── FollowupEditor.tsx                    # Edit before send
│   ├── FollowupQueue.tsx                     # Pending queue
│   └── FollowupHistory.tsx                   # Sent history
└── src/lib/email/
    ├── sendgrid.ts                           # Email provider
    └── templates.ts                          # Email templates
```

#### API Design
```typescript
// POST /api/ai/generate-followup
{
  callTranscript: string,
  callSummary: string,
  recipientName: string,
  recipientEmail: string,
  companyContext?: string,
  tone?: "formal" | "casual" | "friendly",
  channel: "email" | "linkedin"
}

// Response
{
  subject: string,
  body: string,
  suggestedSendTime: ISO8601,
  keyPoints: string[]
}
```

#### Success Metrics
| Metric | Target |
|--------|--------|
| Follow-ups generated/user/week | 20+ |
| Time saved per follow-up | 5 min |
| Auto-send adoption | 40% |
| Response rate improvement | +15% |

---

### 3.2 Transcript Storage (Opt-in)

**Priority:** P1  
**Effort:** Medium  
**Dependencies:** Database schema, consent flow  

#### Problem Statement
Currently, call transcripts are processed and discarded. Users can't review past calls, track improvement over time, or build training datasets.

#### Solution
Optional transcript storage with explicit consent, enabling historical analysis and progress tracking.

#### User Stories
- As a sales rep, I want to save call transcripts so I can review them later.
- As a sales manager, I want to access team transcripts so I can coach effectively.
- As a user, I want to control what's stored so I maintain privacy.

#### Functional Requirements

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| TS-01 | Consent prompt before storage | P0 | Legal requirement |
| TS-02 | Store transcript with metadata | P0 | Date, duration, score |
| TS-03 | Call history page | P0 | List all stored calls |
| TS-04 | Search transcripts | P1 | Keyword search |
| TS-05 | Delete individual transcripts | P0 | User control |
| TS-06 | Bulk export | P2 | Data portability |
| TS-07 | Retention policy (auto-delete) | P1 | 90 days default |

#### Database Schema
```sql
CREATE TABLE call_transcripts (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  created_at TIMESTAMP,
  duration_seconds INT,
  transcript TEXT,
  analysis JSONB,
  score INT,
  contact_name TEXT,
  company_name TEXT,
  deleted_at TIMESTAMP -- soft delete
);

CREATE INDEX idx_transcripts_user ON call_transcripts(user_id);
CREATE INDEX idx_transcripts_created ON call_transcripts(created_at);
```

---

### 3.3 Dashboard Analytics

**Priority:** P1  
**Effort:** Medium  
**Dependencies:** Transcript storage  

#### Problem Statement
Users have no visibility into their improvement over time. Managers can't identify team-wide skill gaps.

#### Solution
Analytics dashboard showing trends, skill breakdowns, and improvement recommendations.

#### Functional Requirements

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| DA-01 | Practice session count (daily/weekly) | P0 | Engagement |
| DA-02 | Score trend over time | P0 | Line chart |
| DA-03 | Skill breakdown (radar chart) | P1 | Discovery, objection, etc. |
| DA-04 | Improvement areas (AI-generated) | P1 | Personalized |
| DA-05 | Team view (manager only) | P2 | Compare reps |
| DA-06 | Export reports | P2 | PDF/CSV |

#### Wireframe
```
┌──────────────────────────────────────────────────────────────┐
│  DASHBOARD                                                    │
├──────────────────────────────────────────────────────────────┤
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐          │
│  │ Sessions     │ │ Avg Score    │ │ Streak       │          │
│  │    47        │ │    78        │ │  12 days     │          │
│  └──────────────┘ └──────────────┘ └──────────────┘          │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  SCORE TREND (Last 30 days)                             │ │
│  │  📈 [Line chart showing improvement]                     │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌───────────────────────┐ ┌────────────────────────────────┐│
│  │  SKILL BREAKDOWN      │ │ TOP IMPROVEMENTS               ││
│  │  [Radar chart]        │ │ • Handle pricing objections    ││
│  │                       │ │ • Ask more discovery questions ││
│  │                       │ │ • Confirm next steps clearly   ││
│  └───────────────────────┘ └────────────────────────────────┘│
└──────────────────────────────────────────────────────────────┘
```

---

## 4. Phase 2: Medium-Term Features

### 4.1 Company Brain Training

**Priority:** P0 (Enterprise)  
**Effort:** Large  
**Dependencies:** Document processing, vector database  

#### Problem Statement
When products change, pricing updates, or new messaging is released, reps take weeks to internalize. There's no consistent way to train on company-specific knowledge.

#### Solution
Upload company materials (docs, PDFs, wikis) and auto-generate training drills, updated talk tracks, and quiz questions.

#### User Stories
- As an enablement lead, I want to upload new product docs and have training auto-generated.
- As a sales rep, I want to practice with questions about our latest features.
- As a manager, I want to verify reps completed training on new materials.

#### Functional Requirements

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| CB-01 | Upload documents (PDF, DOCX, URL) | P0 | Multiple formats |
| CB-02 | Auto-generate training Q&A | P0 | From content |
| CB-03 | Quiz mode (test knowledge) | P1 | Score tracking |
| CB-04 | Talk track extraction | P1 | Key phrases |
| CB-05 | Update notifications | P2 | "New content added" |
| CB-06 | Version tracking | P2 | What changed |

#### Technical Approach
```
New Files:
├── src/app/dashboard/knowledge/page.tsx      # Knowledge base UI
├── src/app/api/ai/process-document/route.ts  # Document ingestion
├── src/lib/vectordb/
│   ├── pinecone.ts                           # Vector storage
│   └── embeddings.ts                         # Generate embeddings
└── src/components/features/knowledge/
    ├── DocumentUploader.tsx
    ├── TrainingDrill.tsx
    └── QuizMode.tsx
```

---

### 4.2 Role-Play Marketplace

**Priority:** P1  
**Effort:** Medium  
**Dependencies:** None (extension of personas)  

#### Problem Statement
Current personas are generic. Reps selling to healthcare need healthcare-specific buyers. Reps selling to finance need finance-specific objections.

#### Solution
Pre-built industry-specific personas with realistic behaviors, objections, and terminology.

#### Persona Categories
| Industry | Personas | Key Characteristics |
|----------|----------|---------------------|
| SaaS | VP Sales, RevOps, IT | Integration concerns, ROI focus |
| Healthcare | CISO, CMO, Compliance | HIPAA, security, patient data |
| Finance | CFO, Risk Officer | Regulatory, audit trails |
| Manufacturing | Ops Director, Plant Manager | Downtime, training time |
| Retail | Category Manager, Store Ops | Seasonality, margins |
| Enterprise | Procurement, Legal | Vendor approval, contracts |

#### Monetization
- Free: 3 basic personas
- Pro: 15 personas
- Enterprise: All personas + custom creation

---

### 4.3 Deal Momentum & Risk Engine

**Priority:** P0 (High Value)  
**Effort:** Large  
**Dependencies:** CRM integration, transcript storage  

#### Problem Statement
Deals stall without clear signals. Managers only learn about problems in weekly pipeline reviews. By then, it's often too late.

#### Solution
AI analyzes deal progress across calls and emails to detect risks, missing stakeholders, weak next steps, and stalled momentum.

#### Risk Signals Detected
| Signal | Indicator | Action |
|--------|-----------|--------|
| No follow-up | 7+ days since last contact | Alert rep |
| Missing stakeholder | Decision maker not mentioned | Coach to multi-thread |
| Vague next steps | "Let's touch base" language | Suggest concrete next step |
| Price objection unresolved | Raised but not addressed | Provide objection script |
| Competitor mentioned | Named competitor in call | Competitive positioning |
| Champion gone dark | Key contact unresponsive | Suggest re-engagement |

#### Functional Requirements

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| DM-01 | Deal health score | P0 | 1-100 based on signals |
| DM-02 | Risk alerts (push notification) | P0 | Timely intervention |
| DM-03 | Coaching suggestions | P1 | What to do next |
| DM-04 | Stakeholder map | P1 | Who's involved |
| DM-05 | Activity timeline | P1 | Visual history |
| DM-06 | CRM sync | P0 | Salesforce/HubSpot |

---

### 4.4 Talk-Track Compliance

**Priority:** P1 (Regulated Industries)  
**Effort:** Medium  
**Dependencies:** Transcript storage  

#### Problem Statement
In regulated industries (finance, healthcare, insurance), reps must use approved language. Compliance violations can result in fines. Current training doesn't catch real-world deviations.

#### Solution
AI monitors call transcripts for compliance issues: unapproved claims, missing disclosures, risky language.

#### Compliance Categories
| Category | Examples | Severity |
|----------|----------|----------|
| Unapproved claims | "Guaranteed results" | High |
| Missing disclosures | No risk statement | High |
| Competitor disparagement | Negative competitor claims | Medium |
| Pricing inaccuracies | Wrong numbers quoted | High |
| Off-script messaging | Unapproved features | Medium |

#### Functional Requirements

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| TC-01 | Define approved talk tracks | P0 | Admin uploads |
| TC-02 | Flag compliance violations | P0 | Real-time or post-call |
| TC-03 | Severity levels | P1 | High/Medium/Low |
| TC-04 | Remediation suggestions | P1 | What to say instead |
| TC-05 | Compliance report | P1 | For legal/compliance |
| TC-06 | Manager alerts | P2 | Immediate escalation |

---

### 4.5 Quotation Generator

**Priority:** P2  
**Effort:** Medium  
**Dependencies:** Company Brain  

#### Problem Statement
Creating proposals is time-consuming. Reps copy/paste from old proposals, leading to errors and inconsistent branding.

#### Solution
AI-generated proposals using approved templates, pricing data, and call context.

#### Functional Requirements

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| QG-01 | Template library | P0 | Admin-managed |
| QG-02 | Auto-fill from call context | P1 | What was discussed |
| QG-03 | Pricing table integration | P1 | Pull approved prices |
| QG-04 | PDF export | P0 | Branded output |
| QG-05 | E-signature integration | P2 | DocuSign/PandaDoc |
| QG-06 | Version tracking | P2 | Quote history |

---

## 5. Phase 3: Long-Term Features

### 5.1 AI Calling Agent (Outbound + Inbound)

**Priority:** P0 (High Demand, High Complexity)  
**Effort:** Very Large  
**Dependencies:** Telephony integration, compliance framework  

#### Problem Statement

**Outbound:**
SDRs spend hours dialing unqualified leads. Companies want to scale outreach without scaling headcount. AI can qualify and book meetings automatically.

**Inbound:**
Companies miss calls, lose leads to voicemail, and overwhelm SDRs with unqualified inquiries. Reps lack context when calls are transferred. After-hours calls go unanswered.

#### Solution

**Two-way AI Calling Platform:**
- **Outbound**: AI calls lead lists, qualifies prospects, handles objections, books meetings, updates CRM
- **Inbound**: AI answers incoming calls 24/7, qualifies callers, routes appropriately, books meetings, provides reps with full context

#### Outbound Capabilities
| Stage | AI Capability |
|-------|---------------|
| Dial | Initiate outbound call |
| Qualify | Ask qualifying questions |
| Handle objections | Respond to "not interested" |
| Book meeting | Check availability, send invite |
| Update CRM | Log call outcome, notes |
| Handoff | Transfer to human if needed |

#### Inbound Capabilities
| Stage | AI Capability |
|-------|---------------|
| Answer | Instant pickup, no wait time |
| Greet | Professional AI disclosure greeting |
| Identify Intent | Sales, support, billing, general |
| Qualify | Ask qualifying questions for sales leads |
| Answer FAQs | Product info, pricing, basic questions |
| Book | Schedule meetings with calendar integration |
| Route | Transfer to appropriate team/rep |
| Summarize | Send call summary to rep before transfer |

#### Inbound Value Proposition
| Problem | AI Solution | Impact |
|---------|-------------|--------|
| Missed calls | AI answers 24/7 | 0% missed calls |
| Long wait times | Instant pickup | Better CSAT |
| Unqualified transfers | AI pre-qualifies | 40%+ rep time saved |
| No context on handoff | AI sends summary | Faster close rates |
| After-hours dead zone | AI books meetings | Capture night/weekend leads |
| Peak hour overflow | AI scales instantly | No dropped calls |

#### Compliance Considerations
| Region | Requirement |
|--------|-------------|
| US | TCPA consent, Do Not Call registry |
| EU | GDPR, AI disclosure |
| India | TRAI regulations |
| All | "This is an AI" disclosure (outbound + inbound) |

#### Technical Stack
- Telephony: Twilio Voice / Vonage
- STT: Whisper / Deepgram
- TTS: OpenAI TTS / ElevenLabs
- Scheduling: Cal.com / Calendly API
- CRM: Salesforce / HubSpot API

#### Functional Requirements — Outbound

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| ACO-01 | Upload lead list (CSV) | P0 | Start simple |
| ACO-02 | Define calling script | P0 | With branches |
| ACO-03 | Place outbound calls | P0 | Core feature |
| ACO-04 | Qualify with questions | P0 | Configurable |
| ACO-05 | Book meetings | P1 | Calendar integration |
| ACO-06 | CRM update | P1 | Auto-log |
| ACO-07 | Human handoff | P1 | Transfer to live agent |
| ACO-08 | Call recording + transcript | P0 | Compliance |
| ACO-09 | Do Not Call compliance | P0 | Required |
| ACO-10 | AI disclosure | P0 | Legal requirement |

#### Functional Requirements — Inbound

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| ACI-01 | Provision phone numbers | P0 | Toll-free + local |
| ACI-02 | Forward existing numbers | P0 | Use current number |
| ACI-03 | 24/7 instant answer | P0 | No missed calls |
| ACI-04 | AI disclosure greeting | P0 | Legal requirement |
| ACI-05 | Intent detection | P0 | Sales/support/billing |
| ACI-06 | Qualification questions | P0 | Configurable per intent |
| ACI-07 | FAQ handling | P1 | Answer common questions |
| ACI-08 | Meeting booking | P0 | Calendar integration |
| ACI-09 | Live transfer to rep | P0 | Round-robin or direct |
| ACI-10 | Call summary to rep | P0 | Before/during transfer |
| ACI-11 | After-hours handling | P1 | Book for next day |
| ACI-12 | Routing rules | P1 | By intent, time, availability |
| ACI-13 | Real-time dashboard | P1 | Live call monitoring |
| ACI-14 | Listen/takeover mode | P2 | Manager intervention |

#### Success Metrics

| Metric | Outbound Target | Inbound Target |
|--------|-----------------|----------------|
| Connect/Answer rate | > 25% | 100% |
| Meeting book rate | > 15% | > 15% |
| Qualification rate | > 40% | > 35% |
| Avg call duration | 2-4 min | 3-5 min |
| Compliance rate | 100% | 100% |
| Cost per meeting | < $10 | < $5 |
| Rep time saved | N/A | > 40% |

#### Monetization
- Per-call pricing ($0.05-0.15/call for outbound, $0.03-0.10/call for inbound)
- Meeting booked bonus ($1-5/meeting)
- Monthly line fee for inbound ($15-50/line)
- Enterprise: Unlimited calls, flat fee

---

### 5.2 CRM Integrations

**Priority:** P1  
**Effort:** Medium per integration  
**Dependencies:** OAuth flows  

#### Integrations Planned
| CRM | Priority | Notes |
|-----|----------|-------|
| Salesforce | P0 | Most enterprise |
| HubSpot | P0 | Most mid-market |
| Pipedrive | P2 | SMB |
| Zoho | P2 | International |

#### Sync Capabilities
| Data | Direction | Use Case |
|------|-----------|----------|
| Contacts | CRM → App | Know who you're practicing with |
| Call logs | App → CRM | Auto-log practice sessions |
| Deal stage | CRM → App | Context for coaching |
| Follow-ups | App → CRM | Create tasks |
| Scores | App → CRM | Custom field |

---

### 5.3 Multilingual Training

**Priority:** P1 (Global Expansion)  
**Effort:** Large  
**Dependencies:** Multilingual models  

#### Languages Planned
| Phase | Languages |
|-------|-----------|
| Phase 1 | English, Spanish, French, German |
| Phase 2 | Portuguese, Italian, Dutch, Japanese |
| Phase 3 | Hindi, Mandarin, Arabic, Korean |

#### Considerations
- Cultural context in personas (not just translation)
- Local objection patterns
- Regional pricing norms
- Accent/dialect support

---

### 5.4 Team Analytics & Leaderboards

**Priority:** P2  
**Effort:** Medium  
**Dependencies:** Transcript storage, multi-user accounts  

#### Features
| Feature | Description |
|---------|-------------|
| Team dashboard | Manager view of all reps |
| Leaderboard | Gamified competition |
| Skill gaps | Team-wide weak areas |
| Coaching priorities | AI-suggested focus areas |
| Progress reports | Weekly email summaries |

---

## 6. Prioritization Framework

### 6.1 Scoring Criteria
| Criterion | Weight | Description |
|-----------|--------|-------------|
| Revenue Impact | 30% | Will customers pay for this? |
| Retention Impact | 25% | Will this reduce churn? |
| Effort | 20% | Engineering time required |
| Strategic Fit | 15% | Aligns with vision? |
| Competitive | 10% | Do competitors have this? |

### 6.2 Priority Matrix
| Feature | Revenue | Retention | Effort | Strategic | Competitive | Score |
|---------|---------|-----------|--------|-----------|-------------|-------|
| Follow-up Autopilot | 9 | 8 | 7 | 9 | 7 | 8.2 |
| AI Calling Agent | 10 | 7 | 4 | 9 | 9 | 7.8 |
| Deal Risk Engine | 8 | 9 | 6 | 8 | 8 | 7.9 |
| Company Brain | 7 | 8 | 6 | 9 | 6 | 7.3 |
| Talk-Track Compliance | 7 | 7 | 7 | 7 | 5 | 6.7 |
| Quotation Generator | 6 | 5 | 7 | 6 | 4 | 5.7 |

---

## 7. Go-to-Market Considerations

### 7.1 Pricing Tiers (Proposed)
| Tier | Price/user/mo | Features |
|------|---------------|----------|
| Starter | $29 | Practice, 10 analyses/mo |
| Pro | $79 | All analysis, follow-ups, company brain |
| Enterprise | $149+ | Compliance, CRM, team analytics, AI calling |

### 7.2 Target Verticals
| Vertical | Key Features | Willingness to Pay |
|----------|--------------|-------------------|
| SaaS Sales | All core features | High |
| Financial Services | Compliance, risk | Very High |
| Healthcare Sales | HIPAA compliance | High |
| Real Estate | Scripts, follow-ups | Medium |
| Insurance | Compliance, scripts | High |

### 7.3 Competitive Positioning
| Competitor | Their Focus | Our Differentiation |
|------------|-------------|---------------------|
| Gong | Recording + analytics | Real-time coaching, practice |
| Chorus | Call recording | Interactive training |
| Lavender | Email only | Voice + email |
| Second Nature | Practice | Better context, follow-ups |

---

## 8. Technical Architecture (Future State)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         ARCHITECTURE (Target)                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐                   │
│  │   Next.js   │   │   Vercel    │   │  Supabase   │                   │
│  │   Frontend  │   │   Hosting   │   │  Auth + DB  │                   │
│  └──────┬──────┘   └─────────────┘   └──────┬──────┘                   │
│         │                                    │                          │
│         ▼                                    ▼                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                        API Layer (Next.js Routes)               │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│         │              │              │              │                  │
│         ▼              ▼              ▼              ▼                  │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐           │
│  │  OpenAI   │  │  Twilio   │  │ SendGrid  │  │ Pinecone  │           │
│  │ Realtime  │  │  Voice    │  │  Email    │  │  Vector   │           │
│  └───────────┘  └───────────┘  └───────────┘  └───────────┘           │
│         │              │              │              │                  │
│         ▼              ▼              ▼              ▼                  │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                   CRM Integrations (Salesforce, HubSpot)        │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 9. Success Metrics (Target State)

| Metric | 3 Months | 6 Months | 12 Months |
|--------|----------|----------|-----------|
| Monthly Active Users | 500 | 2,000 | 10,000 |
| Paying Customers | 50 | 200 | 1,000 |
| MRR | $5,000 | $30,000 | $150,000 |
| NPS | 40+ | 50+ | 60+ |
| Feature Adoption (Follow-ups) | 30% | 50% | 70% |
| Enterprise Customers | 2 | 10 | 50 |

---

## 10. Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| OpenAI API cost increase | Medium | High | Multi-model support, caching |
| Compliance issues (AI calling) | High | Very High | Legal review, per-country rollout |
| Low adoption of follow-ups | Medium | Medium | Better onboarding, templates |
| CRM integration complexity | Medium | Medium | Start with 2, expand |
| Enterprise security requirements | High | High | SOC2, SSO early investment |

---

## 11. Open Questions

1. **AI Calling**: Partner with telephony vendor or build in-house?
2. **Pricing**: Per-seat vs. usage-based for AI calling?
3. **Storage**: Which regions need data residency compliance?
4. **Multilingual**: Hire in-house linguists or use AI translation?
5. **Enterprise**: Minimum contract size for custom personas?

---

**Document Owner:** Product Team  
**Review Cycle:** Monthly  
**Next Review:** 2026-03-01  
**Stakeholders:** Engineering, Sales, Marketing, Legal
