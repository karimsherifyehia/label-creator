import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fetchGoogleSheetData } from './services/googleSheets.js';
import { populateGoogleSlide } from './services/googleSlides.js';
import { getAvailablePrinters, printDocument } from './services/printer.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    // In production, specify the allowed domains
    ? ['https://yourdomain.netlify.app', 'http://localhost:5173']
    // In development, allow all origins
    : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'UP', timestamp: new Date().toISOString() });
});

// Routes
app.get('/api/sheets', async (req, res) => {
  try {
    const { url, barcode } = req.query;
    
    if (!url || !barcode) {
      return res.status(400).json({ error: 'Missing required parameters: url and barcode' });
    }
    
    const data = await fetchGoogleSheetData(url, barcode);
    
    if (!data) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    res.json(data);
  } catch (error) {
    console.error('Error fetching Google Sheet data:', error);
    res.status(500).json({ error: 'Failed to fetch data from Google Sheet' });
  }
});

app.get('/api/printers', async (req, res) => {
  try {
    const printers = await getAvailablePrinters();
    res.json(printers);
  } catch (error) {
    console.error('Error fetching printers:', error);
    res.status(500).json({ error: 'Failed to fetch printers' });
  }
});

app.post('/api/print', async (req, res) => {
  try {
    const { 
      slideUrl, 
      printerId, 
      itemData,
      printOptions
    } = req.body;
    
    if (!slideUrl || !printerId || !itemData) {
      return res.status(400).json({ error: 'Missing required parameters: slideUrl, printerId, and itemData' });
    }
    
    // Check if using PrintNode and validate required fields
    if (printerId === 'printnode') {
      if (!printOptions || !printOptions.printNodeApiKey || !printOptions.printNodePrinterId) {
        return res.status(400).json({ 
          error: 'Missing PrintNode configuration. Required: printNodeApiKey and printNodePrinterId' 
        });
      }
    }
    
    // Populate Google Slide with item data
    const slideBuffer = await populateGoogleSlide(slideUrl, itemData);
    
    // Print the document
    const result = await printDocument(printerId, slideBuffer, printOptions);
    
    res.json({ 
      success: true, 
      message: 'Label sent to printer', 
      provider: printerId === 'printnode' ? 'PrintNode' : 'System',
      result 
    });
  } catch (error) {
    console.error('Error printing label:', error);
    res.status(500).json({ error: 'Failed to print label: ' + error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 