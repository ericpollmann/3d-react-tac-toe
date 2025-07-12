// Lambda API storage for truly global scoreboard
// Uses HTTP requests to AWS Lambda function (no credentials needed in frontend)

export interface GlobalGameRecord {
  id?: string;
  player_name: string;
  winner: 'X' | 'O' | 'draw';
  move_count: number;
  created_at: string;
}

// Configure the API endpoint
// This will be set to your actual Lambda API Gateway URL after deployment
const API_BASE_URL = process.env.REACT_APP_API_URL || '';

// Check if API is configured
const isAPIConfigured = !!API_BASE_URL;

// Submit a game record
export async function submitGameRecord(
  playerName: string,
  winner: 'X' | 'O' | 'draw',
  moveCount: number
): Promise<boolean> {
  if (!isAPIConfigured) {
    console.log('API not configured, using local storage');
    return submitToLocalStorage(playerName, winner, moveCount);
  }

  try {
    const response = await fetch(`${API_BASE_URL}/submit-game`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        player_name: playerName,
        winner,
        move_count: moveCount
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('Game record saved to global API:', result);
    
    // Also save locally as backup
    submitToLocalStorage(playerName, winner, moveCount);
    return true;
  } catch (error) {
    console.error('Error submitting to API:', error);
    // Fallback to localStorage
    return submitToLocalStorage(playerName, winner, moveCount);
  }
}

// Get recent games
export async function getRecentGames(limit: number = 5): Promise<GlobalGameRecord[]> {
  if (!isAPIConfigured) {
    return getFromLocalStorage('recent', limit);
  }

  try {
    const response = await fetch(`${API_BASE_URL}/recent-games?limit=${limit}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result.games || [];
  } catch (error) {
    console.error('Error fetching from API:', error);
    return getFromLocalStorage('recent', limit);
  }
}

// Get game records (least/most moves)
export async function getGameRecords(): Promise<{
  leastMoves: GlobalGameRecord | null;
  mostMoves: GlobalGameRecord | null;
}> {
  if (!isAPIConfigured) {
    return getRecordsFromLocalStorage();
  }

  try {
    const response = await fetch(`${API_BASE_URL}/game-records`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return {
      leastMoves: result.leastMoves,
      mostMoves: result.mostMoves
    };
  } catch (error) {
    console.error('Error fetching records from API:', error);
    return getRecordsFromLocalStorage();
  }
}

// Local storage fallback functions
const LOCAL_STORAGE_KEY = '3d_tic_tac_toe_games_api_fallback';

interface LocalGameData {
  games: GlobalGameRecord[];
}

function getLocalData(): LocalGameData {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error reading localStorage:', error);
  }
  
  // Return demo data for better UX
  return {
    games: [
      {
        id: 'demo-1',
        player_name: 'Alex',
        winner: 'O',
        move_count: 7,
        created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString()
      },
      {
        id: 'demo-2',
        player_name: 'Sam',
        winner: 'X',
        move_count: 12,
        created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString()
      },
      {
        id: 'demo-3',
        player_name: 'Jordan',
        winner: 'O',
        move_count: 5,
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString()
      }
    ]
  };
}

function saveLocalData(data: LocalGameData): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
}

function submitToLocalStorage(
  playerName: string,
  winner: 'X' | 'O' | 'draw',
  moveCount: number
): boolean {
  try {
    const data = getLocalData();
    const newRecord: GlobalGameRecord = {
      id: `local-${Date.now()}`,
      player_name: playerName,
      winner,
      move_count: moveCount,
      created_at: new Date().toISOString()
    };
    
    data.games.unshift(newRecord);
    
    // Keep only last 20 games
    if (data.games.length > 20) {
      data.games = data.games.slice(0, 20);
    }
    
    saveLocalData(data);
    return true;
  } catch (error) {
    console.error('Error saving to localStorage:', error);
    return false;
  }
}

function getFromLocalStorage(type: 'recent', limit: number): GlobalGameRecord[] {
  const data = getLocalData();
  return data.games
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, limit);
}

function getRecordsFromLocalStorage(): {
  leastMoves: GlobalGameRecord | null;
  mostMoves: GlobalGameRecord | null;
} {
  const data = getLocalData();
  const wins = data.games.filter(game => game.winner !== 'draw');
  
  if (wins.length === 0) {
    return { leastMoves: null, mostMoves: null };
  }
  
  wins.sort((a, b) => a.move_count - b.move_count);
  
  return {
    leastMoves: wins[0],
    mostMoves: wins[wins.length - 1]
  };
}