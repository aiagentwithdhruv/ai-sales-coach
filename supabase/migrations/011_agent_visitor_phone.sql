-- Add phone column to agent_visitor_memory
ALTER TABLE agent_visitor_memory ADD COLUMN IF NOT EXISTS phone TEXT;
