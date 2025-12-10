-- =====================================================
-- TheAIVault - Update Pricing Plans Script
-- =====================================================
-- Run this script to update existing database with new pricing plans
-- This script safely updates from old plans to new plans

-- Delete old pricing plans
DELETE FROM public.pricing_plans WHERE id IN ('starter', 'creator', 'enterprise');

-- Insert new pricing plans
INSERT INTO public.pricing_plans (id, name, price, credits, features, popular) VALUES
('basic', 'Basic Pack', 99, 5, '["5 AI Creations", "HD Quality Videos", "Premium Images", "Basic Support", "Commercial License"]', false),
('pro', 'Pro Pack', 199, 12, '["12 AI Creations", "4K Quality Videos", "Ultra HD Images", "Priority Support", "Commercial License", "Advanced AI Models"]', true),
('premium', 'Premium Pack', 399, 30, '["30 AI Creations", "8K Quality Videos", "Ultra HD Images", "VIP Support", "Extended License", "Custom AI Training", "API Access"]', false)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  price = EXCLUDED.price,
  credits = EXCLUDED.credits,
  features = EXCLUDED.features,
  popular = EXCLUDED.popular;

-- Update any existing payment records to map old plan IDs to new ones (optional)
-- This ensures payment history remains intact
UPDATE public.payments
SET plan_id = CASE
  WHEN plan_id = 'starter' THEN 'basic'
  WHEN plan_id = 'creator' THEN 'pro'
  WHEN plan_id = 'enterprise' THEN 'premium'
  ELSE plan_id
END
WHERE plan_id IN ('starter', 'creator', 'enterprise');

-- Display success message
DO $$
BEGIN
  RAISE NOTICE '✅ Pricing plans updated successfully!';
  RAISE NOTICE '📦 Basic Pack: ₹99 for 5 credits';
  RAISE NOTICE '🚀 Pro Pack: ₹199 for 12 credits (Popular)';
  RAISE NOTICE '💎 Premium Pack: ₹399 for 30 credits';
  RAISE NOTICE '🔄 Payment history preserved with new plan mappings';
END $$;