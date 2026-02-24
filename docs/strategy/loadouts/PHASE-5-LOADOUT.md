# Phase 5: The Marketplace + Demo Agent
## LOADOUT.md | QuotaHit Build Phase 5

> Customers create their own agents. AI gives demos. Community grows. Passive revenue starts.

**Depends on:** Phase 4 (full pipeline, proposals, invoicing, onboarding)
**Estimated build:** ~5-6 hours (Claude Code speed, not the 24-34 hr human estimate)

---

## Schema

### Inputs
| Input | Type | Source |
|-------|------|--------|
| Full autonomous pipeline | Phases 1-4 complete | All `src/inngest/` functions |
| Agent Loadout Structure | 8 agent loadouts | `agents/` directory |
| Existing agent builder | Agent CRUD + config | `src/app/api/agents/` |
| Existing coaching module | Practice personas + sessions | `src/lib/ai/prompts/` |
| Existing blog/content engine | SEO + daily posts | `src/app/blog/` |

### Outputs
| Output | Type | Destination |
|--------|------|------------|
| Custom Loadout Builder UI | Customer-facing agent creator | `src/app/dashboard/loadouts/` |
| Pre-Built Industry Loadouts | 5 templates | `agents/templates/` |
| Loadout Marketplace | Browse, install, publish | `src/app/marketplace/` |
| Voice-to-Structured-Data | Meeting notes → BANT extraction | `src/lib/voice/structured.ts` |
| AI Demo Agent (Chat) | Interactive product walkthrough | `src/components/demo/` |
| AI Demo Agent (Voice) | Voice-based demo with knowledge | `src/lib/demo/` |
| RAG Knowledge Base | Product docs for agent Q&A | `src/lib/ai/rag.ts` |

---

## Build Items (7)

### Item 22: Custom Loadout Builder (UI)
**Time:** ~60 min | **Priority:** P0

Customer-facing wizard to create, configure, and deploy their own AI agent loadouts.

**What it does:**
- Step-by-step wizard: choose base template → upload knowledge → set ICP → configure channels → set routing → deploy
- Auto-generates LOADOUT.md with typed schema
- Validates config before deployment
- Live preview: test agent with sample data before going live

**Implementation:**
```
src/app/dashboard/loadouts/page.tsx        — List user's loadouts
src/app/dashboard/loadouts/new/page.tsx    — Creation wizard (6 steps)
src/app/dashboard/loadouts/[id]/page.tsx   — Edit/manage loadout

src/lib/loadouts/builder.ts
├── createLoadout(userId, config) → loadoutId
├── validateLoadout(config) → { valid, errors[] }
├── deployLoadout(loadoutId) → activate agent
├── testLoadout(loadoutId, sampleContact) → simulate result
├── generateLoadoutManifest(config) → LOADOUT.md content
└── pauseLoadout(loadoutId)
```

**Wizard steps:**
1. **Name + Base** — Choose from template or blank
2. **Knowledge** — Upload product docs, pricing, FAQs (stored as embeddings)
3. **ICP** — Define ideal customer: industry, size, titles, geography
4. **Channels** — Enable email, LinkedIn, WhatsApp, call + configure accounts
5. **Routing** — Mode A (auto) / B (hybrid) / C (self-service) + rules
6. **Deploy** — Review config, test with sample, activate

---

### Item 23: Pre-Built Industry Loadouts
**Time:** ~30 min | **Priority:** P0

5 ready-to-use agent templates for common verticals. Customer installs and customizes.

**Templates:**

| Template | ICP | Channels | Qualification Focus |
|----------|-----|----------|-------------------|
| **SaaS Sales** | SaaS companies, 10-500 employees, VP Sales/CTO | Email, LinkedIn, Call | Budget, current tools, contract timeline |
| **Real Estate** | Property buyers/sellers, location-based | WhatsApp, Call, Email | Budget range, property type, timeline |
| **Consulting/Agency** | SMBs needing services, CEO/Founder | LinkedIn, Email | Project scope, budget, decision process |
| **Healthcare** | Clinics, hospitals, practice managers | Email, Call | Compliance needs, patient volume, current systems |
| **E-Commerce D2C** | Online brands, marketing managers | Email, WhatsApp | AOV, marketing spend, growth goals |

**Implementation:**
```
agents/templates/
├── saas-sales/
│   ├── LOADOUT.md
│   ├── agent.config.json
│   ├── prompts/system.md
│   └── knowledge/product-objections.md
├── real-estate/
├── consulting-agency/
├── healthcare/
└── ecommerce-d2c/

src/lib/loadouts/templates.ts
├── getTemplates() → Template[]
├── installTemplate(userId, templateId) → loadoutId
├── customizeTemplate(loadoutId, overrides) → updated loadout
```

---

### Item 24: Loadout Marketplace
**Time:** ~60 min | **Priority:** P1

Browse, install, publish, and rate community-created agent loadouts.

**What it does:**
- Browse marketplace by category (industry, channel, use case)
- Install a loadout in one click → customizes with your data
- Publish your loadout to marketplace (review process)
- Revenue share: 70% creator / 30% QuotaHit
- Ratings + reviews + install counts

**Implementation:**
```
src/app/marketplace/page.tsx              — Browse/search
src/app/marketplace/[id]/page.tsx         — Detail + install
src/app/dashboard/loadouts/publish/page.tsx — Publish wizard

src/lib/loadouts/marketplace.ts
├── browseLoadouts(filters) → MarketplaceLoadout[]
├── installLoadout(userId, loadoutId) → installedLoadoutId
├── publishLoadout(loadoutId, pricing) → submit for review
├── rateLoadout(userId, loadoutId, rating, review)
├── getCreatorDashboard(userId) → installs, revenue, ratings
└── calculateCreatorPayout(loadoutId, period)
```

**Supabase tables:**
- `marketplace_loadouts` — published loadouts with metadata
- `marketplace_installs` — who installed what
- `marketplace_reviews` — ratings + reviews
- `marketplace_payouts` — creator revenue tracking

---

### Item 25: Voice-to-Structured-Data
**Time:** ~20 min | **Priority:** P1

Speak meeting notes → AI extracts BANT signals, sentiment, competitor intel, next steps. Auto-updates CRM.

**What it does:**
- User records or speaks meeting/call notes
- AI extracts: BANT scores, sentiment, competitors mentioned, next steps, objections
- Auto-updates contact record with structured data
- Creates activity log entry with full notes + extracted data
- Suggests next action based on extracted signals

**Implementation:**
```
src/lib/voice/structured.ts
├── extractStructuredData(transcript, contactId?) → StructuredMeetingData
├── applyToCRM(contactId, userId, data) → updated contact
├── suggestNextAction(data) → recommendation
└── StructuredMeetingData: {
      bant: { budget, authority, need, timeline, competition },
      sentiment: positive | neutral | negative,
      competitors: string[],
      objections: string[],
      next_steps: string[],
      deal_value_mentioned: number?,
      key_quotes: string[]
    }
```

---

### Item 26: AI Demo Agent (Chat)
**Time:** ~45 min | **Priority:** P0

Chat-based interactive product walkthrough on quotahit.com. Replaces static "Book a Demo" with instant AI demo.

**What it does:**
- Visitor clicks "Try Demo" → chat widget opens
- AI walks through QuotaHit features based on visitor's questions
- Pulls from RAG knowledge base (product docs, pricing, FAQs)
- Qualifies visitor during demo (asks about company, team size, current tools)
- If qualified: offers to start free trial or book human call
- Captures email/phone for follow-up

**Implementation:**
```
src/components/demo/DemoChatWidget.tsx  — floating chat widget
src/app/api/ai/demo/route.ts           — streaming chat endpoint

src/lib/demo/agent.ts
├── handleDemoChat(messages, visitorContext) → stream response
├── qualifyDuringDemo(messages) → { qualified, bant_signals }
├── suggestNextStep(qualification) → CTA
└── DEMO_SYSTEM_PROMPT: product expert + qualifier
```

**Conversion flow:**
1. Visitor arrives → small "Try AI Demo" button (bottom-right)
2. Click → chat opens with "Hey! Want to see how QuotaHit can automate your sales?"
3. AI shows features relevant to visitor's needs
4. Mid-demo: "What's your team size?" "What tools do you use now?"
5. If qualified: "Want to start a free trial? I'll set everything up for you."
6. If not ready: capture email, add to nurture sequence

---

### Item 27: AI Demo Agent (Voice)
**Time:** ~60 min | **Priority:** P2

Voice-based demo using Gemini Live or ElevenLabs conversational AI. The "Hear Our AI Call" feature becomes a full demo agent.

**What it does:**
- Visitor clicks "Hear Our AI Demo" → AI calls them (or starts browser voice chat)
- AI conducts voice-based product walkthrough
- Answers questions in real-time from knowledge base
- Qualifies during conversation
- Books meeting or starts trial at end of call

**Implementation:**
```
src/lib/demo/voice-agent.ts
├── startVoiceDemo(visitorPhone?) → callSid or browserSession
├── handleVoiceConversation(input) → AI response
├── DEMO_VOICE_PROMPT: conversational product expert
└── endDemo(outcome) → CRM entry, follow-up trigger
```

**Tech stack:**
- Browser: Gemini Live API (already integrated) or OpenAI Realtime
- Phone: Twilio + ElevenLabs (already integrated)
- Knowledge: RAG from product docs

---

### Item 28: RAG Knowledge Base
**Time:** ~30 min | **Priority:** P0

Vector-based retrieval for demo agent and customer agent Q&A.

**What it does:**
- Index product docs, pricing, FAQs, case studies as embeddings
- Query relevant context before every AI response
- Auto-update index when docs change
- Per-customer knowledge bases (for their agent loadouts)

**Implementation:**
```
src/lib/ai/rag.ts
├── indexDocuments(documents[]) → store in pgvector
├── queryKnowledge(question, topK=5) → relevant chunks
├── augmentPrompt(systemPrompt, question, context) → enriched prompt
├── indexUserKnowledge(userId, documents[]) → per-user vectors
└── refreshIndex(source) → re-index changed docs

// Uses pgvector in existing Supabase (no new infra)
```

**Default knowledge indexed:**
- QuotaHit product docs (features, pricing, FAQ)
- Comparison pages (vs 11x, Artisan, Apollo, Clay, Gong)
- Case studies / testimonials
- Sales methodology guides (BANT, SPIN, Challenger)

---

## Supabase Migrations Needed

```sql
-- 016_marketplace.sql

CREATE TABLE IF NOT EXISTS marketplace_loadouts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID NOT NULL REFERENCES auth.users(id),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  industry TEXT,
  config JSONB NOT NULL,
  pricing_type TEXT DEFAULT 'free' CHECK (pricing_type IN ('free', 'paid')),
  price_monthly NUMERIC(8,2) DEFAULT 0,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'published', 'suspended')),
  installs INTEGER DEFAULT 0,
  avg_rating NUMERIC(3,2) DEFAULT 0,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS marketplace_installs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  loadout_id UUID NOT NULL REFERENCES marketplace_loadouts(id),
  installed_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, loadout_id)
);

CREATE TABLE IF NOT EXISTS marketplace_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  loadout_id UUID NOT NULL REFERENCES marketplace_loadouts(id),
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  review TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, loadout_id)
);

-- Knowledge base embeddings (pgvector)
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS knowledge_embeddings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID, -- NULL for system-wide knowledge
  source TEXT NOT NULL,
  chunk_text TEXT NOT NULL,
  embedding vector(1536),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_knowledge_embedding ON knowledge_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

ALTER TABLE marketplace_loadouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_installs ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_embeddings ENABLE ROW LEVEL SECURITY;
```

---

## Success Criteria

Phase 5 is DONE when:
- [ ] Customers can create custom agent loadouts via wizard
- [ ] 5 industry templates ready to install
- [ ] Marketplace: browse, install, publish, rate loadouts
- [ ] Voice meeting notes → auto-extract BANT + update CRM
- [ ] AI Demo Agent (chat) qualifies visitors on quotahit.com 24/7
- [ ] AI Demo Agent (voice) conducts phone/browser demos
- [ ] RAG knowledge base powers demo agent Q&A
- [ ] First community loadout published to marketplace

---

## What This Enables

After Phase 5: **QuotaHit is a platform, not just a product.** Customers create their own agents. The marketplace generates passive revenue. AI gives demos 24/7 (replacing the "Book a Demo" bottleneck). The knowledge base makes every agent smarter. This is where network effects and the moat compound.

---

## FULL PIPELINE (All 5 Phases Complete)

```
VISITOR → AI Demo Agent qualifies on website (Phase 5)
  ↓
LEAD → Scout finds them OR they sign up (Phase 2)
  ↓
ENRICHED → Researcher enriches via Perplexity (Phase 1)
  ↓
SCORED → Lead scoring 0-100 (Phase 1)
  ↓
QUALIFIED → BANT+ conversation via AI (Phase 1)
  ↓
OUTREACH → Multi-channel sequences auto-fire (Phase 2)
  ↓
SELF-IMPROVING → Templates optimize themselves (Phase 3)
  ↓
PROPOSAL → AI generates and sends proposal (Phase 4)
  ↓
PAYMENT → Stripe invoice + auto-collection (Phase 4)
  ↓
ONBOARDED → Welcome sequence + setup (Phase 4)
  ↓
CUSTOMER → Using their own agent loadouts (Phase 5)
  ↓
MARKETPLACE → Publishing loadouts, earning revenue (Phase 5)
```

**Total build time (all 5 phases): ~15-20 hours at Claude Code speed.**
**Human equivalent: ~80-110 hours = 2-3 weeks.**
**We do it in 2-3 days.**
