# AWS Lambda API for 3D Tic-Tac-Toe Global Scoreboard

This folder contains the serverless backend for the 3D Tic-Tac-Toe global scoreboard functionality.

## Architecture

- **AWS Lambda**: Handles API requests without exposing credentials to the frontend
- **API Gateway**: Provides HTTP endpoints with CORS support
- **DynamoDB**: Stores game records with automatic TTL (30 days)
- **IAM Roles**: Secure access to AWS services

## Deployment

### Prerequisites

1. AWS CLI installed and configured with appropriate credentials
2. Permissions to create Lambda functions, API Gateway, IAM roles, and DynamoDB tables

### Deploy the API

1. Navigate to the lambda directory:
   ```bash
   cd lambda
   ```

2. Run the deployment script:
   ```bash
   ./deploy.sh
   ```

3. The script will output an API endpoint URL like:
   ```
   https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/prod
   ```

4. Update your frontend environment variable:
   ```bash
   # For local development
   echo "REACT_APP_API_URL=https://your-api-url/prod" >> .env.local
   
   # For production deployment, set this in your build environment
   export REACT_APP_API_URL=https://your-api-url/prod
   ```

## API Endpoints

### POST /submit-game
Submit a new game record to the global scoreboard.

**Request Body:**
```json
{
  "player_name": "PlayerName",
  "winner": "X" | "O" | "draw",
  "move_count": 7
}
```

**Response:**
```json
{
  "success": true,
  "id": "1234567890-abcdef"
}
```

### GET /recent-games
Get the most recent games from all players.

**Query Parameters:**
- `limit` (optional): Number of games to return (default: 5, max: 20)

**Response:**
```json
{
  "games": [
    {
      "id": "1234567890-abcdef",
      "player_name": "PlayerName",
      "winner": "O",
      "move_count": 7,
      "created_at": "2025-01-12T10:30:00.000Z"
    }
  ]
}
```

### GET /game-records
Get the records for fastest and slowest wins.

**Response:**
```json
{
  "leastMoves": {
    "id": "1234567890-abcdef",
    "player_name": "SpeedRunner",
    "winner": "X",
    "move_count": 5,
    "created_at": "2025-01-12T10:30:00.000Z"
  },
  "mostMoves": {
    "id": "0987654321-fedcba",
    "player_name": "Strategist",
    "winner": "O",
    "move_count": 15,
    "created_at": "2025-01-12T09:15:00.000Z"
  }
}
```

## Security Features

- **No credentials in frontend**: All AWS operations happen in Lambda
- **Input validation**: Sanitizes and validates all user input
- **CORS enabled**: Allows requests from your frontend domain
- **TTL enabled**: Automatic cleanup of old records
- **IAM least privilege**: Lambda only has necessary DynamoDB permissions

## Cost Optimization

- **Pay-per-request**: DynamoDB uses on-demand billing
- **Lambda free tier**: First 1M requests per month are free
- **Automatic cleanup**: TTL removes old records to minimize storage costs
- **Efficient queries**: Optimized for minimal read/write operations

## Monitoring

You can monitor the API through AWS CloudWatch:
- Lambda function logs
- API Gateway access logs
- DynamoDB metrics

## Cleanup

To remove all resources:

```bash
# Delete the Lambda function
aws lambda delete-function --function-name tic-tac-toe-api

# Delete the API Gateway (get API ID first)
aws apigatewayv2 delete-api --api-id YOUR_API_ID

# Delete the DynamoDB table
aws dynamodb delete-table --table-name 3d-tic-tac-toe-games

# Delete the IAM role
aws iam detach-role-policy --role-name tic-tac-toe-lambda-role --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
aws iam detach-role-policy --role-name tic-tac-toe-lambda-role --policy-arn arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess
aws iam delete-role --role-name tic-tac-toe-lambda-role
```