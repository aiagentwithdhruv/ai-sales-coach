-- ============================================================================
-- Phase 5: Marketplace + Demo — Loadouts, Marketplace, Demo, RAG
-- ============================================================================
-- Tables:
--   loadouts                — Custom agent loadout configurations
--   marketplace_listings    — Published loadouts for community
--   marketplace_reviews     — User reviews on marketplace listings
--   demo_sessions           — Chat-based demo conversations
--   voice_demo_sessions     — Voice-based demo conversations
--   knowledge_documents     — RAG source documents
--   knowledge_chunks        — Embedded text chunks for vector search
-- ============================================================================

-- ─── Loadouts ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS loadouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  industry TEXT,
  agents JSONB DEFAULT '[]',
  chain JSONB DEFAULT '{}',
  settings JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'published', 'archived')),
  version INTEGER DEFAULT 1,
  source_listing_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_loadouts_user ON loadouts(user_id);
CREATE INDEX idx_loadouts_status ON loadouts(status);
CREATE INDEX idx_loadouts_industry ON loadouts(industry);

ALTER TABLE loadouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own loadouts"
  ON loadouts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users manage own loadouts"
  ON loadouts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Service role manages loadouts"
  ON loadouts FOR ALL USING (auth.role() = 'service_role');

-- ─── Marketplace Listings ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS marketplace_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loadout_id UUID REFERENCES loadouts(id) ON DELETE SET NULL,
  publisher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  publisher_name TEXT DEFAULT 'Anonymous',
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  industry TEXT DEFAULT 'general',
  tags TEXT[] DEFAULT '{}',
  agent_count INTEGER DEFAULT 0,
  rating NUMERIC(3,1) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  install_count INTEGER DEFAULT 0,
  price NUMERIC(8,2) DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  preview_images TEXT[] DEFAULT '{}',
  featured BOOLEAN DEFAULT false,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'under_review', 'rejected', 'removed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_marketplace_status ON marketplace_listings(status);
CREATE INDEX idx_marketplace_industry ON marketplace_listings(industry);
CREATE INDEX idx_marketplace_rating ON marketplace_listings(rating DESC);
CREATE INDEX idx_marketplace_installs ON marketplace_listings(install_count DESC);
CREATE INDEX idx_marketplace_publisher ON marketplace_listings(publisher_id);

ALTER TABLE marketplace_listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can browse published listings"
  ON marketplace_listings FOR SELECT USING (status = 'published');
CREATE POLICY "Publishers manage own listings"
  ON marketplace_listings FOR ALL USING (auth.uid() = publisher_id);
CREATE POLICY "Service role manages all listings"
  ON marketplace_listings FOR ALL USING (auth.role() = 'service_role');

-- ─── Marketplace Reviews ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS marketplace_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES marketplace_listings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT DEFAULT 'Anonymous',
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(listing_id, user_id) -- one review per user per listing
);

CREATE INDEX idx_reviews_listing ON marketplace_reviews(listing_id);

ALTER TABLE marketplace_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read reviews"
  ON marketplace_reviews FOR SELECT USING (true);
CREATE POLICY "Users manage own reviews"
  ON marketplace_reviews FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Service role manages reviews"
  ON marketplace_reviews FOR ALL USING (auth.role() = 'service_role');

-- ─── Demo Sessions (Chat) ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS demo_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id TEXT NOT NULL,
  messages JSONB DEFAULT '[]',
  stage TEXT DEFAULT 'intro',
  qualification_data JSONB DEFAULT '{}',
  context JSONB DEFAULT '{}',
  last_activity_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_demo_sessions_visitor ON demo_sessions(visitor_id);
CREATE INDEX idx_demo_sessions_created ON demo_sessions(created_at);

-- No RLS — demo sessions are public-facing

-- ─── Voice Demo Sessions ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS voice_demo_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id TEXT,
  call_sid TEXT,
  visitor_phone TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'dropped')),
  transcript JSONB DEFAULT '[]',
  qualification_data JSONB DEFAULT '{}',
  agent_config JSONB DEFAULT '{}',
  outcome TEXT,
  duration INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_voice_demo_status ON voice_demo_sessions(status);
CREATE INDEX idx_voice_demo_created ON voice_demo_sessions(created_at);

-- ─── Knowledge Documents ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS knowledge_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  source TEXT DEFAULT 'manual',
  content TEXT DEFAULT '',
  chunk_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'ready', 'error')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_knowledge_docs_user ON knowledge_documents(user_id);
CREATE INDEX idx_knowledge_docs_status ON knowledge_documents(status);

ALTER TABLE knowledge_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own documents"
  ON knowledge_documents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users manage own documents"
  ON knowledge_documents FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Service role manages documents"
  ON knowledge_documents FOR ALL USING (auth.role() = 'service_role');

-- ─── Knowledge Chunks (for Vector Search) ────────────────────────────────

CREATE TABLE IF NOT EXISTS knowledge_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES knowledge_documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  embedding TEXT, -- Stored as JSON array; use pgvector column if extension available
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_knowledge_chunks_doc ON knowledge_chunks(document_id);
CREATE INDEX idx_knowledge_chunks_user ON knowledge_chunks(user_id);

ALTER TABLE knowledge_chunks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own chunks"
  ON knowledge_chunks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role manages chunks"
  ON knowledge_chunks FOR ALL USING (auth.role() = 'service_role');

-- ─── Vector search function (requires pgvector extension) ────────────────
-- Note: Enable pgvector in Supabase Dashboard → Extensions → vector
-- Then run: ALTER TABLE knowledge_chunks ADD COLUMN embedding_vector vector(1536);
-- And create this function:

-- CREATE OR REPLACE FUNCTION match_knowledge_chunks(
--   query_embedding TEXT,
--   match_threshold FLOAT,
--   match_count INT,
--   p_user_id UUID
-- )
-- RETURNS TABLE (
--   id UUID,
--   content TEXT,
--   metadata JSONB,
--   similarity FLOAT
-- )
-- LANGUAGE plpgsql
-- AS $$
-- BEGIN
--   RETURN QUERY
--   SELECT
--     kc.id,
--     kc.content,
--     kc.metadata,
--     1 - (kc.embedding_vector <=> query_embedding::vector) AS similarity
--   FROM knowledge_chunks kc
--   WHERE kc.user_id = p_user_id
--     AND 1 - (kc.embedding_vector <=> query_embedding::vector) > match_threshold
--   ORDER BY kc.embedding_vector <=> query_embedding::vector
--   LIMIT match_count;
-- END;
-- $$;
