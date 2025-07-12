import { createClient } from '@supabase/supabase-js';

// Get Supabase configuration from environment variables or use demo instance
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://dddqnobepfdtmsefqscb.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkZHFub2JlcGZkdG1zZWZxc2NiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY1NDEzNDYsImV4cCI6MjA1MjExNzM0Nn0.8Y_AehKbE0dVpGIMS7CP8ogWrTcMlFR0vwJC0HKDsAY';

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Check if using demo instance
export const isDemoMode = supabaseUrl.includes('dddqnobepfdtmsefqscb');

export interface GlobalScore {
  id?: string;
  player_name: string;
  wins: number;
  least_moves_win: number | null;
  most_moves_win: number | null;
  created_at?: string;
  updated_at?: string;
}

// Initialize the scores table if it doesn't exist
export async function initializeDatabase() {
  try {
    // Try to fetch from table to check if it exists
    const { error } = await supabase
      .from('global_scores')
      .select('*')
      .limit(1);
    
    if (error) {
      console.warn('Global scoreboard not available:', error.message);
      return false;
    }
    
    return true;
  } catch (err) {
    console.warn('Global scoreboard not available');
    return false;
  }
}

export async function getTopScores(limit: number = 10) {
  try {
    const { data, error } = await supabase
      .from('global_scores')
      .select('*')
      .order('wins', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('Error fetching scores:', error);
      return [];
    }
    
    return data || [];
  } catch (err) {
    console.error('Error fetching scores:', err);
    return [];
  }
}

export async function submitScore(playerName: string, wins: number, leastMoves: number | null, mostMoves: number | null) {
  try {
    // Check if player already exists
    const { data: existing } = await supabase
      .from('global_scores')
      .select('*')
      .eq('player_name', playerName)
      .single();
    
    if (existing) {
      // Update existing record
      const { error } = await supabase
        .from('global_scores')
        .update({
          wins,
          least_moves_win: leastMoves,
          most_moves_win: mostMoves,
          updated_at: new Date().toISOString()
        })
        .eq('player_name', playerName);
        
      if (error) {
        console.error('Error updating score:', error);
        return false;
      }
    } else {
      // Create new record
      const { error } = await supabase
        .from('global_scores')
        .insert({
          player_name: playerName,
          wins,
          least_moves_win: leastMoves,
          most_moves_win: mostMoves
        });
        
      if (error) {
        console.error('Error creating score:', error);
        return false;
      }
    }
    
    return true;
  } catch (err) {
    console.error('Error submitting score:', err);
    return false;
  }
}