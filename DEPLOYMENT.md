# Netlify Deployment Guide for Label Creator

This guide provides step-by-step instructions for deploying the Label Creator application to Netlify, which will host both the frontend and backend (using Netlify Functions).

## Preparing for Deployment

### Step 1: Ensure Your Repository is Ready

1. Make sure your code is in a Git repository (GitHub, GitLab, or Bitbucket)
2. Verify that the following files and directories exist:
   - `netlify.toml` in the root directory
   - `netlify/functions/*.js` for your serverless functions
   - `client/` directory with your React frontend

### Step 2: Configure Environment Variables

1. Check `netlify.toml` to ensure it has the correct configuration:
   ```toml
   [build]
     base = "client"
     command = "npm run build"
     publish = "dist"
     functions = "../netlify/functions"

   [[redirects]]
     from = "/api/*"
     to = "/.netlify/functions/:splat"
     status = 200

   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200

   [context.production.environment]
     VITE_API_URL = "/.netlify/functions"
   ```

2. Update `client/.env.production` if necessary:
   ```
   VITE_API_URL=/.netlify/functions
   ```

## Deployment Options

### Option 1: Deploy via Netlify Dashboard (Recommended)

1. Sign up or log in to [Netlify](https://app.netlify.com/)
2. Click "New site from Git"
3. Select your Git provider (GitHub, GitLab, or Bitbucket)
4. Authorize Netlify and select your repository
5. Configure build settings:
   - Base directory: Leave empty (project root)
   - Build command: `cd client && npm install && npm run build`
   - Publish directory: `client/dist`
6. Click "Show advanced" and add the following environment variables:
   - `VITE_API_URL`: `/.netlify/functions`
7. Click "Deploy site"

### Option 2: Deploy via Netlify CLI

1. Install Netlify CLI globally:
   ```bash
   npm install -g netlify-cli
   ```

2. Log in to your Netlify account:
   ```bash
   netlify login
   ```

3. Initialize your site (from the project root):
   ```bash
   netlify init
   ```
   - Follow the prompts to connect to your Netlify account
   - Select "Create & configure a new site"
   - Choose your team
   - Set a custom site name or let Netlify generate one

4. Deploy your site:
   ```bash
   netlify deploy --prod
   ```

### Option 3: Drag-and-Drop Deployment

This method is less recommended for sites with serverless functions but can be used for quick testing:

1. Build your site:
   ```bash
   cd client
   npm run build
   ```

2. Sign up or log in to [Netlify](https://app.netlify.com/)
3. Drag and drop the `client/dist` folder to the Netlify dashboard
4. Note: This method requires manual configuration of serverless functions afterward

## Post-Deployment

### Step 1: Verify Your Deployment

1. Visit your Netlify site URL (shown in the Netlify dashboard)
2. Navigate to the app and try the following test barcodes:
   - `6925582193626` - TROSLI2001 - Sander 5 inch Battery 20 Lithium
   - `1234567890` - Tool Set - Home Essentials
   - `0987654321` - Power Drill - Cordless

### Step 2: Configure Your Domain (Optional)

1. Go to your site settings in Netlify
2. Click on "Domain management"
3. Add a custom domain or enable Netlify's free subdomain

### Step 3: Verify Functions

1. Check your function logs in the Netlify dashboard:
   - Go to Functions
   - Click on a function to see its logs
2. Test your functions directly by visiting:
   - `https://your-site-url/.netlify/functions/printers`
   - `https://your-site-url/.netlify/functions/sheets?url=test&barcode=6925582193626`

## PrintNode Configuration

To use PrintNode with your deployed application:

1. Create a PrintNode account at [printnode.com](https://www.printnode.com/)
2. Generate an API key from the PrintNode dashboard
3. Add your printers to PrintNode
4. In your application:
   - Go to Settings
   - Select "PrintNode (Cloud Printing)" as your printer
   - Enter your PrintNode API key and printer ID

## Troubleshooting

### CORS Issues

If you encounter CORS errors:
1. Check your function headers to ensure they include:
   ```javascript
   'Access-Control-Allow-Origin': '*'
   ```
2. Verify the redirect rules in `netlify.toml`

### Function Errors

If functions aren't working:
1. Check Netlify's function logs in the dashboard
2. Ensure your functions are in the correct directory
3. Verify that the `functions` path in `netlify.toml` is correct

### Build Errors

If the build fails:
1. Check the build logs in Netlify
2. Ensure all dependencies are listed in `package.json`
3. Verify that the build commands work locally 