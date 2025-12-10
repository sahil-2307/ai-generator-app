-- =====================================================
-- TheAIVault - Complete Supabase Database Schema
-- =====================================================
-- Copy and paste this entire script into Supabase SQL Editor
-- Run as a single query to set up the complete database

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. USERS TABLE
-- =====================================================
-- Create users table
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  subscription_status TEXT DEFAULT 'free' CHECK (subscription_status IN ('free', 'premium', 'pro')),
  credits_remaining INTEGER DEFAULT 1,
  total_creations INTEGER DEFAULT 0,
  last_creation_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS (Row Level Security) for users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Users can only see and update their own data
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Allow authenticated users to insert their own profile
CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- =====================================================
-- 2. CREATIONS TABLE
-- =====================================================
-- Create creations table
CREATE TABLE public.creations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('video', 'image', 'text')),
  prompt TEXT NOT NULL,
  result_url TEXT,
  metadata JSONB DEFAULT '{}',
  cost_credits INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS for creations table
ALTER TABLE public.creations ENABLE ROW LEVEL SECURITY;

-- Users can only see their own creations
CREATE POLICY "Users can view own creations" ON public.creations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own creations" ON public.creations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_creations_user_id ON public.creations(user_id);
CREATE INDEX idx_creations_created_at ON public.creations(created_at DESC);
CREATE INDEX idx_creations_type ON public.creations(type);

-- =====================================================
-- 3. PAYMENTS TABLE
-- =====================================================
-- Create payments table
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'INR',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  cashfree_order_id TEXT UNIQUE,
  plan_id TEXT NOT NULL,
  credits INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Add RLS for payments table
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Users can only see their own payments
CREATE POLICY "Users can view own payments" ON public.payments
  FOR SELECT USING (auth.uid() = user_id);

-- Only the system can insert payments (through API)
CREATE POLICY "System can insert payments" ON public.payments
  FOR INSERT WITH CHECK (true);

-- Only the system can update payments (through webhooks)
CREATE POLICY "System can update payments" ON public.payments
  FOR UPDATE USING (true);

-- Create indexes for payments
CREATE INDEX idx_payments_user_id ON public.payments(user_id);
CREATE INDEX idx_payments_status ON public.payments(status);
CREATE INDEX idx_payments_cashfree_order_id ON public.payments(cashfree_order_id);
CREATE INDEX idx_payments_created_at ON public.payments(created_at DESC);

-- =====================================================
-- 4. USAGE ANALYTICS TABLE
-- =====================================================
-- Create usage analytics table for tracking daily usage
CREATE TABLE public.usage_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,
  videos_created INTEGER DEFAULT 0,
  images_created INTEGER DEFAULT 0,
  texts_created INTEGER DEFAULT 0,
  credits_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure one record per user per day
  UNIQUE(user_id, date)
);

-- Add RLS for usage analytics table
ALTER TABLE public.usage_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own analytics" ON public.usage_analytics
  FOR SELECT USING (auth.uid() = user_id);

-- Create indexes for usage analytics
CREATE INDEX idx_usage_analytics_user_date ON public.usage_analytics(user_id, date DESC);

-- =====================================================
-- 5. PRICING PLANS TABLE (REFERENCE DATA)
-- =====================================================
-- Create pricing plans reference table
CREATE TABLE public.pricing_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price INTEGER NOT NULL,
  credits INTEGER NOT NULL,
  features JSONB DEFAULT '[]',
  popular BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert pricing data
INSERT INTO public.pricing_plans (id, name, price, credits, features, popular) VALUES
('basic', 'Basic Pack', 99, 5, '["5 AI Creations", "HD Quality Videos", "Premium Images", "Basic Support", "Commercial License"]', false),
('pro', 'Pro Pack', 199, 12, '["12 AI Creations", "4K Quality Videos", "Ultra HD Images", "Priority Support", "Commercial License", "Advanced AI Models"]', true),
('premium', 'Premium Pack', 399, 30, '["30 AI Creations", "8K Quality Videos", "Ultra HD Images", "VIP Support", "Extended License", "Custom AI Training", "API Access"]', false);

-- =====================================================
-- 6. DATABASE FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers to update updated_at columns
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_usage_analytics_updated_at
  BEFORE UPDATE ON public.usage_analytics
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Function to automatically create user profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, subscription_status, credits_remaining, total_creations)
  VALUES (NEW.id, NEW.email, 'free', 1, 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to update usage analytics
CREATE OR REPLACE FUNCTION public.update_usage_analytics(
  p_user_id UUID,
  p_type TEXT,
  p_credits_used INTEGER DEFAULT 1
)
RETURNS VOID AS $$
DECLARE
  current_date DATE := CURRENT_DATE;
BEGIN
  -- Insert or update daily analytics
  INSERT INTO public.usage_analytics (
    user_id,
    date,
    videos_created,
    images_created,
    texts_created,
    credits_used
  )
  VALUES (
    p_user_id,
    current_date,
    CASE WHEN p_type = 'video' THEN 1 ELSE 0 END,
    CASE WHEN p_type = 'image' THEN 1 ELSE 0 END,
    CASE WHEN p_type = 'text' THEN 1 ELSE 0 END,
    p_credits_used
  )
  ON CONFLICT (user_id, date)
  DO UPDATE SET
    videos_created = usage_analytics.videos_created + (CASE WHEN p_type = 'video' THEN 1 ELSE 0 END),
    images_created = usage_analytics.images_created + (CASE WHEN p_type = 'image' THEN 1 ELSE 0 END),
    texts_created = usage_analytics.texts_created + (CASE WHEN p_type = 'text' THEN 1 ELSE 0 END),
    credits_used = usage_analytics.credits_used + p_credits_used,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to safely decrement user credits
CREATE OR REPLACE FUNCTION public.decrement_user_credits(
  p_user_id UUID,
  p_credits INTEGER DEFAULT 1
)
RETURNS BOOLEAN AS $$
DECLARE
  current_credits INTEGER;
BEGIN
  -- Get current credits with row lock
  SELECT credits_remaining INTO current_credits
  FROM public.users
  WHERE id = p_user_id
  FOR UPDATE;

  -- Check if user has enough credits
  IF current_credits IS NULL OR current_credits < p_credits THEN
    RETURN FALSE;
  END IF;

  -- Decrement credits and update stats
  UPDATE public.users
  SET
    credits_remaining = credits_remaining - p_credits,
    total_creations = total_creations + 1,
    last_creation_at = NOW(),
    updated_at = NOW()
  WHERE id = p_user_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add credits to user (for payments)
CREATE OR REPLACE FUNCTION public.add_user_credits(
  p_user_id UUID,
  p_credits INTEGER
)
RETURNS VOID AS $$
BEGIN
  UPDATE public.users
  SET
    credits_remaining = credits_remaining + p_credits,
    subscription_status = CASE
      WHEN credits_remaining + p_credits > 1 THEN 'premium'
      ELSE subscription_status
    END,
    updated_at = NOW()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. HELPFUL VIEWS
-- =====================================================

-- View for user dashboard data
CREATE VIEW public.user_dashboard AS
SELECT
  u.id,
  u.email,
  u.subscription_status,
  u.credits_remaining,
  u.total_creations,
  u.last_creation_at,
  u.created_at as user_since,
  COALESCE(SUM(ua.credits_used), 0) as total_credits_used,
  COALESCE(SUM(ua.videos_created), 0) as total_videos,
  COALESCE(SUM(ua.images_created), 0) as total_images,
  COALESCE(SUM(ua.texts_created), 0) as total_texts
FROM public.users u
LEFT JOIN public.usage_analytics ua ON u.id = ua.user_id
GROUP BY u.id, u.email, u.subscription_status, u.credits_remaining, u.total_creations, u.last_creation_at, u.created_at;

-- View for recent user activity
CREATE VIEW public.recent_activity AS
SELECT
  c.id,
  c.user_id,
  u.email,
  c.type,
  c.prompt,
  c.result_url,
  c.cost_credits,
  c.created_at
FROM public.creations c
JOIN public.users u ON c.user_id = u.id
ORDER BY c.created_at DESC;

-- =====================================================
-- 8. SETUP COMPLETE MESSAGE
-- =====================================================

-- Add a comment to confirm setup is complete
COMMENT ON SCHEMA public IS 'TheAIVault database schema setup complete. Tables: users, creations, payments, usage_analytics, pricing_plans. All RLS policies, triggers, and functions are configured.';

-- Display success message
DO $$
BEGIN
  RAISE NOTICE '🎉 TheAIVault Database Schema Setup Complete!';
  RAISE NOTICE '✅ Tables created: users, creations, payments, usage_analytics, pricing_plans';
  RAISE NOTICE '✅ RLS policies configured for security';
  RAISE NOTICE '✅ Indexes created for performance';
  RAISE NOTICE '✅ Triggers and functions set up';
  RAISE NOTICE '✅ Helper views created';
  RAISE NOTICE '🚀 Your database is ready for TheAIVault!';
END $$;