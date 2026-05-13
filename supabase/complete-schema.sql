-- ============================================================
-- Wanderlist — Complete Database Schema
-- Run this once in your Supabase SQL Editor (Dashboard → SQL Editor)
-- Safe to re-run: all statements use IF NOT EXISTS / IF EXISTS guards
-- ============================================================

-- ── searches ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS searches (
  id          UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  city        TEXT    NOT NULL,
  searched_at TIMESTAMPTZ DEFAULT NOW(),
  top_results_json  JSONB NOT NULL,
  hidden_gems_json  JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_searches_searched_at ON searches(searched_at DESC);

ALTER TABLE searches ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'searches' AND policyname = 'Allow all operations for anon users'
  ) THEN
    CREATE POLICY "Allow all operations for anon users" ON searches
      FOR ALL TO anon USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ── itineraries ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS itineraries (
  id         UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT    NOT NULL,
  city       TEXT,                          -- optional; not required
  share_id   TEXT    UNIQUE,               -- public share token
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_itineraries_user_id ON itineraries(user_id);

ALTER TABLE itineraries ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='itineraries' AND policyname='Users can view own itineraries') THEN
    CREATE POLICY "Users can view own itineraries"   ON itineraries FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='itineraries' AND policyname='Users can create own itineraries') THEN
    CREATE POLICY "Users can create own itineraries" ON itineraries FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='itineraries' AND policyname='Users can update own itineraries') THEN
    CREATE POLICY "Users can update own itineraries" ON itineraries FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='itineraries' AND policyname='Users can delete own itineraries') THEN
    CREATE POLICY "Users can delete own itineraries" ON itineraries FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Allow anonymous read for shared trips (trip/:shareId page)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='itineraries' AND policyname='Public can view shared itineraries') THEN
    CREATE POLICY "Public can view shared itineraries" ON itineraries
      FOR SELECT USING (share_id IS NOT NULL);
  END IF;
END $$;

-- ── saved_places ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS saved_places (
  id           UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  itinerary_id UUID    NOT NULL REFERENCES itineraries(id) ON DELETE CASCADE,
  place_id     TEXT,
  name         TEXT    NOT NULL,
  category     TEXT,
  description  TEXT,
  address      TEXT,
  city         TEXT,
  lat          DOUBLE PRECISION,
  lon          DOUBLE PRECISION,
  notes        TEXT,
  day_number   INTEGER,
  sort_order   INTEGER,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_saved_places_itinerary_id ON saved_places(itinerary_id);

ALTER TABLE saved_places ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='saved_places' AND policyname='Users can view places in own itineraries') THEN
    CREATE POLICY "Users can view places in own itineraries" ON saved_places
      FOR SELECT USING (itinerary_id IN (SELECT id FROM itineraries WHERE user_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='saved_places' AND policyname='Users can add places to own itineraries') THEN
    CREATE POLICY "Users can add places to own itineraries" ON saved_places
      FOR INSERT WITH CHECK (itinerary_id IN (SELECT id FROM itineraries WHERE user_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='saved_places' AND policyname='Users can update places in own itineraries') THEN
    CREATE POLICY "Users can update places in own itineraries" ON saved_places
      FOR UPDATE USING (itinerary_id IN (SELECT id FROM itineraries WHERE user_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='saved_places' AND policyname='Users can delete places from own itineraries') THEN
    CREATE POLICY "Users can delete places from own itineraries" ON saved_places
      FOR DELETE USING (itinerary_id IN (SELECT id FROM itineraries WHERE user_id = auth.uid()));
  END IF;
END $$;

-- Allow anonymous read for places on shared trips
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='saved_places' AND policyname='Public can view places on shared itineraries') THEN
    CREATE POLICY "Public can view places on shared itineraries" ON saved_places
      FOR SELECT USING (
        itinerary_id IN (SELECT id FROM itineraries WHERE share_id IS NOT NULL)
      );
  END IF;
END $$;

-- ── Data API grants ───────────────────────────────────────────
-- Supabase no longer auto-exposes public schema tables to the Data API.
-- Explicit GRANTs are required for PostgREST / supabase-js access.
-- Deadline for existing projects: October 30 2026.
-- Ref: https://github.com/orgs/supabase/discussions/45329
GRANT ALL    ON searches     TO anon;
GRANT SELECT ON itineraries  TO anon;
GRANT SELECT ON saved_places TO anon;
GRANT ALL    ON itineraries  TO authenticated;
GRANT ALL    ON saved_places TO authenticated;

-- ── Data API grants ───────────────────────────────────────────
-- Supabase no longer auto-exposes public schema tables; explicit grants needed.
-- Deadline for existing projects: October 30 2026.
-- Ref: https://github.com/orgs/supabase/discussions/45329
GRANT ALL    ON searches     TO anon;
GRANT SELECT ON itineraries  TO anon;
GRANT SELECT ON saved_places TO anon;
GRANT ALL    ON itineraries  TO authenticated;
GRANT ALL    ON saved_places TO authenticated;
