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
  
  // Handle GET request
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed. Please use GET.' })
    };
  }
  
  try {
    // In a serverless environment, we can't detect system printers
    // So we'll return mock printers and a PrintNode option
    const printers = [
      {
        id: 'printer1',
        name: 'Office Printer (Mock)',
        location: 'Main Office',
        isDefault: true,
        type: 'mock'
      },
      {
        id: 'printer2',
        name: 'Warehouse Printer (Mock)',
        location: 'Warehouse',
        isDefault: false,
        type: 'mock'
      },
      {
        id: 'printer3',
        name: 'Label Printer (Mock)',
        location: 'Shipping Department',
        isDefault: false,
        type: 'mock'
      },
      {
        id: 'printnode',
        name: 'PrintNode (Cloud Printing)',
        location: 'Cloud',
        isDefault: false,
        type: 'printnode',
        description: 'Print to any printer connected to PrintNode'
      }
    ];
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(printers)
    };
  } catch (error) {
    console.error('Error fetching printers:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to fetch printers'
      })
    };
  }
} 