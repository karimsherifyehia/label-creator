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
    // ALWAYS include PrintNode in the printers array
    const printers = [
      {
        id: 'printnode',
        name: 'PrintNode (Cloud Printing)',
        location: 'Cloud',
        isDefault: false,
        type: 'printnode',
        description: 'Print to any printer connected to PrintNode'
      },
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
      }
    ];
    
    console.log('Returning printers including PrintNode:', printers);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(printers)
    };
  } catch (error) {
    console.error('Error fetching printers:', error);
    
    // Even in case of error, return PrintNode option
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify([
        {
          id: 'printnode',
          name: 'PrintNode (Cloud Printing)',
          location: 'Cloud',
          isDefault: false,
          type: 'printnode',
          description: 'Print to any printer connected to PrintNode'
        }
      ])
    };
  }
} 