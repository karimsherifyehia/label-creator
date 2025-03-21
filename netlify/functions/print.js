const axios = require('axios');
const { google } = require('googleapis');

// Function to extract presentation ID from Google Slides URL
function extractPresentationId(slideUrl) {
  try {
    // Handle different URL formats
    const urlPattern = /\/presentation\/d\/([a-zA-Z0-9-_]+)/;
    const match = slideUrl.match(urlPattern);
    
    if (match && match[1]) {
      return match[1];
    }
    throw new Error('Could not extract presentation ID from URL');
  } catch (error) {
    console.error('Error extracting presentation ID:', error);
    throw new Error(`Invalid Google Slides URL: ${slideUrl}`);
  }
}

// Function to populate a Google Slide with data and export as PDF
async function populateGoogleSlide(slideUrl, itemData) {
  try {
    console.log('Populating Google Slide with data:', itemData);
    
    // Get the presentation ID from the URL
    const presentationId = extractPresentationId(slideUrl);
    console.log('Extracted Presentation ID:', presentationId);
    
    // Set up authentication - for public slides, we can use API key authentication
    // Create a JWT client using available credentials or default public access
    let auth;
    
    // First try to use service account if available
    if (process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
      console.log('Using service account authentication');
      const credentials = {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n')
      };
      
      auth = new google.auth.JWT(
        credentials.client_email,
        null,
        credentials.private_key,
        ['https://www.googleapis.com/auth/presentations', 
         'https://www.googleapis.com/auth/drive']
      );
    } else {
      // For public slides with no restrictions
      console.log('Using public access for shared template');
      // Use API key if available, otherwise try anonymous access
      auth = new google.auth.GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/presentations.readonly',
                'https://www.googleapis.com/auth/drive.readonly']
      });
    }
    
    // Create Slides and Drive API clients
    const slides = google.slides({ version: 'v1', auth });
    const drive = google.drive({ version: 'v3', auth });
    
    // Get the presentation content
    const presentation = await slides.presentations.get({
      presentationId
    });
    
    // Prepare replacement dictionary
    const replacements = {};
    
    // Map item data to template keys (handle both formats)
    if (itemData.name) replacements['{{Item name}}'] = itemData.name;
    if (itemData.name) replacements['{{name}}'] = itemData.name;
    
    if (itemData.description) replacements['{{description}}'] = itemData.description;
    
    if (itemData.barcode) replacements['{{barcode}}'] = itemData.barcode;
    
    if (itemData.price) {
      const formattedPrice = typeof itemData.price === 'number' 
        ? itemData.price.toFixed(2) 
        : itemData.price.toString();
      replacements['{{price}}'] = formattedPrice;
    }
    
    // Add any other fields from itemData
    Object.keys(itemData).forEach(key => {
      if (itemData[key] !== null && itemData[key] !== undefined) {
        replacements[`{{${key}}}`] = itemData[key].toString();
      }
    });
    
    console.log('Replacements dictionary:', replacements);
    
    // Find all text elements in the presentation that contain placeholders
    const requests = [];
    
    // Process each slide
    for (const slide of presentation.data.slides) {
      // Process each page element in the slide
      for (const element of slide.pageElements || []) {
        // Check if the element has text content
        if (element.shape && element.shape.text && element.shape.text.textElements) {
          for (const textElement of element.shape.text.textElements) {
            // Check if the text element has textRun with content
            if (textElement.textRun && textElement.textRun.content) {
              let content = textElement.textRun.content;
              let hasReplacement = false;
              
              // Check for each placeholder and replace if found
              for (const [placeholder, value] of Object.entries(replacements)) {
                if (content.includes(placeholder)) {
                  console.log(`Found placeholder: ${placeholder}`);
                  content = content.replace(placeholder, value);
                  hasReplacement = true;
                }
              }
              
              // If replacements were made, add text replacement request
              if (hasReplacement) {
                requests.push({
                  replaceAllText: {
                    replaceText: content,
                    pageObjectIds: [slide.objectId],
                    containsText: {
                      text: textElement.textRun.content
                    }
                  }
                });
              }
            }
          }
        }
      }
    }
    
    // If no requests were generated, we didn't find any placeholders
    if (requests.length === 0) {
      console.warn('No placeholders found in the template. Check placeholder format matches {{field}}');
    } else {
      console.log(`Generated ${requests.length} text replacement requests`);
      
      // Apply the text replacements
      await slides.presentations.batchUpdate({
        presentationId,
        requestBody: {
          requests
        }
      });
    }
    
    // Export the presentation as PDF
    const response = await drive.files.export({
      fileId: presentationId,
      mimeType: 'application/pdf'
    }, {
      responseType: 'arraybuffer'
    });
    
    // Return the PDF as buffer
    return Buffer.from(response.data);
  } catch (error) {
    console.error('Error populating Google Slide:', error.stack);
    
    // Provide detailed error information
    if (error.message.includes('auth')) {
      throw new Error(`Google API authentication issue: ${error.message}. The slide template may not be accessible. Please ensure it's shared with anyone with the link.`);
    }
    
    throw new Error(`Failed to populate Google Slide template: ${error.message}`);
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
    
    // Create proper Basic Auth header - Fix for UTF-8 encoding issue
    // PrintNode expects the API key as the username, with an empty password
    // The issue was in how we were creating the Basic Auth header
    const encodedCredentials = Buffer.from(`${apiKey}:`).toString('base64');
    const authHeader = `Basic ${encodedCredentials}`;
    
    console.log('Using Authorization header (first 20 chars):', authHeader.substring(0, 26) + '...');
    
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