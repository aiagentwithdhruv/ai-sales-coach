-- Developer API Keys
-- Public API authentication for third-party integrations
CREATE TABLE IF NOT EXISTS developer_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  key_prefix VARCHAR(20) NOT NULL,
  key_hash VARCHAR(64) NOT NULL UNIQUE,
  environment VARCHAR(10) NOT NULL CHECK (environment IN ('live', 'test')),
  scopes TEXT[] DEFAULT ARRAY['contacts:read', 'contacts:write', 'leads:read', 'analytics:read'],
  rate_limit INTEGER DEFAULT 60,
  ip_whitelist TEXT[] DEFAULT NULL,
  last_used_at TIMESTAMPTZ DEFAULT NULL,
  usage_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_developer_api_keys_hash ON developer_api_keys(key_hash) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_developer_api_keys_user ON developer_api_keys(user_id);

-- Agency Clients (white-label)
CREATE TABLE IF NOT EXISTS agency_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_name VARCHAR(200) NOT NULL,
  client_email VARCHAR(300) NOT NULL,
  client_user_id UUID DEFAULT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  tier_override VARCHAR(50) DEFAULT NULL,
  monthly_fee DECIMAL(10,2) DEFAULT 0,
  commission_percent INTEGER DEFAULT 30 CHECK (commission_percent BETWEEN 0 AND 100),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agency_clients_agency ON agency_clients(agency_user_id);

-- RLS
ALTER TABLE developer_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE agency_clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own API keys" ON developer_api_keys
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Service role full access on developer_api_keys" ON developer_api_keys
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Agencies can manage own clients" ON agency_clients
  FOR ALL USING (auth.uid() = agency_user_id);

CREATE POLICY "Service role full access on agency_clients" ON agency_clients
  FOR ALL USING (auth.role() = 'service_role');
