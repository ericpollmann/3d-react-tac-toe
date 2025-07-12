#!/bin/bash

# Deploy AWS Lambda function for 3D Tic-Tac-Toe API
# Make sure you have AWS CLI configured with appropriate credentials

FUNCTION_NAME="tic-tac-toe-api"
REGION="us-east-1"

echo "Creating deployment package..."
zip -r function.zip game-api.js

echo "Checking if function exists..."
aws lambda get-function --function-name $FUNCTION_NAME --region $REGION > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "Function exists, updating code..."
    aws lambda update-function-code \
        --function-name $FUNCTION_NAME \
        --zip-file fileb://function.zip \
        --region $REGION
else
    echo "Creating new function..."
    
    # Create IAM role for Lambda if it doesn't exist
    aws iam get-role --role-name tic-tac-toe-lambda-role > /dev/null 2>&1
    if [ $? -ne 0 ]; then
        echo "Creating IAM role..."
        aws iam create-role \
            --role-name tic-tac-toe-lambda-role \
            --assume-role-policy-document '{
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "lambda.amazonaws.com"
                        },
                        "Action": "sts:AssumeRole"
                    }
                ]
            }'
        
        # Attach policies
        aws iam attach-role-policy \
            --role-name tic-tac-toe-lambda-role \
            --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
        
        aws iam attach-role-policy \
            --role-name tic-tac-toe-lambda-role \
            --policy-arn arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess
        
        echo "Waiting for role to be ready..."
        sleep 10
    fi
    
    # Get account ID
    ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    ROLE_ARN="arn:aws:iam::${ACCOUNT_ID}:role/tic-tac-toe-lambda-role"
    
    # Create function
    aws lambda create-function \
        --function-name $FUNCTION_NAME \
        --runtime nodejs18.x \
        --role $ROLE_ARN \
        --handler game-api.handler \
        --zip-file fileb://function.zip \
        --timeout 30 \
        --memory-size 128 \
        --region $REGION
fi

echo "Creating API Gateway..."

# Create or update API Gateway
API_ID=$(aws apigatewayv2 get-apis --region $REGION --query "Items[?Name=='tic-tac-toe-api'].ApiId" --output text)

if [ -z "$API_ID" ] || [ "$API_ID" = "None" ]; then
    echo "Creating new API Gateway..."
    API_ID=$(aws apigatewayv2 create-api \
        --name tic-tac-toe-api \
        --protocol-type HTTP \
        --cors-configuration AllowOrigins="*",AllowMethods="GET,POST,OPTIONS",AllowHeaders="Content-Type" \
        --region $REGION \
        --query ApiId --output text)
    
    echo "API ID: $API_ID"
    
    # Create integration
    INTEGRATION_ID=$(aws apigatewayv2 create-integration \
        --api-id $API_ID \
        --integration-type AWS_PROXY \
        --integration-uri "arn:aws:lambda:${REGION}:${ACCOUNT_ID}:function:${FUNCTION_NAME}" \
        --payload-format-version 1.0 \
        --region $REGION \
        --query IntegrationId --output text)
    
    # Create routes
    aws apigatewayv2 create-route \
        --api-id $API_ID \
        --route-key "POST /submit-game" \
        --target "integrations/$INTEGRATION_ID" \
        --region $REGION
    
    aws apigatewayv2 create-route \
        --api-id $API_ID \
        --route-key "GET /recent-games" \
        --target "integrations/$INTEGRATION_ID" \
        --region $REGION
    
    aws apigatewayv2 create-route \
        --api-id $API_ID \
        --route-key "GET /game-records" \
        --target "integrations/$INTEGRATION_ID" \
        --region $REGION
    
    aws apigatewayv2 create-route \
        --api-id $API_ID \
        --route-key "OPTIONS /{proxy+}" \
        --target "integrations/$INTEGRATION_ID" \
        --region $REGION
    
    # Create stage
    aws apigatewayv2 create-stage \
        --api-id $API_ID \
        --stage-name prod \
        --auto-deploy \
        --region $REGION
    
    # Add Lambda permission for API Gateway
    aws lambda add-permission \
        --function-name $FUNCTION_NAME \
        --statement-id api-gateway-invoke \
        --action lambda:InvokeFunction \
        --principal apigateway.amazonaws.com \
        --source-arn "arn:aws:execute-api:${REGION}:${ACCOUNT_ID}:${API_ID}/*" \
        --region $REGION
fi

# Get API endpoint
API_ENDPOINT=$(aws apigatewayv2 get-api --api-id $API_ID --region $REGION --query ApiEndpoint --output text)

echo ""
echo "Deployment complete!"
echo "API Endpoint: ${API_ENDPOINT}/prod"
echo ""
echo "Test endpoints:"
echo "GET  ${API_ENDPOINT}/prod/recent-games"
echo "GET  ${API_ENDPOINT}/prod/game-records"
echo "POST ${API_ENDPOINT}/prod/submit-game"
echo ""
echo "Clean up..."
rm function.zip

echo "Update your frontend to use this API endpoint: ${API_ENDPOINT}/prod"