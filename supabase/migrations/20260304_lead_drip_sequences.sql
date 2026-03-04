-- ============================================
-- Lead Drip Sequences
-- ============================================
-- Powers automated follow-up email sequences
-- triggered when an agent enrolls a lead.
--
-- Used by:
--   /api/leads/drip (POST: enroll, GET: list)
--   /api/cron/drip-sequences (sends scheduled emails)
--   /dashboard/leads (enrollment UI)
-- ============================================

-- ----------------------------------------
-- 1. Sequence definitions (templates)
--    Built-in sequences are seeded below.
--    Agents can create custom ones (future).
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS lead_drip_sequences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL = built-in system sequence
  name TEXT NOT NULL,
  description TEXT,
  trigger_event TEXT NOT NULL DEFAULT 'manual', -- manual, lead_captured, status_change
  is_active BOOLEAN DEFAULT true,
  is_system BOOLEAN DEFAULT false, -- true = built-in, not editable
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------
-- 2. Steps within each sequence
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS lead_drip_steps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sequence_id UUID NOT NULL REFERENCES lead_drip_sequences(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,        -- 1, 2, 3...
  delay_days INTEGER NOT NULL DEFAULT 0, -- days after enrollment (0 = immediately)
  subject_template TEXT NOT NULL,      -- supports {{name}}, {{address}}, {{agent_name}}
  body_template TEXT NOT NULL,         -- HTML with template vars
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(sequence_id, step_number)
);

-- ----------------------------------------
-- 3. Per-lead enrollment records
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS lead_drip_enrollments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES property_leads(id) ON DELETE CASCADE,
  sequence_id UUID NOT NULL REFERENCES lead_drip_sequences(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'unsubscribed')),
  next_step_number INTEGER DEFAULT 1,
  completed_at TIMESTAMPTZ,
  UNIQUE(lead_id, sequence_id) -- one enrollment per lead per sequence
);

-- ----------------------------------------
-- 4. Scheduled/sent email log
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS lead_drip_emails (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  enrollment_id UUID NOT NULL REFERENCES lead_drip_enrollments(id) ON DELETE CASCADE,
  step_id UUID NOT NULL REFERENCES lead_drip_steps(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES property_leads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scheduled_for TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'sent', 'failed', 'skipped')),
  resend_message_id TEXT,
  error TEXT,
  subject TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------
-- RLS
-- ----------------------------------------
ALTER TABLE lead_drip_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_drip_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_drip_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_drip_emails ENABLE ROW LEVEL SECURITY;

-- Sequences: users see own + system sequences
DO $$ BEGIN
  CREATE POLICY "Users see own and system sequences" ON lead_drip_sequences
    FOR SELECT USING (user_id = auth.uid() OR is_system = true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role full access sequences" ON lead_drip_sequences
    FOR ALL TO service_role USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Steps: follow parent sequence visibility
DO $$ BEGIN
  CREATE POLICY "Users see steps of accessible sequences" ON lead_drip_steps
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM lead_drip_sequences s
        WHERE s.id = sequence_id AND (s.user_id = auth.uid() OR s.is_system = true)
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role full access steps" ON lead_drip_steps
    FOR ALL TO service_role USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Enrollments: users manage own
DO $$ BEGIN
  CREATE POLICY "Users manage own enrollments" ON lead_drip_enrollments
    FOR ALL USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role full access enrollments" ON lead_drip_enrollments
    FOR ALL TO service_role USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Emails: users manage own
DO $$ BEGIN
  CREATE POLICY "Users manage own drip emails" ON lead_drip_emails
    FOR ALL USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role full access drip emails" ON lead_drip_emails
    FOR ALL TO service_role USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ----------------------------------------
-- Indexes
-- ----------------------------------------
CREATE INDEX IF NOT EXISTS idx_drip_enrollments_lead ON lead_drip_enrollments(lead_id);
CREATE INDEX IF NOT EXISTS idx_drip_enrollments_user ON lead_drip_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_drip_enrollments_status ON lead_drip_enrollments(status);
CREATE INDEX IF NOT EXISTS idx_drip_emails_status_sched ON lead_drip_emails(status, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_drip_emails_enrollment ON lead_drip_emails(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_drip_steps_sequence ON lead_drip_steps(sequence_id, step_number);

-- ----------------------------------------
-- Seed: Built-in "New Lead Follow-Up" sequence
-- ----------------------------------------

-- Insert the sequence
INSERT INTO lead_drip_sequences (id, user_id, name, description, trigger_event, is_active, is_system)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  NULL,
  'New Lead Follow-Up',
  'Automated 3-email sequence for new property leads. Sends immediately, then Day 3, Day 7.',
  'manual',
  true,
  true
)
ON CONFLICT DO NOTHING;

-- Step 1: Immediate — warm intro
INSERT INTO lead_drip_steps (sequence_id, step_number, delay_days, subject_template, body_template)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  1,
  0,
  'Thanks for your interest in {{address}}, {{name}}!',
  '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0A0A0A;font-family:-apple-system,BlinkMacSystemFont,''Segoe UI'',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;margin-bottom:32px;">
      <h1 style="color:#D4A017;font-size:22px;margin:0;">{{agent_name}}</h1>
      <p style="color:#888;font-size:14px;margin:8px 0 0;">Real Estate Professional</p>
    </div>
    <div style="background:#1A1A1A;border-radius:12px;padding:28px;margin-bottom:24px;border:1px solid #333;">
      <p style="color:#fff;font-size:16px;margin:0 0 16px;line-height:1.6;">Hi {{name}},</p>
      <p style="color:#fff;font-size:16px;margin:0 0 16px;line-height:1.6;">
        Thank you for your interest in <strong style="color:#D4A017;">{{address}}</strong>.
        I''m thrilled you reached out and I''d love to help you learn more about this exceptional property.
      </p>
      <p style="color:#fff;font-size:16px;margin:0 0 16px;line-height:1.6;">
        I''ll be personally reviewing your inquiry and will reach out within the next few hours.
        In the meantime, feel free to reply to this email with any questions.
      </p>
      <p style="color:#fff;font-size:16px;margin:0;line-height:1.6;">
        Looking forward to connecting with you!
      </p>
    </div>
    {{#property_site_url}}
    <div style="text-align:center;margin-bottom:24px;">
      <a href="{{property_site_url}}" style="display:inline-block;background:linear-gradient(135deg,#D4A017 0%,#B8860B 100%);color:#000;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px;">
        View Full Property Details
      </a>
    </div>
    {{/property_site_url}}
    <div style="background:#1A1A1A;border-radius:12px;padding:20px;border:1px solid #333;">
      <p style="color:#888;font-size:13px;margin:0 0 8px;text-transform:uppercase;letter-spacing:0.05em;">Your Agent</p>
      <p style="color:#fff;font-size:16px;font-weight:600;margin:0 0 4px;">{{agent_name}}</p>
      {{#agent_phone}}<p style="color:#D4A017;font-size:14px;margin:0;"><a href="tel:{{agent_phone}}" style="color:#D4A017;text-decoration:none;">{{agent_phone}}</a></p>{{/agent_phone}}
    </div>
    <p style="color:#555;font-size:12px;text-align:center;margin:24px 0 0;">
      You''re receiving this because you inquired about {{address}}.
      <a href="{{unsubscribe_url}}" style="color:#888;text-decoration:underline;">Unsubscribe</a>
    </p>
  </div>
</body>
</html>'
)
ON CONFLICT DO NOTHING;

-- Step 2: Day 3 — check-in
INSERT INTO lead_drip_steps (sequence_id, step_number, delay_days, subject_template, body_template)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  2,
  3,
  'Still interested in {{address}}?',
  '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0A0A0A;font-family:-apple-system,BlinkMacSystemFont,''Segoe UI'',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;margin-bottom:32px;">
      <h1 style="color:#D4A017;font-size:22px;margin:0;">{{agent_name}}</h1>
    </div>
    <div style="background:#1A1A1A;border-radius:12px;padding:28px;margin-bottom:24px;border:1px solid #333;">
      <p style="color:#fff;font-size:16px;margin:0 0 16px;line-height:1.6;">Hi {{name}},</p>
      <p style="color:#fff;font-size:16px;margin:0 0 16px;line-height:1.6;">
        I wanted to follow up on your inquiry about <strong style="color:#D4A017;">{{address}}</strong>.
        Properties like this don''t stay available for long, and I''d love to answer any questions you might have.
      </p>
      <p style="color:#fff;font-size:16px;margin:0 0 16px;line-height:1.6;">
        Would you like to schedule a showing? I have availability this week and would love to walk you through the property in person.
      </p>
      <p style="color:#fff;font-size:16px;margin:0;line-height:1.6;">
        Simply reply to this email or call me directly — I''m here to help!
      </p>
    </div>
    {{#property_site_url}}
    <div style="text-align:center;margin-bottom:24px;">
      <a href="{{property_site_url}}" style="display:inline-block;background:linear-gradient(135deg,#D4A017 0%,#B8860B 100%);color:#000;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px;">
        Schedule a Showing
      </a>
    </div>
    {{/property_site_url}}
    <div style="background:#1A1A1A;border-radius:12px;padding:20px;border:1px solid #333;">
      <p style="color:#888;font-size:13px;margin:0 0 8px;text-transform:uppercase;letter-spacing:0.05em;">Your Agent</p>
      <p style="color:#fff;font-size:16px;font-weight:600;margin:0 0 4px;">{{agent_name}}</p>
      {{#agent_phone}}<p style="color:#D4A017;font-size:14px;margin:0;"><a href="tel:{{agent_phone}}" style="color:#D4A017;text-decoration:none;">{{agent_phone}}</a></p>{{/agent_phone}}
    </div>
    <p style="color:#555;font-size:12px;text-align:center;margin:24px 0 0;">
      You''re receiving this because you inquired about {{address}}.
      <a href="{{unsubscribe_url}}" style="color:#888;text-decoration:underline;">Unsubscribe</a>
    </p>
  </div>
</body>
</html>'
)
ON CONFLICT DO NOTHING;

-- Step 3: Day 7 — last touch
INSERT INTO lead_drip_steps (sequence_id, step_number, delay_days, subject_template, body_template)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  3,
  7,
  'One last thing about {{address}}',
  '<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0A0A0A;font-family:-apple-system,BlinkMacSystemFont,''Segoe UI'',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;margin-bottom:32px;">
      <h1 style="color:#D4A017;font-size:22px;margin:0;">{{agent_name}}</h1>
    </div>
    <div style="background:#1A1A1A;border-radius:12px;padding:28px;margin-bottom:24px;border:1px solid #333;">
      <p style="color:#fff;font-size:16px;margin:0 0 16px;line-height:1.6;">Hi {{name}},</p>
      <p style="color:#fff;font-size:16px;margin:0 0 16px;line-height:1.6;">
        I don''t want to be a bother, so this will be my last follow-up regarding
        <strong style="color:#D4A017;">{{address}}</strong>.
      </p>
      <p style="color:#fff;font-size:16px;margin:0 0 16px;line-height:1.6;">
        If you''re still on the hunt for the perfect property, I''d love to help — whether it''s this one
        or something else entirely. The market moves fast, and having a dedicated agent in your corner makes all the difference.
      </p>
      <p style="color:#fff;font-size:16px;margin:0;line-height:1.6;">
        Whenever you''re ready, I''m here. Wishing you all the best in your search!
      </p>
    </div>
    {{#property_site_url}}
    <div style="text-align:center;margin-bottom:24px;">
      <a href="{{property_site_url}}" style="display:inline-block;background:linear-gradient(135deg,#D4A017 0%,#B8860B 100%);color:#000;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px;">
        View Property Details
      </a>
    </div>
    {{/property_site_url}}
    <div style="background:#1A1A1A;border-radius:12px;padding:20px;border:1px solid #333;">
      <p style="color:#888;font-size:13px;margin:0 0 8px;text-transform:uppercase;letter-spacing:0.05em;">Your Agent</p>
      <p style="color:#fff;font-size:16px;font-weight:600;margin:0 0 4px;">{{agent_name}}</p>
      {{#agent_phone}}<p style="color:#D4A017;font-size:14px;margin:0;"><a href="tel:{{agent_phone}}" style="color:#D4A017;text-decoration:none;">{{agent_phone}}</a></p>{{/agent_phone}}
    </div>
    <p style="color:#555;font-size:12px;text-align:center;margin:24px 0 0;">
      You''re receiving this because you inquired about {{address}}.
      <a href="{{unsubscribe_url}}" style="color:#888;text-decoration:underline;">Unsubscribe</a>
    </p>
  </div>
</body>
</html>'
)
ON CONFLICT DO NOTHING;
