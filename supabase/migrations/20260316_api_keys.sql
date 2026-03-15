-- API Keys: Developer API authentication
-- Stores hashed API keys with prefix for fast lookup
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  scopes TEXT[] DEFAULT '{}',
  rate_limit_per_minute INT DEFAULT 60,
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_keys_prefix ON api_keys(key_prefix) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_api_keys_user ON api_keys(user_id);

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own keys"
  ON api_keys FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Service role bypass api_keys"
  ON api_keys FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- API Usage: Per-call tracking for billing and analytics
CREATE TABLE IF NOT EXISTS api_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  api_key_id UUID NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  response_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_usage_key ON api_usage(api_key_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_usage_user ON api_usage(user_id, created_at DESC);

ALTER TABLE api_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own usage"
  ON api_usage FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role bypass api_usage"
  ON api_usage FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

COMMENT ON TABLE api_keys IS 'Developer API keys with SHA-256 hashed secrets and prefix-based lookup';
COMMENT ON TABLE api_usage IS 'Per-call API usage tracking for billing and analytics';
