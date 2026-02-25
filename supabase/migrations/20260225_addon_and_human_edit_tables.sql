-- ============================================
-- Missing tables referenced by Stripe webhook
-- ============================================

-- Addon purchases (e.g., extra listings, premium features)
CREATE TABLE IF NOT EXISTS addon_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  addon_type TEXT NOT NULL,
  listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  amount_paid INTEGER, -- cents
  status TEXT NOT NULL DEFAULT 'completed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_addon_purchases_user ON addon_purchases(user_id);
CREATE INDEX idx_addon_purchases_type ON addon_purchases(addon_type);

-- Human edit orders (professional retouching requests)
CREATE TABLE IF NOT EXISTS human_edit_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  photo_id UUID REFERENCES photos(id) ON DELETE SET NULL,
  is_urgent BOOLEAN NOT NULL DEFAULT false,
  instructions TEXT,
  amount_paid INTEGER, -- cents
  status TEXT NOT NULL DEFAULT 'pending', -- pending, in_progress, completed, cancelled
  editor_notes TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_human_edit_orders_user ON human_edit_orders(user_id);
CREATE INDEX idx_human_edit_orders_status ON human_edit_orders(status);

-- RLS policies
ALTER TABLE addon_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE human_edit_orders ENABLE ROW LEVEL SECURITY;

-- Users can read their own records
CREATE POLICY "Users can view own addon purchases"
  ON addon_purchases FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own human edit orders"
  ON human_edit_orders FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can do everything (for webhook + admin)
CREATE POLICY "Service role full access to addon_purchases"
  ON addon_purchases FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to human_edit_orders"
  ON human_edit_orders FOR ALL
  USING (auth.role() = 'service_role');
