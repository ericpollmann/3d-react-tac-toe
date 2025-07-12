// AWS Lambda function for 3D Tic-Tac-Toe global scoreboard
// Handles API Gateway requests with /prod prefix

const TABLE_NAME = '3d-tic-tac-toe-games';

// CORS headers for web requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
};

exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));
  
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }
  
  try {
    // Lazy load AWS SDK to avoid import errors
    const AWS = require('aws-sdk');
    const dynamodb = new AWS.DynamoDB.DocumentClient();
    
    // Extract path and remove /prod prefix
    let path = event.path || '/';
    if (path.startsWith('/prod')) {
      path = path.substring(5); // Remove '/prod'
    }
    
    const method = event.httpMethod;
    
    console.log('Processing:', method, path);
    
    let result;
    
    if (method === 'POST' && path === '/submit-game') {
      result = await submitGame(event, dynamodb);
    } else if (method === 'GET' && path === '/recent-games') {
      result = await getRecentGames(event, dynamodb);
    } else if (method === 'GET' && path === '/game-records') {
      result = await getGameRecords(event, dynamodb);
    } else {
      console.log('Not found:', method, path);
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Not found', path: path, method: method })
      };
    }
    
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(result)
    };
    
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Internal server error', details: error.message })
    };
  }
};

// Submit a new game record
async function submitGame(event, dynamodb) {
  const body = JSON.parse(event.body || '{}');
  const { player_name, winner, move_count } = body;
  
  // Validate input
  if (!player_name || !winner || !move_count) {
    throw new Error('Missing required fields');
  }
  
  if (!['X', 'O', 'draw'].includes(winner)) {
    throw new Error('Invalid winner value');
  }
  
  if (typeof move_count !== 'number' || move_count < 1) {
    throw new Error('Invalid move count');
  }
  
  // Sanitize player name
  const sanitizedName = player_name.trim().substring(0, 20);
  
  const gameRecord = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    player_name: sanitizedName,
    winner,
    move_count,
    created_at: new Date().toISOString(),
    ttl: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) // 30 days TTL
  };
  
  try {
    // Try to create table first if it doesn't exist
    await ensureTableExists(dynamodb);
    
    await dynamodb.put({
      TableName: TABLE_NAME,
      Item: gameRecord
    }).promise();
    
    console.log('Game record saved:', gameRecord.id);
    return { success: true, id: gameRecord.id };
  } catch (error) {
    console.error('Error submitting game:', error);
    throw error;
  }
}

// Get recent games
async function getRecentGames(event, dynamodb) {
  const limit = parseInt(event.queryStringParameters?.limit) || 5;
  
  try {
    console.log('Fetching recent games, limit:', limit);
    
    const result = await dynamodb.scan({
      TableName: TABLE_NAME,
      Limit: Math.min(limit, 20) // Cap at 20 for performance
    }).promise();
    
    console.log('Scan result:', result.Items?.length || 0, 'items');
    
    if (!result.Items) {
      return { games: [] };
    }
    
    // Sort by created_at descending
    const games = result.Items.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    ).slice(0, limit);
    
    return { games };
  } catch (error) {
    console.error('Error getting recent games:', error);
    if (error.code === 'ResourceNotFoundException') {
      console.log('Table does not exist, returning empty games');
      return { games: [] };
    }
    throw error;
  }
}

// Get game records (least/most moves)
async function getGameRecords(event, dynamodb) {
  try {
    console.log('Fetching game records');
    
    const result = await dynamodb.scan({
      TableName: TABLE_NAME,
      FilterExpression: 'winner <> :draw',
      ExpressionAttributeValues: {
        ':draw': 'draw'
      }
    }).promise();
    
    console.log('Game records scan result:', result.Items?.length || 0, 'items');
    
    if (!result.Items || result.Items.length === 0) {
      return { leastMoves: null, mostMoves: null };
    }
    
    const games = result.Items.sort((a, b) => a.move_count - b.move_count);
    
    return {
      leastMoves: games[0],
      mostMoves: games[games.length - 1]
    };
  } catch (error) {
    console.error('Error getting game records:', error);
    if (error.code === 'ResourceNotFoundException') {
      console.log('Table does not exist, returning null records');
      return { leastMoves: null, mostMoves: null };
    }
    throw error;
  }
}

// Ensure DynamoDB table exists
async function ensureTableExists(dynamodb) {
  const AWS = require('aws-sdk');
  const dynamodbClient = new AWS.DynamoDB();
  
  try {
    await dynamodbClient.describeTable({ TableName: TABLE_NAME }).promise();
    console.log('Table exists');
    return; // Table exists
  } catch (error) {
    if (error.code !== 'ResourceNotFoundException') {
      console.warn('Table check error:', error);
      return; // Assume table exists if we can't check
    }
  }
  
  console.log('Creating table:', TABLE_NAME);
  
  // Create table
  const params = {
    TableName: TABLE_NAME,
    KeySchema: [
      { AttributeName: 'id', KeyType: 'HASH' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'id', AttributeType: 'S' }
    ],
    BillingMode: 'PAY_PER_REQUEST'
  };
  
  try {
    await dynamodbClient.createTable(params).promise();
    await dynamodbClient.waitFor('tableExists', { TableName: TABLE_NAME }).promise();
    console.log('Table created successfully');
  } catch (createError) {
    console.warn('Table creation error (might already exist):', createError);
  }
}