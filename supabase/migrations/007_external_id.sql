-- ===========================================
-- Add external CRM link fields to contacts
-- ===========================================
-- Links QuotaHit contacts back to their source CRM (Zoho, Salesforce, etc.)
-- for bidirectional sync.

ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS external_id TEXT;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS external_provider TEXT;

-- Index for fast lookups during sync
CREATE INDEX IF NOT EXISTS idx_contacts_external
  ON public.contacts(external_provider, external_id)
  WHERE external_id IS NOT NULL;
