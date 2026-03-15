-- Custom Domains: Map user domains to SnapR property sites and portfolios
CREATE TABLE IF NOT EXISTS custom_domains (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  domain TEXT NOT NULL UNIQUE,
  target_type TEXT NOT NULL DEFAULT 'property_site'
    CHECK (target_type IN ('property_site', 'portfolio', 'organization')),
  target_id UUID,
  verification_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (verification_status IN ('pending', 'verified', 'failed')),
  verification_token TEXT NOT NULL,
  verified_at TIMESTAMPTZ,
  brand_config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_custom_domains_domain ON custom_domains(domain);
CREATE INDEX IF NOT EXISTS idx_custom_domains_user ON custom_domains(user_id);

ALTER TABLE custom_domains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own domains"
  ON custom_domains FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Service role bypass custom_domains"
  ON custom_domains FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

COMMENT ON TABLE custom_domains IS 'Custom domain mappings for property sites and portfolios with DNS verification';
