#!/bin/bash

# Simple deployment script for Lambda function
FUNCTION_NAME="tic-tac-toe-api"
REGION="us-east-1"

echo "Creating deployment package..."
zip -r function.zip game-api.js

echo "Updating Lambda function..."
aws lambda update-function-code \
    --function-name $FUNCTION_NAME \
    --zip-file fileb://function.zip \
    --region $REGION

echo "Creating simple API Gateway..."

# Create API
API_ID=$(aws apigatewayv2 create-api \
    --name tic-tac-toe-api \
    --protocol-type HTTP \
    --cors-configuration AllowOrigins="*",AllowMethods="GET,POST,OPTIONS",AllowHeaders="Content-Type" \
    --region $REGION \
    --query ApiId --output text)

echo "API ID: $API_ID"

# Get account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Create integration with correct payload format
INTEGRATION_ID=$(aws apigatewayv2 create-integration \
    --api-id $API_ID \
    --integration-type AWS_PROXY \
    --integration-uri "arn:aws:lambda:${REGION}:${ACCOUNT_ID}:function:${FUNCTION_NAME}" \
    --payload-format-version 2.0 \
    --region $REGION \
    --query IntegrationId --output text)

echo "Integration ID: $INTEGRATION_ID"

# Create catch-all route
aws apigatewayv2 create-route \
    --api-id $API_ID \
    --route-key "ANY /{proxy+}" \
    --target "integrations/$INTEGRATION_ID" \
    --region $REGION

# Create stage
aws apigatewayv2 create-stage \
    --api-id $API_ID \
    --stage-name prod \
    --auto-deploy \
    --region $REGION

# Add Lambda permission
aws lambda add-permission \
    --function-name $FUNCTION_NAME \
    --statement-id api-gateway-invoke-$(date +%s) \
    --action lambda:InvokeFunction \
    --principal apigateway.amazonaws.com \
    --source-arn "arn:aws:execute-api:${REGION}:${ACCOUNT_ID}:${API_ID}/*" \
    --region $REGION

# Get API endpoint
API_ENDPOINT=$(aws apigatewayv2 get-api --api-id $API_ID --region $REGION --query ApiEndpoint --output text)

echo ""
echo "Deployment complete!"
echo "API Endpoint: ${API_ENDPOINT}"
echo ""
echo "Test endpoints:"
echo "GET  ${API_ENDPOINT}/recent-games"
echo "GET  ${API_ENDPOINT}/game-records"
echo "POST ${API_ENDPOINT}/submit-game"
echo ""

# Clean up
rm function.zip

echo "Update your frontend to use this API endpoint: ${API_ENDPOINT}"