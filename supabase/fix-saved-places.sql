-- Add missing columns to saved_places
ALTER TABLE saved_places ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE saved_places ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION;
ALTER TABLE saved_places ADD COLUMN IF NOT EXISTS lon DOUBLE PRECISION;
ALTER TABLE saved_places ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE saved_places ADD COLUMN IF NOT EXISTS day_number INTEGER;
ALTER TABLE saved_places ADD COLUMN IF NOT EXISTS sort_order INTEGER;

-- Add share_id to itineraries
ALTER TABLE itineraries ADD COLUMN IF NOT EXISTS share_id TEXT UNIQUE;

-- Remove required city from itineraries (we don't use it)
ALTER TABLE itineraries ALTER COLUMN city DROP NOT NULL;

-- THIS IS THE KEY FIX - Add UPDATE policy for saved_places
CREATE POLICY "Users can update places in own itineraries" ON saved_places
  FOR UPDATE USING (
    itinerary_id IN (SELECT id FROM itineraries WHERE user_id = auth.uid())
  );
