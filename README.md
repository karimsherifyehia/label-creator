# Label Creator App

A web application for generating and printing product labels using Google Sheets, Google Slides, and printer integration.

## Features

- Barcode scanning for quick item lookup
- Integration with Google Sheets for item data
- Template-based label generation using Google Slides
- Print to local printers or using PrintNode
- Responsive design with dark mode support

## Configuration for Netlify Deployment

### Required Environment Variables

Set these environment variables in your Netlify site settings:

#### Google API Authentication
To use the Google Slides template feature, you **must** set up a service account:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Slides API and Google Drive API
4. Create a Service Account:
   - Go to "IAM & Admin" > "Service Accounts"
   - Click "Create Service Account"
   - Give it a name like "Label Creator Service Account"
   - Grant it "Editor" role
   - Click "Done"
5. Create a key for your service account:
   - Find your service account in the list and click the three dots menu
   - Select "Manage keys"
   - Click "Add Key" > "Create new key"
   - Choose JSON as the key type
   - Download the JSON key file
6. In Netlify, set these environment variables:
   - `GOOGLE_CLIENT_EMAIL`: The email from the service account JSON (looks like `service-account-name@project-id.iam.gserviceaccount.com`)
   - `GOOGLE_PRIVATE_KEY`: Copy the entire private key string from the JSON file, including the `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----` parts

7. **Important**: Share your Google Slides template with the service account email:
   - Open your Google Slides template
   - Click the "Share" button
   - Add the service account email address
   - Give it "Editor" permission
   - Click "Share"

**Note**: Unlike regular Google accounts, a service account can only access files explicitly shared with it.

#### PrintNode Configuration
To use PrintNode integration:

1. Sign up for a [PrintNode account](https://www.printnode.com/)
2. Get your API Key from the PrintNode dashboard
3. Configure your PrintNode printer and note the printer ID
4. In the app's settings page, add your PrintNode API Key and printer ID

### Optional Environment Variables

- `USE_MOCK_PDF`: Set to "true" to use a mock PDF if Google API integration isn't set up (for testing)

## Development Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Start the development server:
   ```
   npm run dev
   ```

## Troubleshooting

### Template Variables Not Replacing
If variables like `{{name}}` are not being replaced in your template:

1. Make sure your Google Slides template uses the exact variable format: `{{variableName}}`
2. Verify that you've properly set up the Google API service account:
   - Check that both `GOOGLE_CLIENT_EMAIL` and `GOOGLE_PRIVATE_KEY` are set in Netlify environment variables
   - Make sure the service account email format is correct
   - Ensure the private key includes the header and footer lines
3. **Confirm** that your Google Slides template is shared with the service account email
4. Check Netlify function logs for more detailed error information:
   - Go to your Netlify dashboard
   - Navigate to Functions > print
   - Review the recent invocation logs

### PrintNode Authentication Issues
If you see "Basic auth username is not valid UTF8" errors:

1. Verify your API key doesn't contain any special characters
2. Re-enter your PrintNode API key in the app settings
3. Check Netlify function logs for detailed error information

## License

[MIT License](LICENSE)

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

## Demo Barcodes

The application includes demo barcodes that will work with the Netlify Functions:

- `6925582193626` - TROSLI2001 - Sander 5 inch Battery 20 Lithium
- `1234567890` - Tool Set - Home Essentials
- `0987654321` - Power Drill - Cordless