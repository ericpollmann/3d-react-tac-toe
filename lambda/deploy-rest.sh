#!/bin/bash

# Deploy using REST API Gateway (v1) which is simpler for Lambda proxy integration
FUNCTION_NAME="tic-tac-toe-api"
REGION="us-east-1"
API_NAME="tic-tac-toe-rest-api"

echo "Creating deployment package..."
zip -r function.zip game-api.js

echo "Updating Lambda function..."
aws lambda update-function-code \
    --function-name $FUNCTION_NAME \
    --zip-file fileb://function.zip \
    --region $REGION

# Get account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Delete existing HTTP APIs to avoid confusion
echo "Cleaning up old APIs..."
aws apigatewayv2 delete-api --api-id 2d7kuxugt2 --region $REGION 2>/dev/null || true
aws apigatewayv2 delete-api --api-id 7a3dkyn3w9 --region $REGION 2>/dev/null || true

# Create REST API
echo "Creating REST API Gateway..."
API_ID=$(aws apigateway create-rest-api \
    --name $API_NAME \
    --description "REST API for 3D Tic-Tac-Toe global scoreboard" \
    --region $REGION \
    --query 'id' --output text)

echo "API ID: $API_ID"

# Get root resource ID
ROOT_RESOURCE_ID=$(aws apigateway get-resources \
    --rest-api-id $API_ID \
    --region $REGION \
    --query 'items[?path==`/`].id' --output text)

# Create {proxy+} resource
PROXY_RESOURCE_ID=$(aws apigateway create-resource \
    --rest-api-id $API_ID \
    --parent-id $ROOT_RESOURCE_ID \
    --path-part '{proxy+}' \
    --region $REGION \
    --query 'id' --output text)

# Create ANY method on {proxy+}
aws apigateway put-method \
    --rest-api-id $API_ID \
    --resource-id $PROXY_RESOURCE_ID \
    --http-method ANY \
    --authorization-type NONE \
    --region $REGION

# Set up Lambda integration
LAMBDA_URI="arn:aws:apigateway:${REGION}:lambda:path/2015-03-31/functions/arn:aws:lambda:${REGION}:${ACCOUNT_ID}:function:${FUNCTION_NAME}/invocations"

aws apigateway put-integration \
    --rest-api-id $API_ID \
    --resource-id $PROXY_RESOURCE_ID \
    --http-method ANY \
    --type AWS_PROXY \
    --integration-http-method POST \
    --uri $LAMBDA_URI \
    --region $REGION

# Set up CORS for OPTIONS
aws apigateway put-method \
    --rest-api-id $API_ID \
    --resource-id $PROXY_RESOURCE_ID \
    --http-method OPTIONS \
    --authorization-type NONE \
    --region $REGION

aws apigateway put-method-response \
    --rest-api-id $API_ID \
    --resource-id $PROXY_RESOURCE_ID \
    --http-method OPTIONS \
    --status-code 200 \
    --response-parameters method.response.header.Access-Control-Allow-Headers=false,method.response.header.Access-Control-Allow-Methods=false,method.response.header.Access-Control-Allow-Origin=false \
    --region $REGION

aws apigateway put-integration \
    --rest-api-id $API_ID \
    --resource-id $PROXY_RESOURCE_ID \
    --http-method OPTIONS \
    --type MOCK \
    --request-templates '{"application/json":"{\"statusCode\":200}"}' \
    --region $REGION

aws apigateway put-integration-response \
    --rest-api-id $API_ID \
    --resource-id $PROXY_RESOURCE_ID \
    --http-method OPTIONS \
    --status-code 200 \
    --response-parameters method.response.header.Access-Control-Allow-Headers="'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",method.response.header.Access-Control-Allow-Methods="'GET,POST,OPTIONS'",method.response.header.Access-Control-Allow-Origin="'*'" \
    --region $REGION

# Deploy the API
aws apigateway create-deployment \
    --rest-api-id $API_ID \
    --stage-name prod \
    --region $REGION

# Add Lambda permission
aws lambda add-permission \
    --function-name $FUNCTION_NAME \
    --statement-id api-gateway-invoke-rest-$(date +%s) \
    --action lambda:InvokeFunction \
    --principal apigateway.amazonaws.com \
    --source-arn "arn:aws:execute-api:${REGION}:${ACCOUNT_ID}:${API_ID}/*/*" \
    --region $REGION

# Get API endpoint
API_ENDPOINT="https://${API_ID}.execute-api.${REGION}.amazonaws.com/prod"

echo ""
echo "Deployment complete!"
echo "API Endpoint: $API_ENDPOINT"
echo ""
echo "Test endpoints:"
echo "GET  ${API_ENDPOINT}/recent-games"
echo "GET  ${API_ENDPOINT}/game-records"
echo "POST ${API_ENDPOINT}/submit-game"
echo ""

# Clean up
rm function.zip

echo "Update your frontend to use this API endpoint: $API_ENDPOINT"