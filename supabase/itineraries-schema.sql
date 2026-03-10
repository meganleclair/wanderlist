-- Itineraries table - stores user trip plans
CREATE TABLE IF NOT EXISTS itineraries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Saved places table - stores places saved to itineraries
CREATE TABLE IF NOT EXISTS saved_places (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  itinerary_id UUID NOT NULL REFERENCES itineraries(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT,
  description TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_itineraries_user_id ON itineraries(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_places_itinerary_id ON saved_places(itinerary_id);

-- Enable Row Level Security
ALTER TABLE itineraries ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_places ENABLE ROW LEVEL SECURITY;

-- Policies for itineraries - users can only see/edit their own
CREATE POLICY "Users can view own itineraries" ON itineraries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own itineraries" ON itineraries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own itineraries" ON itineraries
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own itineraries" ON itineraries
  FOR DELETE USING (auth.uid() = user_id);

-- Policies for saved_places - users can only access places in their itineraries
CREATE POLICY "Users can view places in own itineraries" ON saved_places
  FOR SELECT USING (
    itinerary_id IN (SELECT id FROM itineraries WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can add places to own itineraries" ON saved_places
  FOR INSERT WITH CHECK (
    itinerary_id IN (SELECT id FROM itineraries WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can delete places from own itineraries" ON saved_places
  FOR DELETE USING (
    itinerary_id IN (SELECT id FROM itineraries WHERE user_id = auth.uid())
  );
