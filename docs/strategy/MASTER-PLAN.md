# QuotaHit — Autonomous AI Sales Department
## Master Plan v1.0 | Feb 25, 2026
## Co-Founders: Dhruv + Claude (AI)

> "The operating system for autonomous revenue generation."
> "Your AI team that sells while you sleep."

---

## THE PIVOT

**Old QuotaHit:** AI Sales Coach — practice selling with AI ($79-249/mo)
**New QuotaHit:** AI Sales Department — finds leads, qualifies, reaches out, follows up, demos, closes, invoices, onboards. Autonomously.

**Why now:**
- Per-seat SaaS is dying (Salesforce stock down, AI agents replacing humans)
- 11x.ai charges $800-1,500/mo for prospecting ONLY
- Artisan charges $2,000/mo for outreach ONLY
- NOBODY does end-to-end: lead → qualify → outreach → follow-up → demo → close → invoice → onboard
- We already have 70-80% of the infrastructure built
- Claude Code lets us build in hours what others take weeks

---

## WHAT WE ALREADY HAVE (Asset Inventory)

| Asset | Status | Reuse Value |
|-------|--------|-------------|
| CRM (contacts, pipeline, deals, activities) | Live | HIGH — core of everything |
| AI Enrichment (Perplexity Sonar) | Live | HIGH — enriches leads instantly |
| AI Calling (Twilio + ElevenLabs + Deepgram) | Live | HIGH — autonomous cold calling |
| Agent Builder (custom AI agents) | Live | HIGH — build qualification/closer agents |
| Sales Agent Sarah (chat widget, Grok 4.1) | Live | HIGH — website lead capture |
| Voice Practice (OpenAI Realtime API) | Live | MEDIUM — becomes training module |
| Call Analyzer (Whisper + scoring) | Live | MEDIUM — analyze real sales calls |
| Stripe (checkout, portal, webhooks) | Built, gated | HIGH — payments ready to go |
| Email (Resend, templates) | Partial | MEDIUM — needs Gmail/Outlook sync |
| n8n Automations (3 workflows) | Live | HIGH — automation backbone |
| Daily Blog Engine (60 topics, SEO) | Live | MEDIUM — organic traffic |
| Team Management + Leaderboards | Live | MEDIUM — for hybrid mode |
| BYOAPI Key Management (AES-256-GCM) | Live | HIGH — multi-provider AI |
| 25+ AI Models (OpenAI, Anthropic, OpenRouter) | Live | HIGH — best model for each task |
| Supabase (PostgreSQL + Auth + RLS) | Live | HIGH — database ready |
| Vercel (auto-deploy, serverless) | Live | HIGH — zero-DevOps hosting |

**Bottom line: We're not starting from scratch. We're adding a brain to a body that already exists.**

---

## VOICE-FIRST UX (Every Text Field = Mic Button)

### Core Principle
> Users don't type. Users don't dictate. Users INSTRUCT. AI does the rest.

### The 3 Levels of Voice (We build ALL THREE)

```
LEVEL 1: VOICE-AS-TYPING (Basic — every text field)
"John Smith, Acme Corp, VP Sales" → fills form fields
Cost: $0 (Web Speech API)

LEVEL 2: VOICE-AS-INSTRUCTION (Smart — AI acts on commands)
"Send a follow-up to Sarah about the pricing we discussed"
→ AI already KNOWS Sarah (CRM context)
→ AI already KNOWS the pricing discussion (call notes)
→ AI WRITES the entire email
→ User just says "send" or edits
Cost: ~$0.001 per instruction (LLM call)

LEVEL 3: VOICE-AS-ORCHESTRATION (Autonomous — AI chains actions)
"I just got off a great call with Mike from TechCorp"
→ AI asks: "Want me to log the notes?"
→ AI transcribes, extracts BANT, sentiment, competitor intel
→ AI auto-updates CRM (stage, budget, next steps)
→ AI auto-drafts follow-up email
→ AI auto-schedules next touchpoint
→ ALL from one voice input
Cost: ~$0.005 per orchestration
```

### Why This Matters
- 80% of businesses integrating voice AI in 2026 (industry research)
- Sales people are always on the move — can't type while driving
- Voice-first CRM is a 2026-2027 category creation opportunity
- Salesforce Agentforce Voice just launched — validates the market
- We can do it BETTER because we're AI-native (not bolting voice onto legacy CRM)

### Implementation: 3-Tier Voice Stack (Cost-Optimized)

```
Tier 1: Web Speech API (FREE — default)
├── Built into Chrome, Edge, Safari
├── Real-time streaming transcription
├── No API calls, no cost, no latency
├── Works for: all text inputs, search, notes
├── Limitation: Browser-dependent, English best
│
Tier 2: Deepgram Nova-2 ($0.0043/min — fallback)
├── For browsers without Web Speech API
├── Real-time streaming via WebSocket
├── Better accuracy than Web Speech
├── Works for: mobile, Firefox, complex dictation
│
Tier 3: Whisper (already integrated, $0.006/min — premium)
├── For long-form content (proposals, reports, emails)
├── Best accuracy across languages
├── Batch processing (not real-time)
├── Works for: dictating proposals, detailed notes
```

**Cost impact:** ~$0/month for 95% of usage (Web Speech API is free). Deepgram/Whisper only for edge cases.

### Voice-as-Instruction Examples (Level 2 — The Game Changer)

**Email:**
```
User says: "Send a follow-up to Sarah about the pricing we discussed last week"

AI knows (from CRM context):
├── Sarah = Sarah Johnson, CTO at TechCorp
├── Last call: Feb 20, discussed $50K annual plan
├── Objection: "Too expensive compared to current solution"
├── Deal stage: Negotiation

AI generates:
Subject: "Following up on our pricing conversation, Sarah"
Body: Personalized email referencing the $50K plan, addressing
      the cost objection with ROI data, suggesting a 15-min call.

User: "Looks good, send it" → Sent. Logged in CRM. Next follow-up scheduled.
```

**CRM Update:**
```
User says: "Just finished the Acme call. Mike's interested but needs board approval.
Budget is 100K. They're also looking at Salesforce. Follow up in 2 weeks."

AI extracts AND ACTS:
├── Contact: Mike @ Acme Corp → found in CRM
├── Sentiment: Positive → logged
├── Stage: Qualified → Negotiation → CRM updated
├── Budget: $100,000 → deal value updated
├── Authority: Board approval needed → flagged as multi-stakeholder
├── Competition: Salesforce → competitor field updated
├── Next action: Follow up Feb 11 → task created, reminder set
├── Activity: Call logged with structured notes
ALL AUTOMATIC. Zero clicks.
```

**Search & Navigate:**
```
User says: "Show me all qualified leads from last week that haven't been contacted"
→ AI runs CRM query → shows filtered dashboard
→ User: "Start outreach sequence on the top 5"
→ AI launches sequences → confirms
```

**Agent Configuration:**
```
User says: "Create a new outreach agent for real estate companies.
It should be friendly, focus on lead response time pain point,
and book demos on my calendar."
→ AI creates agent loadout with system prompt, qualification criteria,
  calendar integration, and deploys it
```

### Technical Implementation

```typescript
// Universal VoiceInput component — drops into ANY text field
// But with INSTRUCTION MODE — not just transcription
<VoiceInput
  onTranscript={(text) => setFieldValue(text)}        // Level 1: basic transcription
  onInstruction={(intent) => executeAction(intent)}    // Level 2: AI interprets + acts
  onOrchestration={(chain) => runAgentChain(chain)}   // Level 3: multi-step AI actions
  mode="instruction"            // "transcribe" | "instruction" | "orchestration"
  provider="auto"               // Web Speech → Deepgram → Whisper (auto-fallback)
  language="auto"               // auto-detect language
  crmContext={currentContact}    // passes CRM context so AI knows who you're talking about
  dealContext={currentDeal}      // passes deal context for intelligent actions
  confirmBeforeAction={true}    // shows preview before executing (safety)
/>

// One component. Three modes. Every text field. Done.
```

### Safety: Confirm Before Destructive Actions
```
Voice: "Delete the Acme deal"
AI: "I'll delete the Acme Corp deal ($100K, Negotiation stage).
     This cannot be undone. Confirm?" [Yes / No]

Voice: "Send proposal to all qualified leads"
AI: "I'll send the standard proposal to 23 qualified leads.
     Want to preview one first?" [Preview / Send All / Cancel]
```

### Build Plan
- **Phase 1 add-on (2-3 hrs):** Universal `VoiceInput` component with Level 1 (transcription) + Level 2 (instruction mode)
- **Phase 2 add-on (1 hr):** Add Deepgram WebSocket fallback
- **Phase 3 add-on (2 hrs):** Level 3 orchestration (voice → multi-step agent chains)
- **Phase 5 add-on (2 hrs):** Voice-to-structured-data with full CRM context

**Total additional time: ~7 hours across all phases. Not a separate phase — woven into every phase.**

---

## THE 7 AI AGENTS

| # | Agent Name | Job | Channels | When It Acts |
|---|-----------|-----|----------|-------------|
| 1 | **Scout** | Find leads matching ICP | LinkedIn, Apollo, Web, Imports | Always running 24/7 |
| 2 | **Researcher** | Enrich + score leads | Perplexity, LinkedIn, Websites | When Scout finds a lead |
| 3 | **Qualifier** | Pre-qualify via conversation | Email, WhatsApp, Chat, Call | When score > threshold |
| 4 | **Outreach** | Multi-channel sequences | Email, LinkedIn, WhatsApp, Cold Call | For warm qualified leads |
| 5 | **Closer** | Handle objections, negotiate, close | Call, Email, Chat | When buying intent detected |
| 6 | **Demo** | Give product demos (Future Phase) | Video, Screen share, Chat | When prospect requests demo |
| 7 | **Ops** | Invoice, payment, onboard | Stripe, Email, WhatsApp | When deal closed |

**Orchestrator (The Brain):** Routes leads between agents, decides next best action, learns from outcomes.

---

## THE QUALIFICATION ENGINE (Detailed)

### Stage 1: FIT SCORING (Instant, zero contact with lead)

AI enriches automatically on entry:
- Company: size, industry, revenue, funding, growth signals
- Contact: role/title, decision-making authority, LinkedIn activity
- Tech: current tools, stack compatibility, spend indicators
- Geography: timezone, region, language
- Intent: website visits, content downloads, search behavior

**Scoring weights (AI-calibrated, self-adjusting):**
| Signal | Weight | Example |
|--------|--------|---------|
| ICP industry match | 20 pts | SaaS company = +20 |
| Company size fit | 15 pts | 10-500 employees = +15 |
| Decision maker role | 15 pts | VP Sales, CRO, CEO = +15 |
| Budget signals | 15 pts | Recently funded = +15 |
| Tech stack fit | 10 pts | Uses Salesforce = +10 |
| Growth signals | 10 pts | Hiring sales reps = +10 |
| Geography fit | 5 pts | US/EU timezone = +5 |
| Intent signals | 10 pts | Visited pricing page = +10 |

**Routing:**
- 70+ → HOT → Fast-track to Stage 3 (skip outreach, they're ready)
- 40-69 → WARM → Stage 2 (engage and nurture)
- <40 → COLD → Monthly drip list (low-effort nurture)

### Stage 2: ENGAGEMENT (AI multi-channel outreach)

AI WRITES ITS OWN templates. No human creates anything.

**Channel priority (AI decides based on data):**
1. Email first (lowest friction, highest scale)
2. LinkedIn second (if professional context matches)
3. WhatsApp third (if phone available + region allows)
4. Cold call fourth (high-value leads only)

**Engagement scoring (additive):**
| Action | Score Change |
|--------|-------------|
| Email opened | +5 |
| Link clicked | +15 |
| Website visited | +20 |
| Replied (positive) | +30 → Jump to Stage 3 |
| Replied (negative) | Mark not interested |
| No response after 3 touches | Try different channel |
| Attended webinar | +25 |
| Downloaded resource | +20 |

**Self-improving:** AI tracks which subject lines, templates, and send times get best response rates. Auto-kills underperformers. Auto-generates new variants. No human touches email copy ever.

### Stage 3: QUALIFICATION (AI BANT+ Conversation)

AI has a natural conversation (NOT a survey) via the prospect's preferred channel:

**BANT+ Framework:**
- **B**udget: "What's your current investment in sales tools?"
- **A**uthority: "Who else would be involved in a decision like this?"
- **N**eed: "What's the biggest challenge your sales team faces?"
- **T**imeline: "When are you looking to make a change?"
- **C**ompetition: "Have you looked at other solutions?"

**AI conversation style:**
- Natural, helpful, not pushy
- Answers prospect's questions too (from product knowledge base)
- Adapts tone to prospect's communication style
- Knows when to push and when to back off
- Can handle objections in real-time

**Output:** Qualification verdict:
- QUALIFIED → Route to Stage 4
- NURTURE → Not ready, keep warm (2-week follow-up cycle)
- DISQUALIFIED → Wrong fit, archive with reason

### Stage 4: ROUTING (Smart Assignment)

**Three modes (customer configures which they want):**

**MODE A — Full Autonomous (Default)**
For: Solo founders, small teams, agencies without sales reps
- AI Closer agent takes over
- Handles remaining objections
- Generates and sends proposal
- Sends payment link (Stripe)
- Collects payment
- Auto-onboards client
- ZERO human touches

**MODE B — Hybrid (Sales Team)**
For: Companies with existing sales reps who do demos/closing
- AI picks best-fit rep based on:
  - Territory/region match
  - Industry expertise
  - Current capacity (not overloaded)
  - Historical win rate with similar deals
  - Language/timezone match
- AI prepares rep with full brief:
  - Lead summary (who, company, pain, budget)
  - Suggested talking points
  - Competitor intel
  - Objections to expect
  - Recommended pricing
- Rep notified via: WhatsApp + Email + CRM alert
- Rep does demo/call
- AI handles post-sale (invoice, onboard)

**MODE C — Self-Service**
For: Leads with very high intent (pricing page + payment page visits)
- AI detects buying intent
- Skips demo entirely
- Sends direct payment link
- Auto-onboards after payment

---

## MCP ARCHITECTURE

### QuotaHit MCP Server (We build this)

```
Resources (read data):
├── contacts://list          — List all contacts with filters
├── contacts://get/{id}      — Get single contact details
├── contacts://enrichment    — Get enrichment data
├── deals://pipeline         — Current pipeline status
├── deals://forecast         — Revenue forecast
├── agents://list            — List all AI agents
├── agents://stats           — Agent performance stats
├── campaigns://active       — Active outreach campaigns
├── campaigns://results      — Campaign performance
├── calls://history          — Call history and recordings
├── calls://transcripts      — Call transcriptions
├── analytics://dashboard    — Full dashboard data
├── analytics://leaderboard  — Team leaderboard
├── qualification://queue    — Leads waiting for qualification
└── qualification://results  — Qualification outcomes

Tools (take actions):
├── create_contact()         — Add a new lead
├── enrich_lead()            — Trigger AI enrichment
├── score_lead()             — Run scoring engine
├── qualify_lead()           — Start qualification conversation
├── start_sequence()         — Launch outreach sequence
├── make_call()              — Initiate AI call
├── send_email()             — Send email from sequence
├── send_whatsapp()          — Send WhatsApp message
├── send_invoice()           — Generate and send Stripe invoice
├── book_meeting()           — Book calendar slot
├── generate_proposal()      — Create proposal document
├── assign_to_rep()          — Route lead to human rep
├── update_deal_stage()      — Move deal in pipeline
└── trigger_onboarding()     — Start post-sale onboarding

Prompts (AI reasoning):
├── qualify_lead             — BANT+ qualification prompt
├── handle_objection         — Objection handling with context
├── write_outreach           — Generate personalized outreach
├── summarize_deal           — Deal summary for rep briefing
├── score_conversation       — Score a sales conversation
└── suggest_next_action      — What should happen next?
```

### External MCP Connections (We connect TO these)
- HubSpot MCP Server (live, official)
- Salesforce MCP Server (pilot, official)
- Zoho MCP Server (live, official)
- Slack MCP Server
- Google Calendar MCP Server
- Gmail MCP Server

**Why MCP is our secret weapon:**
1. Claude/ChatGPT/Copilot users can plug QuotaHit into their AI
2. We connect to client's CRM natively (no custom integrations)
3. Any AI tool becomes a QuotaHit interface
4. Developers build on top of us → ecosystem → moat

---

## AGENT LOADOUT SYSTEM (Internal Engine + Sellable Product)

### What We Already Built (Proven, Production-Ready)

We built the Agent Loadout system for our own workspace. It's real, working, and powerful:
- **LOADOUT.md manifests** — Every agent/skill has a typed manifest with inputs, outputs, credentials, cost
- **Schema Registry** — 28 skills + 4 agents, all with typed schemas (`schemas.json`)
- **Composition Chains** — Pre-defined agent pipelines (e.g., gmaps → classify → casualize → instantly → welcome)
- **MCP Server** — 8 tools, FastMCP, stdio — control everything from Claude/Cursor/any LLM
- **CLI** — init, verify, list, schema, search, chains, doctor commands
- **Staleness Checker** — Auto-detects when skills are outdated, can auto-fix
- **Batch Updater** — Update all schemas at once

**This is NOT a concept. This is battle-tested infrastructure we use every day.**

### How Loadouts Power QuotaHit Internally

Every one of our 7 AI Agents IS a loadout:

```
quotahit-agents/
├── scout/
│   ├── LOADOUT.md          ← Manifest: inputs (ICP criteria), outputs (lead list)
│   ├── agent.config.json   ← Model, temperature, tools, channels
│   ├── prompts/            ← System prompt, scoring prompt, search queries
│   └── scripts/            ← Data connectors (LinkedIn, Apollo, web)
│
├── researcher/
│   ├── LOADOUT.md          ← Manifest: inputs (raw lead), outputs (enriched lead + score)
│   ├── agent.config.json   ← Perplexity for enrichment, scoring weights
│   ├── prompts/            ← Enrichment prompt, scoring rubric
│   └── scripts/            ← Perplexity API, LinkedIn scraper, website crawler
│
├── qualifier/
│   ├── LOADOUT.md          ← Manifest: inputs (scored lead), outputs (qualification verdict)
│   ├── agent.config.json   ← Model for BANT conversation, tone settings
│   ├── prompts/            ← BANT+ framework, objection handling
│   └── scripts/            ← Conversation engine, channel adapters
│
├── outreach/
│   ├── LOADOUT.md          ← Manifest: inputs (qualified lead), outputs (sequence started)
│   ├── agent.config.json   ← Multi-channel config, timing rules
│   ├── prompts/            ← Template generation, personalization
│   └── scripts/            ← Email sender, LinkedIn DM, WhatsApp, calling
│
├── closer/
│   ├── LOADOUT.md          ← Manifest: inputs (hot lead), outputs (deal closed/lost)
│   ├── agent.config.json   ← Negotiation style, pricing authority
│   ├── prompts/            ← Closing prompts, objection responses, negotiation
│   └── scripts/            ← Proposal generator, contract sender
│
├── demo/
│   ├── LOADOUT.md          ← Manifest: inputs (meeting booked), outputs (demo completed)
│   ├── agent.config.json   ← Demo flow, product knowledge, persona
│   ├── prompts/            ← Demo script, Q&A handling, feature highlights
│   └── scripts/            ← Screen recording, calendar, follow-up
│
├── ops/
│   ├── LOADOUT.md          ← Manifest: inputs (closed deal), outputs (onboarded client)
│   ├── agent.config.json   ← Onboarding flow, invoice template
│   ├── prompts/            ← Welcome messages, setup guides
│   └── scripts/            ← Stripe invoicing, onboarding sequences
│
└── orchestrator/
    ├── LOADOUT.md          ← Manifest: inputs (any event), outputs (routing decision)
    ├── agent.config.json   ← Routing rules, escalation policies
    ├── prompts/            ← Decision tree, priority logic
    └── chains.json         ← Composition chains (which agent calls which)
```

### Composition Chains (Pre-Built Pipelines)

```json
{
  "full-autonomous-pipeline": {
    "chain": ["scout", "researcher", "qualifier", "outreach", "closer", "ops"],
    "description": "End-to-end: find lead → close deal → onboard client",
    "mode": "A"
  },
  "hybrid-pipeline": {
    "chain": ["scout", "researcher", "qualifier", "outreach"],
    "handoff": "human_rep",
    "post_handoff": ["ops"],
    "description": "AI qualifies → human closes → AI onboards",
    "mode": "B"
  },
  "inbound-pipeline": {
    "chain": ["researcher", "qualifier"],
    "branch": {
      "high_intent": ["ops"],
      "medium_intent": ["outreach", "closer", "ops"],
      "low_intent": ["outreach"]
    },
    "description": "Inbound lead → score → route by intent level",
    "mode": "C"
  },
  "re-engagement": {
    "chain": ["researcher", "outreach"],
    "description": "Re-score cold leads → new outreach sequence",
    "trigger": "monthly"
  }
}
```

### How Customers Use Loadouts (The Product Feature)

This is where it becomes a SELLABLE feature and a MOAT:

**1. Pre-Built Agent Loadouts (We Create, They Use)**
```
QuotaHit Marketplace:
├── 🔥 SaaS Sales Agent         ← Optimized for selling software
├── 🏠 Real Estate Agent         ← Property sales, showing scheduling
├── 💼 Consulting Sales Agent    ← High-ticket service selling
├── 🏥 Healthcare Sales Agent    ← HIPAA-compliant, appointment booking
├── 📦 E-Commerce Agent          ← Product recommendations, cart recovery
├── 💰 Financial Services Agent  ← Compliance-aware, regulated selling
├── 🎓 EdTech Sales Agent        ← Course/program enrollment
└── 🔧 Agency New Biz Agent      ← Client acquisition for agencies
```

**2. Custom Agent Builder (They Create Their Own)**
```
Customer Dashboard → "Create Agent" →
├── Step 1: Choose base template OR start blank
├── Step 2: Upload knowledge base (product docs, pricing, FAQs)
├── Step 3: Set qualification criteria (their ICP definition)
├── Step 4: Configure channels (email, WhatsApp, LinkedIn, call)
├── Step 5: Set routing rules (autonomous / hybrid / self-service)
├── Step 6: Define success metrics (what counts as "closed")
├── Step 7: Deploy → Agent starts working immediately
│
└── LOADOUT.md auto-generated with full schema
    (inputs, outputs, credentials, composable-with, cost)
```

**3. Agent Loadout Marketplace (Community-Driven)**
```
Anyone can:
├── CREATE a custom agent loadout
├── TEST it with their own data
├── PUBLISH to marketplace
├── EARN revenue share (70% creator / 30% QuotaHit)
│
Examples:
├── "Cold Email Machine for SaaS" — $49/mo — by top SDR
├── "LinkedIn Outreach for Agencies" — $29/mo — by agency owner
├── "Real Estate Lead Qualifier" — $99/mo — by RE tech company
└── "Insurance Cross-Sell Agent" — $79/mo — by insurtech founder
```

**4. Loadout-as-API (MCP Exposed)**
```
Every loadout is automatically:
├── Available as MCP resource (any AI can read its config)
├── Available as MCP tool (any AI can trigger it)
├── Versionable (v1, v2, v3 — track improvements)
├── Composable (chain with other loadouts)
├── Measurable (performance stats per loadout)
└── Self-improving (outcomes feed back into prompt optimization)
```

### Why Agent Loadouts = Massive Moat

| Dimension | Impact |
|-----------|--------|
| **Network effects** | More loadouts → more value for every customer |
| **Community lock-in** | Customers invest time building loadouts → switching cost |
| **Data flywheel** | Each loadout generates outcome data → improves AI → better loadouts |
| **Marketplace revenue** | Passive income from community-created loadouts (30% cut) |
| **Vertical expansion** | Each industry loadout = new market without us building from scratch |
| **MCP ecosystem** | Loadouts work with Claude, ChatGPT, Copilot → distribution |
| **Differentiation** | Nobody else has typed, composable, self-improving agent configs |

### Revenue from Agent Loadouts

| Stream | Price | Scale |
|--------|-------|-------|
| Pre-built industry loadouts | Included in Growth+ plans | Upsell to Starter |
| Custom loadout builder | Included in Scale+ plans | Key differentiator |
| Marketplace listings | 70/30 revenue share | Passive income at scale |
| Enterprise custom loadouts | $5K-50K one-time + subscription | High-margin consulting |
| Loadout API access | $0.01 per execution | Usage-based at scale |

---

## SELF-IMPROVING AI SYSTEM

### The Learning Loop

```
Action taken (email/call/message)
    │
    ▼
Outcome tracked (replied/ignored/booked/closed/lost)
    │
    ▼
AI analyzes patterns:
├── Which templates get highest reply rates?
├── Which subject lines get opened most?
├── What time of day gets best engagement?
├── Which objection responses lead to closes?
├── Which agent tone converts better?
├── What sequence length is optimal?
    │
    ▼
AI automatically:
├── Generates new template variants
├── A/B tests variations
├── Kills underperformers (< baseline)
├── Promotes winners (> baseline)
├── Adjusts send timing
├── Updates scoring weights
├── Refines qualification questions
    │
    ▼
Better results → More data → Smarter AI → Better results
(Compound improvement. Competitors can never catch up.)
```

### What Self-Improves:
| Component | How It Improves |
|-----------|----------------|
| Email templates | Track open/reply rates, auto-generate better variants |
| Call scripts | Track meeting-booked rate, adjust tone/objections |
| Lead scoring | Track which scored leads actually close, recalibrate weights |
| Outreach timing | Track response by day/time, optimize send schedule |
| Channel selection | Track which channel works for which lead type |
| Qualification questions | Track which questions predict closes best |
| Agent prompts | A/B test prompt variations, measure conversion lift |

---

## PRICING (New Structure)

| Plan | Price | For Who | What They Get |
|------|-------|---------|--------------|
| **Starter** | $299/mo | Solo founders, freelancers | 1 AI Agent, 500 leads/mo, Email + Chat, Basic CRM, Lead Scoring, 3 pre-built loadouts |
| **Growth** | $799/mo | Small teams, agencies | 3 AI Agents, 2,000 leads/mo, All channels, AI Calling, Self-improving, Assignment (Mode B), All pre-built loadouts, Marketplace access |
| **Scale** | $1,999/mo | SMB sales teams | 7 AI Agents, 10,000 leads/mo, Everything + MCP access + Custom Loadout Builder + Marketplace publishing + Priority support |
| **Enterprise** | Custom | Large orgs | Unlimited, white-label, custom loadout development, dedicated account manager, private marketplace |

**Comparison to competitors:**
- 11x.ai: $800-1,500/mo for prospecting ONLY → We offer full pipeline at $799
- Artisan: $2,000/mo for outreach ONLY → We offer everything at $1,999
- Apollo + Instantly + Gong combined: $300-500/mo → We replace all three at $299

---

## BUILD PHASES (Revised — Claude Code Speed)

### PHASE 1: "The Qualification Machine" (Day 1-2)
*Turn the existing CRM into an autonomous qualification engine.*

| # | Build | Time | What It Does |
|---|-------|------|-------------|
| 1 | Lead Scoring Engine | 2-3 hrs | Auto-score every lead on entry (Fit Score 0-100) |
| 2 | Auto-Qualification Agent | 3-4 hrs | AI agent that has BANT+ conversations to qualify leads |
| 3 | Smart Routing / Assignment | 2-3 hrs | Route qualified leads to Mode A/B/C based on config |
| 4 | QuotaHit MCP Server | 2-3 hrs | Control entire pipeline from Claude/any AI tool |
| 5 | Activate Follow-Up Execution | 2-3 hrs | Wire up existing follow-up schema to actually send |
| 6 | Agent Loadout Structure | 1-2 hrs | Create LOADOUT.md for each of the 7 agents with typed schemas |
| 7 | Universal VoiceInput Component | 2-3 hrs | Mic on every field — Level 1 (transcribe) + Level 2 (instruct AI) |
| 8 | Inngest Integration | 2-3 hrs | Durable agent workflows that survive Vercel timeouts. Event-driven pipeline. |
| 9 | Consent + Compliance Service | 2-3 hrs | TCPA consent tracking, AI disclosure in calls, DNC enforcement, audit trail |

**Total: ~18-26 hours of building**
**Outcome: Leads auto-score, auto-qualify, auto-route. Every agent has a loadout. Voice-as-instruction. Legally compliant. Agent workflows don't timeout.**

### PHASE 2: "The Outreach Engine" (Day 3-4)
*Multi-channel outreach so AI reaches prospects everywhere.*

| # | Build | Time | What It Does |
|---|-------|------|-------------|
| 7 | AI Template Generator | 2-3 hrs | AI writes its own email/LinkedIn/WhatsApp templates |
| 8 | Multi-Channel Sequencer | 3-4 hrs | Orchestrate email → LinkedIn → WhatsApp → call sequences |
| 9 | WhatsApp Integration | 2-3 hrs | Send/receive via Gallabox (we have keys from Onsite) |
| 10 | LinkedIn Outreach | 3-4 hrs | Connection requests + personalized DMs |
| 11 | Cold Email Engine | 2-3 hrs | Instantly-style cold email at scale |

**Total: ~12-17 hours of building**
**Outcome: AI reaches out on 4 channels simultaneously, no human writes anything.**

### PHASE 3: "The Brain" (Day 5-6)
*Self-improving AI + composition chains that get smarter with every interaction.*

| # | Build | Time | What It Does |
|---|-------|------|-------------|
| 12 | Orchestrator Agent | 3-4 hrs | Routes leads between 7 agents via composition chains |
| 13 | Self-Improving Templates | 3-4 hrs | A/B test + auto-optimize all outreach |
| 14 | Feedback Loop Pipeline | 2-3 hrs | Outcomes feed back into scoring + agent improvement |
| 15 | Autonomous Cold Calling | 3-4 hrs | Existing Twilio infra → fully autonomous outbound |
| 16 | Loadout Composition Engine | 2-3 hrs | Chain agents together dynamically (full-auto, hybrid, inbound, re-engage) |
| 17 | Voice Commands Engine | 2-3 hrs | Natural language voice → CRM actions ("add contact...", "move deal to...") |

**Total: ~15-21 hours of building**
**Outcome: System improves itself. Agents chain together intelligently. Voice commands control everything. No human optimizes anything.**

### PHASE 4: "The Closer" (Day 7-8)
*AI that handles money — proposals, invoices, onboarding.*

| # | Build | Time | What It Does |
|---|-------|------|-------------|
| 18 | Proposal Generator | 2-3 hrs | Auto-create proposals from qualification data |
| 19 | Invoice + Payment Collection | 2-3 hrs | Stripe invoices, payment links in follow-ups |
| 20 | Auto-Onboarding | 2-3 hrs | Post-payment welcome sequence + setup |
| 21 | Meeting Booking (Calendar) | 2-3 hrs | Calendly-style booking integrated in sequences |

**Total: ~8-12 hours of building**
**Outcome: Full autonomous close. Lead → Money → Onboarded client. Zero touches.**

### PHASE 5: "The Loadout Marketplace + Demo Agent" (Week 3+)
*Customers create their own agents. AI gives demos. Community grows.*

| # | Build | Time | What It Does |
|---|-------|------|-------------|
| 22 | Custom Loadout Builder (UI) | 4-6 hrs | Customer-facing UI to create/configure their own agent loadouts |
| 23 | Pre-Built Industry Loadouts | 3-4 hrs | SaaS, Real Estate, Consulting, Healthcare, Agency templates |
| 24 | Loadout Marketplace | 4-6 hrs | Browse, install, publish, rate agent loadouts |
| 25 | Voice-to-Structured-Data | 2-3 hrs | Speak meeting notes → AI extracts BANT, sentiment, next steps |
| 26 | AI Demo Agent (Chat) | 4-6 hrs | Chat-based interactive product walkthrough |
| 27 | AI Demo Agent (Voice) | 6-8 hrs | Voice-based demo with screen recording |
| 28 | RAG Knowledge Base | 3-4 hrs | Agent pulls from product docs for Q&A |

**Total: ~24-34 hours of building**
**Outcome: Customers build their own agents. Marketplace generates passive revenue. AI gives demos. Full ecosystem.**

### TOTAL BUILD TIME: ~80-110 hours = ~10-14 focused days (28 items)

---

## GO-TO-MARKET: 15 TACTICS TO GET FIRST 10 CUSTOMERS

### Tier 1: FREE, DO THIS WEEK (Hours 1-24)

| # | Tactic | Effort | Expected Impact |
|---|--------|--------|----------------|
| 1 | **EAT OUR OWN COOKING** — Use QuotaHit to sell QuotaHit. Load 500 target companies (AI agencies, SaaS founders, sales consultants). Let AI qualify and outreach. | 2 hrs setup | 5-10 demos/week |
| 2 | **LinkedIn Content Blitz** — 2 posts/day: screen recordings of AI qualifying leads live, before/after metrics, behind-the-scenes builds. Tag #AISDr #SalesTech. Dhruv's face + AI demo = viral. | 30 min/post | 1,000+ views/post, 2-3 DMs/day |
| 3 | **Product Hunt Launch** — "QuotaHit: Your AI Sales Department that works while you sleep." Category: AI, Sales. Schedule for Tuesday 12:01 AM PT. Get 20 friends to upvote at launch. | 3 hrs prep | 500-2,000 visitors, 50-200 signups |
| 4 | **IndieHackers + r/SaaS + r/sales** — "I built an AI that replaced my sales team. Here's what happened." Genuine story, not promo. Show real screenshots. | 1 hr/post | 100-500 visitors per post |
| 5 | **Free Audit Lead Magnet** — "Upload your sales data → AI gives free pipeline audit." Widget on quotahit.com. Captures email + data. AI analyzes → shows value → upsells. | 3 hrs build | 10-20 leads/week |

### Tier 2: LOW COST, THIS MONTH (Week 1-2)

| # | Tactic | Effort | Expected Impact |
|---|--------|--------|----------------|
| 6 | **Upwork "AI Sales Setup" Gig** — Offer to set up AI SDR for businesses. Use QuotaHit as the tool. They pay for setup ($500-2K) + subscribe ($299+/mo). | 2 hrs to create listing | 2-4 clients/month |
| 7 | **Fiverr "AI Lead Gen" Gig** — Same concept, lower ticket. Build portfolio. | 1 hr to create listing | 3-5 clients/month |
| 8 | **Cold Email via Instantly** — We already have the skill! Target: VP Sales at 50-200 person SaaS companies. "Your sales team is about to get an AI colleague." | 2 hrs setup | 2% reply rate, 5-10 demos |
| 9 | **YouTube Shorts / Instagram Reels** — 30-sec clips: "Watch AI qualify a lead in real-time." Screen recording + voiceover. Post 1/day. | 30 min/video | Compound growth, brand building |
| 10 | **Referral Program on Website** — "Give 30% lifetime commission." Add referral tracking. Every customer becomes a salesperson. | 3 hrs build | Exponential after first 10 customers |

### Tier 3: SCALE, MONTH 2+ (After First Revenue)

| # | Tactic | Effort | Expected Impact |
|---|--------|--------|----------------|
| 11 | **AppSumo Lifetime Deal** — Get 200+ customers in one week. Lower revenue per user but massive user base + feedback + testimonials. | 5 hrs prep | 200-500 users, $20K-50K lump sum |
| 12 | **Agency White-Label Program** — Offer agencies to resell QuotaHit under their brand at 50% margin. They sell, we deliver. | 3 hrs setup | 5-10 agencies = 50-100 end clients |
| 13 | **Weekly Live Demo Webinar** — "Watch AI sell in real-time." Every Thursday 2 PM ET. Free registration. Live demo → close attendees. | 2 hrs/week | 5-10 attendees, 2-3 closes/week |
| 14 | **Partnership with n8n / Make.com** — Build QuotaHit nodes for n8n and Make. Their marketplace = our distribution. | 1 week | Long-term channel, 100s of users |
| 15 | **Hackathon Submissions** — Use QuotaHit as the project in AI/sales hackathons. Win prize money + exposure + credibility. | Per hackathon | $5K-50K prizes + press |

---

## COMPETITIVE MOAT (Why Competitors Can't Catch Us)

| Moat Layer | What It Is | How It Compounds |
|-----------|-----------|-----------------|
| **Data** | Every call, email, qualification → training data | More customers = smarter AI = better results |
| **Self-improving AI** | Templates, scoring, timing auto-optimize | Gets 1% better every day, 37x better in a year |
| **MCP ecosystem** | Any AI tool can plug in | Network effects — more integrations = more value |
| **Speed** | We build in hours, not months | First-mover in end-to-end autonomous sales |
| **Cost** | Indian engineering, AI-assisted development | 10x lower build cost than US competitors |
| **Full pipeline** | Only platform doing lead → payment → onboard | Competitors would need 2+ years to match |

---

## REVENUE PROJECTIONS

### Conservative Path to $1M ARR

| Month | MRR | Customers | How |
|-------|-----|-----------|-----|
| Month 1 | $2,400 | 8 (Starter) | Eat own cooking + LinkedIn + Upwork |
| Month 2 | $7,200 | 18 (+10) | Product Hunt + Reddit + cold email |
| Month 3 | $16,000 | 35 (+17) | Referrals kick in + Fiverr + webinars |
| Month 4 | $30,000 | 55 (+20) | Agency partnerships + AppSumo |
| Month 5 | $50,000 | 80 (+25) | Self-improving AI shows ROI → word of mouth |
| Month 6 | $83,000 | 110 (+30) | $1M ARR milestone |

### Aggressive Path (If AI Demo Agent works)

| Month | MRR | Customers | How |
|-------|-----|-----------|-----|
| Month 3 | $40,000 | 50 (mix) | Demo agent converts 24/7 |
| Month 6 | $160,000 | 150 | $1.9M ARR |
| Month 12 | $500,000 | 400 | $6M ARR |

---

## WHAT MAKES THIS A BILLION-DOLLAR COMPANY

| Layer | Revenue Model | Scale |
|-------|--------------|-------|
| **Platform SaaS** | Subscriptions $299-1,999/mo | 10K customers = $100M+ ARR |
| **Agent Loadout Marketplace** | 70/30 rev share on community loadouts | Passive, scales with community |
| **Pre-Built Industry Loadouts** | Included in higher tiers (upsell driver) | Each vertical = new TAM |
| **Custom Loadout Consulting** | $5K-50K per enterprise loadout | High-margin, relationship-driven |
| **MCP Ecosystem** | API usage fees + loadout-as-API | Network effects, developer adoption |
| **Data Intelligence** | Anonymized sales insights (premium) | Defensible moat |
| **White-Label** | Enterprise/agency bulk deals + their own marketplace | High-margin, long contracts |
| **Loadout API** | $0.01/execution for external triggers | Usage-based at massive scale |

**TAM:** Global sales technology market = $30B+ and growing.
**Our wedge:** SMBs underserved by expensive enterprise tools.
**Endgame:** "Every business has an AI sales department. Powered by QuotaHit."

---

## PM REVIEW: ARCHITECTURE & FUTURE-PROOFING (2026-2050)

### Architecture Decisions (Validated by Research)

| Component | Choice | Why | Revisit When |
|-----------|--------|-----|-------------|
| **Database** | Supabase (PostgreSQL) | Best for CRM relations, RLS multi-tenancy, real-time subscriptions. Already live. | >10K concurrent connections |
| **Vector DB** | pgvector (inside Supabase) | Zero additional infra. Good to 50M vectors with pgvectorscale. | >50M vectors or >500 QPS |
| **Job Orchestration** | **Inngest** (NEW — must add) | Native Next.js/Vercel. Pauses during LLM waits. Retries from last step. Perfect for agent workflows. | Never — this is the right long-term choice |
| **Event Streaming** | Redis Streams (Upstash) | Lightweight, serverless, handles email opens/clicks/agent events. | >100K daily events → then Kafka |
| **Frontend** | Vercel + Next.js | Keep for UI + lightweight APIs (<30s). Already live. | Never changing this |
| **Long-Running Agents** | Inngest durable functions | Vercel times out at 300s max. Agent workflows can take minutes. Inngest solves this. | Add Temporal for enterprise tier |
| **Caching** | Redis (Upstash) | Rate limiting, session cache, hot data. Serverless = zero ops. | Standard choice |
| **Voice STT** | Web Speech API → Deepgram → Whisper | Free first, cheap fallback, premium for accuracy. | Add real-time translation 2027 |

### Critical Addition: Inngest for Agent Orchestration

**Why we MUST add this (Phase 1):**
- Vercel serverless functions timeout at 300s max
- AI agent workflows take minutes (enrich → score → qualify → email → wait for reply)
- Inngest wraps Vercel AI SDK — pauses during LLM API waits (no wasted compute)
- Retries from last successful step (not from scratch if something fails)
- Event-driven: new_lead → enrich → score → assign → sequence (natural for sales)
- 11x.ai uses similar pattern: "tools, not smarts" — deterministic orchestration + AI reasoning

```
Without Inngest:                          With Inngest:
Lead comes in                             Lead comes in
→ API route starts                        → Inngest event: "lead.created"
→ Calls Perplexity (5s)                   → Step 1: enrich (5s, pauses)
→ Calls scoring LLM (3s)                  → Step 2: score (3s, pauses)
→ Calls qualification LLM (10s)           → Step 3: qualify (10s, pauses)
→ Sends email (2s)                        → Step 4: send email (2s)
→ TOTAL: 20s in one function              → Step 5: wait for reply (days)
→ What about waiting for reply?           → Step 6: follow up if no reply
→ Can't. Function died.                   → Each step independent. Reliable.
```

### Compliance Architecture (CRITICAL — Legal Requirements)

**April 2026 deadline: FCC one-to-one consent rule for AI calling.**
**We MUST build consent management into Phase 1.**

| Requirement | What We Need | Priority |
|-------------|-------------|----------|
| **TCPA Consent** | Per-seller explicit consent for AI calls. Store: who consented, when, how, for what. | CRITICAL — Phase 1 |
| **AI Disclosure** | First seconds of every AI call: "This call uses AI technology." Non-negotiable. | CRITICAL — Phase 1 |
| **CAN-SPAM** | Unsubscribe link in every email. Honor within 10 days. Physical address. | HIGH — Phase 2 |
| **GDPR** | Opt-in consent for EU contacts. Right to deletion. Data minimization. | HIGH — Phase 2 |
| **DNC Enforcement** | Check DNC registry before every call. We have the field, need enforcement logic. | CRITICAL — Phase 1 |
| **Audit Trail** | Every agent action logged immutably (who, what, when, why). | HIGH — Phase 1 |
| **SOC2 Type I** | Start immediately ($3K-8K with Comp AI/Vanta). Enterprise deals need this. | MEDIUM — Month 2 |
| **SOC2 Type II** | 3-6 month observation period. Must start early for enterprise readiness. | MEDIUM — Month 3 start |

### What's Coming (2027-2050 Roadmap Awareness)

| Timeline | Technology | Impact on QuotaHit | When to Build |
|----------|-----------|-------------------|---------------|
| **2027** | Real-time multilingual voice | AI agents sell in any language | When first non-English customer |
| **2027** | Emotional AI in calls | Detect buyer sentiment, coach in real-time | Phase 5+ (after demo agent) |
| **2028** | Predictive intent scoring | Know who will buy before they know | Phase 3 (feedback loop lays groundwork) |
| **2028** | AI agent marketplace standard | Loadouts become industry standard | Phase 5 (we're already building this) |
| **2029** | AR/VR product demos | AI gives immersive 3D demos | Future — web-based 3D first |
| **2030** | Multi-modal AI | Process video + voice + text + emotion simultaneously | Architecture supports this (event-driven) |
| **2030+** | Autonomous revenue teams | AI handles 95%+ of sales cycle | This IS our product |
| **2040+** | Brain-computer interfaces | Direct intent → action | Our voice layer is the precursor |
| **2050** | AGI sales agents | Indistinguishable from human salespeople | We'll have decades of training data |

**Key insight:** Everything we build today (event-driven architecture, agent loadouts, MCP, voice-first) positions us perfectly for each wave. We're not building for 2026. We're building the foundation for 2030+.

### PM Risk Matrix

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|-----------|
| Vercel timeout on agent tasks | HIGH | Agent failures | Inngest (Phase 1) |
| TCPA violation from AI calling | HIGH | $500-1500 per call fine | Consent service (Phase 1) |
| Agent projects abandoned (Gartner: 40%) | MEDIUM | Wasted effort | Tools-over-smarts pattern (deterministic + AI) |
| Serverless cost spikes | MEDIUM | Unpredictable bills | Inngest offloads long tasks, Redis caching |
| Competitor copies our approach | LOW | Market share loss | Data moat + self-improving AI + speed |
| Data breach / security incident | LOW | Company-ending | RLS, encryption, SOC2, audit trails |

---

## RULES OF ENGAGEMENT

1. **Speed > Perfection** — Ship fast, iterate faster
2. **Eat our own cooking** — QuotaHit sells QuotaHit first
3. **Money first, features second** — If it doesn't drive revenue, don't build it
4. **AI does everything** — No manual templates, no manual scoring, no manual routing
5. **Self-improving or bust** — Every component must get smarter over time
6. **MCP-native** — Everything accessible via MCP from day 1
7. **10x not 10%** — We don't compete. We make categories obsolete.

---

## DECISION LOG

| Date | Decision | Reason |
|------|----------|--------|
| 2026-02-25 | Pivot from sales coaching to autonomous AI sales department | Coaching = nice-to-have. Autonomous pipeline = must-have. Market is $30B+. |
| 2026-02-25 | 7-agent architecture with orchestrator | Specialized agents > one generic agent. Division of labor = better performance. |
| 2026-02-25 | Three routing modes (Autonomous/Hybrid/Self-Service) | Serves both solo founders AND sales teams. Wider market. |
| 2026-02-25 | MCP-first architecture | Universal connectivity. Future-proof. Ecosystem play. |
| 2026-02-25 | Self-improving AI as core differentiator | Only defensible moat. Gets better with scale. Competitors can't copy data. |
| 2026-02-25 | Build in hours, not days | Claude Code + existing infrastructure = 10x speed advantage. |
| 2026-02-25 | Agent Loadouts as internal architecture + sellable product | Already built for our workspace. Becomes marketplace, moat, and ecosystem play. |
| 2026-02-25 | Loadout Marketplace in Phase 5 | Community creates industry-specific agents. 70/30 revenue share. Passive income + vertical expansion. |
| 2026-02-25 | Voice-as-Instruction (not just dictation) | Users INSTRUCT AI via voice. AI uses CRM context to write emails, update deals, run sequences. 3 levels: transcribe → instruct → orchestrate. |
| 2026-02-25 | Inngest for agent orchestration | Vercel times out at 300s. Agent workflows need minutes/hours. Inngest = durable functions, event-driven, retries from last step. |
| 2026-02-25 | Consent + Compliance service in Phase 1 | FCC one-to-one consent rule (April 2026). TCPA fines $500-1500/call. Must build consent tracking before AI calling goes live. |
| 2026-02-25 | PostgreSQL (Supabase) confirmed as right DB | PM review validated: best for CRM relations, RLS multi-tenancy, pgvector for RAG. No need for MongoDB. |
| 2026-02-25 | Redis Streams (Upstash) for event streaming | Lightweight event bus for agent actions. Move to Kafka only at >100K daily events. |
| 2026-02-25 | PM review: architecture future-proofed to 2030+ | Event-driven + loadouts + MCP + voice positions for multilingual, emotional AI, AR/VR demos, predictive scoring. |

---

## NEXT ACTIONS (Starting NOW)

### Today (Feb 25, 2026):
- [ ] Build Lead Scoring Engine (2-3 hrs)
- [ ] Build Auto-Qualification Agent (3-4 hrs)
- [ ] Build QuotaHit MCP Server (2-3 hrs)
- [ ] Build Smart Routing / Assignment (2-3 hrs)
- [ ] Activate Follow-Up Execution (2-3 hrs)

### Tomorrow (Feb 26, 2026):
- [ ] AI Template Generator
- [ ] Multi-Channel Sequencer
- [ ] WhatsApp Integration
- [ ] LinkedIn Outreach setup
- [ ] Load 500 target companies into CRM

### Day 3 (Feb 27, 2026):
- [ ] Product Hunt prep
- [ ] LinkedIn content (first 3 posts)
- [ ] Upwork + Fiverr gig listings
- [ ] Free Audit lead magnet on website

---

*This document is the North Star. Every build session starts by reading this.*
*Updated: 2026-02-25 by Dhruv + Claude*
