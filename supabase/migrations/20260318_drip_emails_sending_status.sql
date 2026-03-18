-- Add 'sending' to lead_drip_emails status CHECK constraint
-- Required for atomic claim pattern in drip-sequences cron
ALTER TABLE lead_drip_emails DROP CONSTRAINT IF EXISTS lead_drip_emails_status_check;
ALTER TABLE lead_drip_emails ADD CONSTRAINT lead_drip_emails_status_check
  CHECK (status IN ('scheduled', 'sending', 'sent', 'failed', 'skipped'));
