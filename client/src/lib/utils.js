import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs) {
    return twMerge(clsx(inputs));
}
export function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(amount);
}
// Get the API URL from environment or use default
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
// Function to build API endpoints - helps handle both Netlify Functions and traditional API paths
export function buildApiPath(endpoint) {
    // If we're using Netlify Functions (starts with /.netlify/functions)
    if (API_URL.startsWith('/.netlify/functions')) {
        // Netlify Functions don't have /api/ prefix
        return `${API_URL}/${endpoint.replace('/api/', '')}`;
    }
    // Otherwise, use the full URL with /api/ prefix as normal
    return `${API_URL}${endpoint}`;
}
export async function fetchGoogleSheetData(sheetUrl, barcode) {
    try {
        console.log('Fetching data for barcode:', barcode, 'from sheet:', sheetUrl);
        const apiUrl = buildApiPath(`/api/sheets?url=${encodeURIComponent(sheetUrl)}&barcode=${encodeURIComponent(barcode)}`);
        console.log('API URL:', apiUrl);
        const response = await fetch(apiUrl);
        if (!response.ok) {
            console.error('Server response error:', response.status, response.statusText);
            throw new Error('Failed to fetch data from Google Sheet');
        }
        return await response.json();
    }
    catch (error) {
        console.error('Error fetching Google Sheet data:', error);
        throw error;
    }
}
export async function printLabel(slideUrl, printerId, itemData, printOptions) {
    try {
        const response = await fetch(buildApiPath('/api/print'), {
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
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to print label');
        }
        return await response.json();
    }
    catch (error) {
        console.error('Error printing label:', error);
        throw error;
    }
}
export async function fetchPrinters() {
    try {
        const response = await fetch(buildApiPath('/api/printers'));
        if (!response.ok) {
            throw new Error('Failed to fetch printers');
        }
        return await response.json();
    }
    catch (error) {
        console.error('Error fetching printers:', error);
        throw error;
    }
}
