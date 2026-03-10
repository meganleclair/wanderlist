-- Wanderlist Database Schema
-- Run this in your Supabase SQL Editor to create the required table

-- Create the searches table
CREATE TABLE IF NOT EXISTS searches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  city TEXT NOT NULL,
  searched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  top_results_json JSONB NOT NULL,
  hidden_gems_json JSONB NOT NULL
);

-- Create an index on searched_at for faster recent searches queries
CREATE INDEX IF NOT EXISTS idx_searches_searched_at ON searches(searched_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE searches ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations for anonymous users
-- (For a production app, you'd want more restrictive policies)
CREATE POLICY "Allow all operations for anon users" ON searches
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);
