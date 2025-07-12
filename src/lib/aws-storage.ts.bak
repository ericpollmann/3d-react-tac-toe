import AWS from 'aws-sdk';

// Configure AWS with environment variables
// The credentials should be available in the environment
AWS.config.update({
  region: process.env.AWS_REGION || 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const dynamodb = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = '3d-tic-tac-toe-games';

export interface GlobalGameRecord {
  id?: string;
  player_name: string;
  winner: 'X' | 'O' | 'draw';
  move_count: number;
  created_at: string;
}

// Check if AWS is configured
const isAWSConfigured = !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);

// Submit a game record
export async function submitGameRecord(
  playerName: string,
  winner: 'X' | 'O' | 'draw',
  moveCount: number
): Promise<boolean> {
  if (!isAWSConfigured) {
    console.log('AWS not configured, using local storage');
    return submitToLocalStorage(playerName, winner, moveCount);
  }

  try {
    const gameRecord = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      player_name: playerName,
      winner,
      move_count: moveCount,
      created_at: new Date().toISOString(),
      ttl: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) // 30 days TTL
    };

    const params = {
      TableName: TABLE_NAME,
      Item: gameRecord
    };

    await dynamodb.put(params).promise();
    console.log('Game record saved to DynamoDB');
    
    // Also save locally as backup
    submitToLocalStorage(playerName, winner, moveCount);
    return true;
  } catch (error: any) {
    console.error('Error saving to DynamoDB:', error);
    // If DynamoDB fails, check if table exists and create if needed
    if (error.code === 'ResourceNotFoundException') {
      console.log('Table does not exist, creating...');
      await createTable();
      // Retry the operation
      try {
        const gameRecord = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          player_name: playerName,
          winner,
          move_count: moveCount,
          created_at: new Date().toISOString(),
          ttl: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60)
        };

        await dynamodb.put({ TableName: TABLE_NAME, Item: gameRecord }).promise();
        console.log('Game record saved to DynamoDB after table creation');
        return true;
      } catch (retryError: any) {
        console.error('Retry failed:', retryError);
      }
    }
    
    // Fallback to localStorage
    return submitToLocalStorage(playerName, winner, moveCount);
  }
}

// Get recent games
export async function getRecentGames(limit: number = 5): Promise<GlobalGameRecord[]> {
  if (!isAWSConfigured) {
    return getFromLocalStorage('recent', limit);
  }

  try {
    const params = {
      TableName: TABLE_NAME,
      ScanIndexForward: false, // Sort in descending order
      Limit: limit
    };

    const result = await dynamodb.scan(params).promise();
    
    if (!result.Items) {
      return [];
    }

    // Sort by created_at descending
    const games = result.Items as GlobalGameRecord[];
    games.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    
    return games.slice(0, limit);
  } catch (error: any) {
    console.error('Error fetching from DynamoDB:', error);
    return getFromLocalStorage('recent', limit);
  }
}

// Get game records (least/most moves)
export async function getGameRecords(): Promise<{
  leastMoves: GlobalGameRecord | null;
  mostMoves: GlobalGameRecord | null;
}> {
  if (!isAWSConfigured) {
    return getRecordsFromLocalStorage();
  }

  try {
    const params = {
      TableName: TABLE_NAME,
      FilterExpression: 'winner <> :draw',
      ExpressionAttributeValues: {
        ':draw': 'draw'
      }
    };

    const result = await dynamodb.scan(params).promise();
    
    if (!result.Items || result.Items.length === 0) {
      return { leastMoves: null, mostMoves: null };
    }

    const games = result.Items as GlobalGameRecord[];
    games.sort((a, b) => a.move_count - b.move_count);
    
    return {
      leastMoves: games[0],
      mostMoves: games[games.length - 1]
    };
  } catch (error: any) {
    console.error('Error fetching records from DynamoDB:', error);
    return getRecordsFromLocalStorage();
  }
}

// Create DynamoDB table if it doesn't exist
async function createTable(): Promise<void> {
  const dynamodbClient = new AWS.DynamoDB();
  
  const params = {
    TableName: TABLE_NAME,
    KeySchema: [
      { AttributeName: 'id', KeyType: 'HASH' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'id', AttributeType: 'S' }
    ],
    BillingMode: 'PAY_PER_REQUEST', // Use on-demand billing for simplicity
    TimeToLiveSpecification: {
      AttributeName: 'ttl',
      Enabled: true
    }
  };

  try {
    await dynamodbClient.createTable(params).promise();
    console.log('DynamoDB table created successfully');
    
    // Wait for table to be active
    await dynamodbClient.waitFor('tableExists', { TableName: TABLE_NAME }).promise();
    console.log('Table is now active');
  } catch (error: any) {
    console.error('Error creating table:', error);
  }
}

// Local storage fallback functions
const LOCAL_STORAGE_KEY = '3d_tic_tac_toe_games_aws_fallback';

interface LocalGameData {
  games: GlobalGameRecord[];
}

function getLocalData(): LocalGameData {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    return data ? JSON.parse(data) : { games: [] };
  } catch {
    return { games: [] };
  }
}

function saveLocalData(data: LocalGameData): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  } catch (error: any) {
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
    
    data.games.push(newRecord);
    
    // Keep only last 50 games
    if (data.games.length > 50) {
      data.games = data.games.slice(-50);
    }
    
    saveLocalData(data);
    return true;
  } catch (error: any) {
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