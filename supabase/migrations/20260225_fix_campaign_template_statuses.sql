-- ============================================
-- Fix campaign template trigger_status mismatch
-- Seed data used 'new' but engine.ts expects 'just_listed'
-- ============================================

-- Update the "Just Listed" template to match engine expectations
UPDATE campaign_templates
SET trigger_status = 'just_listed'
WHERE trigger_status = 'new';

-- Ensure all expected statuses have templates (upsert missing ones)
INSERT INTO campaign_templates (name, trigger_status, platforms, caption_template, hashtags, post_delay_hours)
VALUES
  ('Just Listed', 'just_listed', ARRAY['facebook', 'instagram', 'linkedin'],
   '🏡 Just Listed! {{address}} - {{bedrooms}} bed, {{bathrooms}} bath | {{price}} | {{description}}',
   ARRAY['#JustListed', '#NewListing', '#RealEstate', '#HomeForSale', '#DreamHome'], 0),
  ('Coming Soon', 'coming_soon', ARRAY['facebook', 'instagram'],
   '🔜 Coming Soon! Get ready for this amazing property at {{address}}. Stay tuned for more details!',
   ARRAY['#ComingSoon', '#RealEstate', '#NewListing', '#StayTuned'], 0),
  ('Open House', 'open_house', ARRAY['facebook', 'instagram', 'linkedin'],
   '🏠 Open House Alert! Join us at {{address}} | {{open_house_date}} | {{price}}',
   ARRAY['#OpenHouse', '#RealEstate', '#HomeForSale', '#HouseHunting'], 0),
  ('Price Reduced', 'price_drop', ARRAY['facebook', 'instagram'],
   '💰 Price Reduced! {{address}} now offered at {{price}}. Don''t miss this opportunity!',
   ARRAY['#PriceReduced', '#PriceDrop', '#RealEstate', '#GreatDeal'], 0),
  ('Under Contract', 'under_contract', ARRAY['facebook', 'instagram'],
   '🎉 Under Contract! Congratulations to all parties on {{address}}!',
   ARRAY['#UnderContract', '#RealEstate', '#Sold', '#Congratulations'], 0),
  ('Just Sold', 'sold', ARRAY['facebook', 'instagram', 'linkedin'],
   '🎊 SOLD! Another happy homeowner at {{address}}. Thinking of buying or selling? Let''s talk!',
   ARRAY['#JustSold', '#Sold', '#RealEstate', '#ClosingDay', '#HappyHomeowners'], 0)
ON CONFLICT DO NOTHING;
