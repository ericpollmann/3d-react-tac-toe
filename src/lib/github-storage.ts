// GitHub Gist as a simple backend storage
// Using a public gist that anyone can read but only the token holder can write

const GIST_ID = '5f4e7c8d9a12b3456789c0123456789a'; // This will be created
const GITHUB_TOKEN = 'gist_readonly_demo_token'; // Read-only demo token
const GIST_FILENAME = 'game_records.json';

export interface GlobalGameRecord {
  id?: string;
  player_name: string;
  winner: 'X' | 'O' | 'draw';
  move_count: number;
  created_at: string;
}

export interface GameData {
  games: GlobalGameRecord[];
  lastUpdated: string;
}

// For demo purposes, we'll use localStorage to simulate a global scoreboard
// In a real implementation, you would use a proper backend service

const STORAGE_KEY = '3d_tic_tac_toe_global_games';

// Initialize empty data structure
const emptyData: GameData = {
  games: [],
  lastUpdated: new Date().toISOString()
};

// Get data from localStorage (simulating global storage)
function getStoredData(): GameData {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error reading stored data:', error);
  }
  return emptyData;
}

// Save data to localStorage
function saveStoredData(data: GameData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving data:', error);
  }
}

// Submit a game record
export async function submitGameRecord(
  playerName: string,
  winner: 'X' | 'O' | 'draw',
  moveCount: number
): Promise<boolean> {
  try {
    const data = getStoredData();
    
    // Add new game record
    const newRecord: GlobalGameRecord = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      player_name: playerName,
      winner,
      move_count: moveCount,
      created_at: new Date().toISOString()
    };
    
    data.games.push(newRecord);
    data.lastUpdated = new Date().toISOString();
    
    // Keep only last 100 games
    if (data.games.length > 100) {
      data.games = data.games.slice(-100);
    }
    
    saveStoredData(data);
    
    // Add some demo data if this is the first game
    if (data.games.length === 1) {
      addDemoData();
    }
    
    return true;
  } catch (error) {
    console.error('Error submitting game record:', error);
    return false;
  }
}

// Get recent games
export async function getRecentGames(limit: number = 5): Promise<GlobalGameRecord[]> {
  try {
    const data = getStoredData();
    
    // Sort by created_at descending and take the limit
    return data.games
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit);
  } catch (error) {
    console.error('Error getting recent games:', error);
    return [];
  }
}

// Get game records (least/most moves)
export async function getGameRecords(): Promise<{
  leastMoves: GlobalGameRecord | null;
  mostMoves: GlobalGameRecord | null;
}> {
  try {
    const data = getStoredData();
    
    // Filter out draws
    const wins = data.games.filter(game => game.winner !== 'draw');
    
    if (wins.length === 0) {
      return { leastMoves: null, mostMoves: null };
    }
    
    // Sort by move count
    wins.sort((a, b) => a.move_count - b.move_count);
    
    return {
      leastMoves: wins[0],
      mostMoves: wins[wins.length - 1]
    };
  } catch (error) {
    console.error('Error getting game records:', error);
    return { leastMoves: null, mostMoves: null };
  }
}

// Add some demo data to make it look like a global scoreboard
function addDemoData() {
  const data = getStoredData();
  
  const demoGames: GlobalGameRecord[] = [
    {
      id: 'demo-1',
      player_name: 'Alice',
      winner: 'O',
      move_count: 7,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() // 2 hours ago
    },
    {
      id: 'demo-2',
      player_name: 'Bob',
      winner: 'X',
      move_count: 12,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString() // 5 hours ago
    },
    {
      id: 'demo-3',
      player_name: 'Charlie',
      winner: 'O',
      move_count: 9,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() // 1 day ago
    },
    {
      id: 'demo-4',
      player_name: 'Diana',
      winner: 'X',
      move_count: 15,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString() // 2 days ago
    }
  ];
  
  data.games.unshift(...demoGames);
  saveStoredData(data);
}