import axios from 'axios';
import { google } from 'googleapis';

/**
 * Extract the presentation ID from a Google Slides URL
 * @param {string} url - Google Slides URL
 * @returns {string} Presentation ID
 */
function extractPresentationId(url) {
  const regex = /\/presentation\/d\/([a-zA-Z0-9-_]+)/;
  const match = url.match(regex);
  
  if (!match || !match[1]) {
    throw new Error('Invalid Google Slides URL');
  }
  
  return match[1];
}

/**
 * Populate a Google Slide template with item data
 * @param {string} slideUrl - Google Slides URL
 * @param {Object} itemData - Item data to populate the slide with
 * @returns {Buffer} PDF buffer of the populated slide
 */
export async function populateGoogleSlide(slideUrl, itemData) {
  try {
    const presentationId = extractPresentationId(slideUrl);
    
    // For public slides without authentication, we can use a different approach
    // This is a simplified version that would need to be expanded with actual Google API auth
    // In a real implementation, you would use the Google Slides API with proper authentication
    
    // For this demo, we'll simulate the process by fetching the slide as PDF
    // and returning the buffer
    
    // In a real implementation with API keys, you would:
    // 1. Use the Google Slides API to get the presentation
    // 2. Find and replace text in the presentation with item data
    // 3. Export the presentation as PDF
    
    // Simulated implementation for demo purposes
    console.log('Populating Google Slide with data:', itemData);
    console.log('Template placeholders that will be replaced:');
    console.log('{{description}} -> ', itemData.description || '');
    console.log('{{Item name}} -> ', itemData.name || '');
    console.log('{{barcode}} -> ', itemData.barcode || itemData.id || '');
    console.log('{{price}} -> ', itemData.price || '');
    
    const response = await axios.get(
      `https://docs.google.com/presentation/d/${presentationId}/export/pdf`,
      { responseType: 'arraybuffer' }
    );
    
    return Buffer.from(response.data);
    
    /* 
    // Real implementation with Google API would look like this:
    const auth = new google.auth.GoogleAuth({
      keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
      scopes: ['https://www.googleapis.com/auth/presentations'],
    });
    
    const slides = google.slides({ version: 'v1', auth });
    
    // Get the presentation
    const presentation = await slides.presentations.get({
      presentationId,
    });
    
    // Define the mappings for template placeholders
    const placeholderMappings = {
      '{{description}}': itemData.description || '',
      '{{Item name}}': itemData.name || '',
      '{{barcode}}': itemData.barcode || itemData.id || '',
      '{{price}}': typeof itemData.price === 'number' 
        ? new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
          }).format(itemData.price)
        : ''
    };
    
    // Create requests to replace text
    const requests = Object.entries(placeholderMappings).map(([placeholder, value]) => ({
      replaceAllText: {
        containsText: {
          text: placeholder,
          matchCase: true,
        },
        replaceText: String(value),
      },
    }));
    
    // Execute the requests
    await slides.presentations.batchUpdate({
      presentationId,
      requestBody: {
        requests,
      },
    });
    
    // Export as PDF
    const pdf = await slides.presentations.export({
      presentationId,
      mimeType: 'application/pdf',
    });
    
    return Buffer.from(pdf.data);
    */
  } catch (error) {
    console.error('Error populating Google Slide:', error);
    throw error;
  }
} 