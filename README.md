# Label Creator Application

A comprehensive barcode scanning and label printing solution that integrates with Google Sheets and Slides for dynamic data retrieval and template-based label generation.

## Features

- Scan barcodes or enter item IDs manually
- Fetch item data from Google Sheets
- Generate professional labels using Google Slides templates
- Print to local system printers (when running locally)
- Cloud printing via PrintNode
- Responsive web-based interface

## Project Structure

- `/client` - React frontend application
- `/server` - Node.js/Express backend API (for local development)
- `/netlify/functions` - Serverless functions for Netlify deployment

## Local Development

### Prerequisites

- Node.js 16+ and npm
- Google Sheets API access
- Google Slides API access
- PrintNode account (optional, for cloud printing)

### Setup

1. Clone the repository:
   ```
   git clone https://github.com/your-username/label-creator.git
   cd label-creator
   ```

2. Install dependencies:
   ```
   # Install client dependencies
   cd client
   npm install

   # Install server dependencies (for local development)
   cd ../server
   npm install
   ```

3. Start the development servers:
   ```
   # Start the backend server (runs on port 5001)
   cd server
   npm run dev

   # In a separate terminal, start the frontend
   cd client
   npm run dev
   ```

4. Access the application at http://localhost:5173

## Deployment to Netlify

This application is designed to be deployed entirely on Netlify, using Netlify Functions for the backend.

### Option 1: One-Click Deploy

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/your-username/label-creator)

### Option 2: Manual Deployment

1. Fork or clone this repository to your GitHub account

2. Sign up/login to [Netlify](https://app.netlify.com/)

3. Click "New site from Git" and select your repository

4. Configure the build settings:
   - Base directory: leave empty (root of the project)
   - Build command: `cd client && npm install && npm run build`
   - Publish directory: `client/dist`

5. Click "Show advanced" and add the following environment variables:
   - VITE_API_URL: `/.netlify/functions`

6. Click "Deploy site"

7. After deployment, your site will be available at a Netlify subdomain (e.g., `your-site-name.netlify.app`)

### Local Netlify Development

You can test the Netlify deployment locally:

1. Install Netlify CLI:
   ```
   npm install -g netlify-cli
   ```

2. Start the local development server:
   ```
   netlify dev
   ```

3. Access the application at the URL shown in the console

## Configuration

### PrintNode Configuration

To use PrintNode for cloud printing:

1. Create a PrintNode account at [printnode.com](https://www.printnode.com/)
2. Generate an API key from the PrintNode dashboard
3. Configure your printers in PrintNode
4. In the application settings, select PrintNode as your printer and enter your API key and printer ID

## Demo Barcodes

The application includes demo barcodes that will work with the Netlify Functions:

- `6925582193626` - TROSLI2001 - Sander 5 inch Battery 20 Lithium
- `1234567890` - Tool Set - Home Essentials
- `0987654321` - Power Drill - Cordless

## License

MIT License #   l a b e l - c r e a t o r  
 