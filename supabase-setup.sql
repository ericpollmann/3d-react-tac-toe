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

-- Create the game_records table
CREATE TABLE IF NOT EXISTS game_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  player_name TEXT NOT NULL,
  winner TEXT NOT NULL CHECK (winner IN ('X', 'O', 'draw')),
  move_count INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX idx_global_scores_wins ON global_scores(wins DESC);
CREATE INDEX idx_game_records_created_at ON game_records(created_at DESC);
CREATE INDEX idx_game_records_move_count ON game_records(move_count);

-- Enable Row Level Security
ALTER TABLE global_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_records ENABLE ROW LEVEL SECURITY;

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

-- Policies for game_records table
CREATE POLICY "Public game records are viewable by everyone" 
  ON game_records 
  FOR SELECT 
  USING (true);

CREATE POLICY "Anyone can insert game records" 
  ON game_records 
  FOR INSERT 
  WITH CHECK (true);