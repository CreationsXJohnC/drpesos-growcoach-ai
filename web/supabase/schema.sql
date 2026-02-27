-- ============================================================
-- Dr. Pesos Grow Coach AI — Supabase Schema
-- Run this in your Supabase SQL Editor to set up all tables
-- ============================================================

-- Enable pgvector extension for RAG knowledge base
CREATE EXTENSION IF NOT EXISTS vector;

-- ─── Subscription tier enum ────────────────────────────────────────
CREATE TYPE subscription_tier AS ENUM (
  'free',
  'grower_monthly',
  'commercial_monthly',
  'lifetime'
);

-- ─── Profiles table ───────────────────────────────────────────────
-- Extends Supabase auth.users with app-specific data
CREATE TABLE IF NOT EXISTS public.profiles (
  id                      UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email                   TEXT NOT NULL,
  subscription_tier       subscription_tier NOT NULL DEFAULT 'free',
  trial_start_date        TIMESTAMPTZ DEFAULT NOW(),
  questions_today         INTEGER NOT NULL DEFAULT 0,
  last_question_date      TIMESTAMPTZ,
  stripe_customer_id      TEXT UNIQUE,
  stripe_subscription_id  TEXT UNIQUE,
  subscription_period_end TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, trial_start_date)
  VALUES (NEW.id, NEW.email, NOW())
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── Grow Calendars ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.grow_calendars (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  setup                   JSONB NOT NULL,           -- GrowSetup object
  weeks                   JSONB NOT NULL DEFAULT '[]', -- WeekPlan[] array
  total_weeks             INTEGER NOT NULL,
  estimated_harvest_date  DATE NOT NULL,
  name                    TEXT,                     -- optional user-given name
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_grow_calendars_user_id ON public.grow_calendars(user_id);

-- ─── Grow Progress ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.grow_progress (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  calendar_id     UUID NOT NULL REFERENCES public.grow_calendars(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date            DATE NOT NULL,
  tasks_completed TEXT[] NOT NULL DEFAULT '{}',     -- array of task IDs
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(calendar_id, date)                         -- one progress record per calendar per day
);

CREATE INDEX idx_grow_progress_calendar_id ON public.grow_progress(calendar_id);
CREATE INDEX idx_grow_progress_user_id ON public.grow_progress(user_id);

-- ─── Knowledge Sources (RAG) ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.knowledge_sources (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('chapter', 'website', 'sop', 'pdf')),
  content     TEXT NOT NULL,
  embedding   vector(1536),                         -- OpenAI/Anthropic embedding dimension
  metadata    JSONB NOT NULL DEFAULT '{}',          -- chapter number, URL, etc.
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Vector similarity search function for RAG retrieval
CREATE OR REPLACE FUNCTION public.match_knowledge(
  query_embedding vector(1536),
  match_count     INTEGER DEFAULT 3
)
RETURNS TABLE (
  id         UUID,
  title      TEXT,
  content    TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT
    ks.id,
    ks.title,
    ks.content,
    1 - (ks.embedding <=> query_embedding) AS similarity
  FROM public.knowledge_sources ks
  WHERE ks.embedding IS NOT NULL
  ORDER BY ks.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ─── Helper function: check trial status ──────────────────────────
CREATE OR REPLACE FUNCTION public.check_trial_status(p_user_id UUID)
RETURNS TABLE (
  is_trial_active    BOOLEAN,
  hours_remaining    FLOAT,
  questions_remaining INTEGER
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_profile public.profiles%ROWTYPE;
  v_hours_elapsed FLOAT;
  v_today TEXT;
  v_questions_today INTEGER;
BEGIN
  SELECT * INTO v_profile FROM public.profiles WHERE id = p_user_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 0.0, 0;
    RETURN;
  END IF;

  -- Paid tiers are always active
  IF v_profile.subscription_tier != 'free' THEN
    RETURN QUERY SELECT TRUE, 999.0, 999;
    RETURN;
  END IF;

  -- Calculate hours since trial start
  v_hours_elapsed := EXTRACT(EPOCH FROM (NOW() - v_profile.trial_start_date)) / 3600;

  -- Check if trial expired
  IF v_hours_elapsed > 48 THEN
    RETURN QUERY SELECT FALSE, 0.0, 0;
    RETURN;
  END IF;

  -- Calculate questions remaining today
  v_today := CURRENT_DATE::TEXT;
  IF v_profile.last_question_date::DATE::TEXT = v_today THEN
    v_questions_today := v_profile.questions_today;
  ELSE
    v_questions_today := 0;
  END IF;

  RETURN QUERY SELECT
    TRUE,
    48.0 - v_hours_elapsed,
    GREATEST(0, 3 - v_questions_today)::INTEGER;
END;
$$;

-- ─── Row Level Security ───────────────────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grow_calendars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grow_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_sources ENABLE ROW LEVEL SECURITY;

-- Profiles: users can only read/update their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Grow calendars: users own their calendars
CREATE POLICY "Users can CRUD own grow calendars"
  ON public.grow_calendars FOR ALL
  USING (auth.uid() = user_id);

-- Grow progress: users own their progress
CREATE POLICY "Users can CRUD own grow progress"
  ON public.grow_progress FOR ALL
  USING (auth.uid() = user_id);

-- Knowledge sources: public read, service role write
CREATE POLICY "Anyone can read knowledge sources"
  ON public.knowledge_sources FOR SELECT
  USING (true);

-- ─── Indexes for performance ──────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_knowledge_embedding
  ON public.knowledge_sources USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- ─── Updated_at trigger ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_grow_calendars_updated_at
  BEFORE UPDATE ON public.grow_calendars
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── Demo Leads (Investor contacts) ───────────────────────────────
CREATE TABLE IF NOT EXISTS public.demo_leads (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT NOT NULL UNIQUE,
  name        TEXT,
  company     TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- RLS: service role only (admin reads leads from Supabase dashboard)
ALTER TABLE public.demo_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_demo_leads"
  ON public.demo_leads
  FOR ALL
  TO service_role
  USING (true);
