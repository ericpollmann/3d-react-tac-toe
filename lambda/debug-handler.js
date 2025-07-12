// Debug handler to see what API Gateway is sending

exports.handler = async (event) => {
  console.log('Full Event:', JSON.stringify(event, null, 2));
  
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
    },
    body: JSON.stringify({
      message: 'Debug response',
      receivedEvent: event,
      path: event.path || event.rawPath || event.pathParameters,
      method: event.httpMethod || event.requestContext?.http?.method,
      queryParams: event.queryStringParameters || event.queryParameters
    })
  };
};