import axios from 'axios';

/**
 * Extract the sheet ID from a Google Sheets URL
 * @param {string} url - Google Sheets URL
 * @returns {string} Sheet ID
 */
function extractSheetId(url) {
  const regex = /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/;
  const match = url.match(regex);
  
  if (!match || !match[1]) {
    throw new Error('Invalid Google Sheets URL');
  }
  
  return match[1];
}

/**
 * Fetch data from a Google Sheet using the public API
 * @param {string} sheetUrl - Google Sheets URL
 * @param {string} barcode - Barcode or ID to search for
 * @returns {Object|null} Item data or null if not found
 */
export async function fetchGoogleSheetData(sheetUrl, barcode) {
  try {
    const sheetId = extractSheetId(sheetUrl);
    
    // Use the Google Sheets API to fetch the sheet as CSV
    // This works for public sheets without authentication
    const response = await axios.get(
      `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`
    );
    
    // Parse CSV data
    const rows = response.data
      .split('\n')
      .map(row => row.split(',').map(cell => cell.trim()));
    
    // Get headers (first row)
    const headers = rows[0];
    
    // Find the barcode column index
    const barcodeIndex = headers.findIndex(
      header => header.toLowerCase() === 'barcode'
    );
    
    // Find the id column index
    const idIndex = headers.findIndex(
      header => header.toLowerCase() === 'id'
    );
    
    if (barcodeIndex === -1 && idIndex === -1) {
      throw new Error('Neither Barcode nor ID column found in the sheet');
    }
    
    // Find the row with the matching barcode or id
    const itemRow = rows.slice(1).find(row => {
      // Check if barcode matches (if barcode column exists)
      const barcodeMatch = barcodeIndex !== -1 && row[barcodeIndex] === barcode;
      
      // Check if id matches (if id column exists)
      const idMatch = idIndex !== -1 && row[idIndex] === barcode;
      
      // Return true if either matches
      return barcodeMatch || idMatch;
    });
    
    if (!itemRow) {
      return null; // Item not found
    }
    
    // Convert row to object using headers as keys
    const item = {};
    headers.forEach((header, index) => {
      // Convert numeric values
      const value = itemRow[index];
      if (header.toLowerCase() === 'price' && !isNaN(value)) {
        item[header.toLowerCase()] = parseFloat(value);
      } else {
        item[header.toLowerCase()] = value;
      }
    });
    
    return item;
  } catch (error) {
    console.error('Error fetching Google Sheet data:', error);
    throw error;
  }
} 