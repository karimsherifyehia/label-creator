const axios = require('axios');
const { google } = require('googleapis');

// Function to populate a Google Slide with data and export as PDF
async function populateGoogleSlide(slideUrl, itemData) {
  try {
    console.log('Populating Google Slide with data:', itemData);
    
    // For Netlify Functions, we'll return a dummy PDF buffer
    // In a real implementation, you would need to set up Google API authentication
    // using environment variables and populate the slide template
    
    console.log('Using mock PDF for Netlify Function demo');
    // This is a tiny valid PDF for demo purposes
    const mockPdfBuffer = Buffer.from(
      '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj 3 0 obj<</Type/Page/MediaBox[0 0 3 3]>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000010 00000 n\n0000000053 00000 n\n0000000102 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n149\n%%EOF',
      'utf-8'
    );
    
    return mockPdfBuffer;
  } catch (error) {
    console.error('Error populating Google Slide:', error);
    throw new Error('Failed to populate Google Slide template');
  }
}

// Function to print using PrintNode API
async function printWithPrintNode(apiKey, printerId, documentBuffer, options = {}) {
  try {
    console.log(`Printing to PrintNode printer ${printerId}`);
    
    // Convert buffer to base64
    const base64Content = documentBuffer.toString('base64');
    
    // Prepare request data
    const data = {
      printer: parseInt(printerId, 10),
      title: options.title || `Label-${Date.now()}`,
      contentType: "pdf_base64",
      content: base64Content,
      source: "Label Creator App",
      options: {
        fit_to_page: true,
        copies: options.copies || 1
      }
    };
    
    // Log request (without the actual base64 content for brevity)
    console.log('PrintNode request:', {
      ...data,
      content: `${base64Content.substring(0, 20)}...` // Truncate for logging
    });
    
    // Create authorization header from API key
    const authHeader = `Basic ${apiKey}`;
    
    // Send request to PrintNode API
    const response = await axios.post('https://api.printnode.com/printjobs', data, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      }
    });
    
    console.log('PrintNode response:', response.data);
    
    return {
      success: true,
      printerId,
      printNodeJobId: response.data,
      timestamp: new Date().toISOString(),
      provider: 'printnode'
    };
  } catch (error) {
    console.error('PrintNode printing error:', error.response?.data || error.message);
    throw new Error(`PrintNode printing failed: ${error.response?.data?.message || error.message}`);
  }
}

// Use CommonJS exports for the handler
exports.handler = async function(event, context) {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
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
  
  // Handle POST request
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed. Please use POST.' })
    };
  }
  
  try {
    const body = JSON.parse(event.body);
    const { slideUrl, printerId, itemData, printOptions } = body;
    
    if (!slideUrl || !printerId || !itemData) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Missing required parameters: slideUrl, printerId, and itemData' 
        })
      };
    }
    
    // Only PrintNode is supported in serverless environment
    if (printerId !== 'printnode') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Only PrintNode printing is supported in this environment. Please select PrintNode as your printer.'
        })
      };
    }
    
    if (!printOptions || !printOptions.printNodeApiKey || !printOptions.printNodePrinterId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Missing PrintNode configuration. Required: printNodeApiKey and printNodePrinterId' 
        })
      };
    }
    
    // Populate Google Slide with item data
    const slideBuffer = await populateGoogleSlide(slideUrl, itemData);
    
    // Print using PrintNode
    const result = await printWithPrintNode(
      printOptions.printNodeApiKey,
      printOptions.printNodePrinterId,
      slideBuffer,
      printOptions
    );
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Label sent to PrintNode',
        provider: 'PrintNode',
        result
      })
    };
  } catch (error) {
    console.error('Error printing label:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: `Failed to print label: ${error.message}`
      })
    };
  }
} 