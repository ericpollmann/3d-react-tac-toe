-- Supabase Setup for 3D Tic-Tac-Toe Global Scoreboard
-- Run this SQL in your Supabase SQL editor after creating a new project

-- Create the global_scores table
CREATE TABLE IF NOT EXISTS global_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  player_name TEXT UNIQUE NOT NULL,
  wins INTEGER DEFAULT 0,
  least_moves_win INTEGER,
  most_moves_win INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create an index on wins for faster sorting
CREATE INDEX idx_global_scores_wins ON global_scores(wins DESC);

-- Enable Row Level Security
ALTER TABLE global_scores ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anyone to read all scores
CREATE POLICY "Public scores are viewable by everyone" 
  ON global_scores 
  FOR SELECT 
  USING (true);

-- Policy: Allow anyone to insert new scores
CREATE POLICY "Anyone can insert scores" 
  ON global_scores 
  FOR INSERT 
  WITH CHECK (true);

-- Policy: Allow players to update only their own scores
CREATE POLICY "Players can update their own scores" 
  ON global_scores 
  FOR UPDATE 
  USING (true)
  WITH CHECK (true);

-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to call the function before update
CREATE TRIGGER update_global_scores_updated_at 
  BEFORE UPDATE ON global_scores 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();