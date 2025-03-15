export async function handler(event, context) {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle OPTIONS request (preflight)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'Preflight call successful' })
    };
  }

  // Return debug information
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      message: 'Debug endpoint is working!',
      environment: process.env.NODE_ENV,
      netlifyContext: context.clientContext?.custom?.netlify || 'No Netlify context',
      event: {
        path: event.path,
        httpMethod: event.httpMethod,
        headers: event.headers,
        queryStringParameters: event.queryStringParameters || {},
      },
      timestamp: new Date().toISOString()
    })
  };
} 