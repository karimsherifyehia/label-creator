import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { PrintOptions } from "./types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

// Get the API URL from environment or use default
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
console.log('API_URL from environment:', API_URL);

// Function to build API endpoints - helps handle both Netlify Functions and traditional API paths
export function buildApiPath(endpoint: string): string {
  // If we're using Netlify Functions (starts with /.netlify/functions)
  if (API_URL.startsWith('/.netlify/functions')) {
    // Netlify Functions don't have /api/ prefix
    const path = `${API_URL}/${endpoint.replace('/api/', '')}`;
    console.log(`Using Netlify Functions path: ${path} for endpoint: ${endpoint}`);
    return path;
  }
  
  // Otherwise, use the full URL with /api/ prefix as normal
  const path = `${API_URL}${endpoint}`;
  console.log(`Using API path: ${path} for endpoint: ${endpoint}`);
  return path;
}

// Helper to check if the app is running on Netlify
export function isRunningOnNetlify() {
  return window.location.hostname.includes('netlify.app') || 
         API_URL.includes('netlify') || 
         API_URL.startsWith('/.netlify');
}

export async function fetchGoogleSheetData(sheetUrl: string, barcode: string) {
  try {
    console.log('Fetching data for barcode:', barcode, 'from sheet:', sheetUrl)
    
    const apiUrl = buildApiPath(`/api/sheets?url=${encodeURIComponent(sheetUrl)}&barcode=${encodeURIComponent(barcode)}`);
    console.log('API URL for sheets:', apiUrl)
    
    const response = await fetch(apiUrl)
    
    if (!response.ok) {
      console.error('Server response error:', response.status, response.statusText)
      throw new Error('Failed to fetch data from Google Sheet')
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error fetching Google Sheet data:', error)
    throw error
  }
}

export async function printLabel(slideUrl: string, printerId: string, itemData: any, printOptions?: PrintOptions) {
  try {
    const apiUrl = buildApiPath('/api/print');
    console.log('API URL for print:', apiUrl);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        slideUrl,
        printerId,
        itemData,
        printOptions,
      }),
    })
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to print label');
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error printing label:', error)
    throw error
  }
}

export async function fetchPrinters() {
  try {
    const apiUrl = buildApiPath('/api/printers');
    console.log('API URL for printers:', apiUrl);
    console.log('Running on Netlify:', isRunningOnNetlify());
    
    // Try to fetch our debug endpoint first to check connection
    if (isRunningOnNetlify()) {
      try {
        const debugUrl = API_URL.startsWith('/.netlify') 
          ? '/.netlify/functions/debug'
          : `${API_URL}/debug`;
        
        console.log('Checking debug endpoint:', debugUrl);
        const debugResponse = await fetch(debugUrl);
        const debugData = await debugResponse.json();
        console.log('Debug endpoint response:', debugData);
      } catch (debugError) {
        console.error('Debug endpoint error:', debugError);
      }
    }
    
    // Now fetch printers
    const response = await fetch(apiUrl)
    
    if (!response.ok) {
      console.error('Printer response error:', response.status, response.statusText);
      throw new Error('Failed to fetch printers')
    }
    
    const data = await response.json();
    console.log('Printers data received:', data);
    return data;
  } catch (error) {
    console.error('Error fetching printers:', error)
    throw error
  }
} 