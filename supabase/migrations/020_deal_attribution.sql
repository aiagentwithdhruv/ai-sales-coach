-- Deal Attribution: Agent Touchpoints
-- Tracks which AI agent contributed to each contact/deal
CREATE TABLE IF NOT EXISTS agent_touchpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_type VARCHAR(50) NOT NULL CHECK (agent_type IN ('scout', 'researcher', 'qualifier', 'outreach', 'caller', 'closer', 'ops', 'manual')),
  action VARCHAR(100) NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_agent_touchpoints_contact ON agent_touchpoints(contact_id);
CREATE INDEX IF NOT EXISTS idx_agent_touchpoints_user ON agent_touchpoints(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_touchpoints_agent ON agent_touchpoints(agent_type, user_id);

-- RLS
ALTER TABLE agent_touchpoints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own touchpoints" ON agent_touchpoints
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role full access on agent_touchpoints" ON agent_touchpoints
  FOR ALL USING (auth.role() = 'service_role');
