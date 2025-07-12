import { createClient } from '@supabase/supabase-js';

// These are public keys, safe to expose in frontend code
const supabaseUrl = 'https://your-project.supabase.co';
const supabaseAnonKey = 'your-anon-key';

// For the demo, we'll use a public test instance
// In production, you would create your own Supabase project
export const supabase = createClient(
  'https://xwqyktjhqrpbwjxqcgvg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3cXlrdGpocXJwYndqeHFjZ3ZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY1MzgwNjEsImV4cCI6MjA1MjExNDA2MX0.ZKZCWx-wJQ9cE7qyGvQMPqU7TfUk9fWb0xwDOHplrQo'
);

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
  // The table should be created via Supabase dashboard, but we can check if it exists
  const { data, error } = await supabase
    .from('global_scores')
    .select('*')
    .limit(1);
    
  if (error && error.code === '42P01') {
    console.log('Table does not exist. Please create it in Supabase dashboard.');
  }
}

export async function getTopScores(limit: number = 10) {
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
}

export async function submitScore(playerName: string, wins: number, leastMoves: number | null, mostMoves: number | null) {
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
}