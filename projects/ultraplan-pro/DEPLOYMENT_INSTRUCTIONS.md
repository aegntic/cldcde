# zkFlow.pro Chrome Web Store Deployment Instructions

## 📦 Quick Deploy Steps

### Step 1: Download the Complete Package
First, download the entire zkFlow.pro folder to your local machine.

### Step 2: Install Dependencies Locally
Open a terminal on your local machine and navigate to the zkFlow.pro folder:

```bash
# Navigate to the project folder
cd path/to/zkFlow.pro

# Install Puppeteer for the automation scripts
npm install puppeteer
```

### Step 3: Generate Icons (if needed)
```bash
cd extension/assets/icons
node generate-icons-auto.js
cd ../../..
```

### Step 4: Generate Screenshots (if needed)
```bash
cd store-assets
node capture-screenshots.js
cd ..
```

### Step 5: Build and Package the Extension
```bash
cd extension
npm run build
npm run package
cd ..
```

### Step 6: Run the Automated Uploader
```bash
# From the zkFlow.pro root directory
node chrome-store-uploader.js
```

## 🖥️ What Will Happen

1. **A Chrome browser window will open** on your local machine
2. **The script will navigate** to Chrome Web Store Developer Dashboard
3. **You'll log in** with your Google account (if not already logged in)
4. **The script will automatically**:
   - Upload the extension ZIP file
   - Fill in all the store listing information
   - Upload all screenshots
   - Upload promotional images
5. **The SUBMIT button will be highlighted in red**
6. **You manually review and click submit**

## 📋 Manual Alternative

If the automated script doesn't work, you can upload manually:

### 1. Go to Chrome Web Store Developer Dashboard
https://chrome.google.com/webstore/devconsole

### 2. Click "New Item"

### 3. Upload the Extension Package
- File: `extension/zkflow-pro.zip`

### 4. Fill in the Store Listing
Copy the information from `CHROME_STORE_LISTING.md`:
- **Name**: zkFlow.pro - Smart Form Automation
- **Short Description**: Save 10+ hours weekly with AI-powered form automation. Fill any form instantly. 100% privacy-focused. Join 2,500+ productive users!
- **Category**: Productivity
- **Language**: English

### 5. Upload Screenshots (in order)
From the `store-assets` folder:
1. screenshot-1-hero.png
2. screenshot-2-demo.png
3. screenshot-3-stats.png
4. screenshot-4-workflow.png
5. screenshot-5-security.png

### 6. Upload Promotional Images
- **Small Tile (440x280)**: promotional-tile-440x280.png
- **Large Tile (1400x560)**: featured-promotional-1400x560.png

### 7. Set Privacy Practices
- Select: "This extension does not collect user data"

### 8. Set Pricing (if applicable)
- Free with in-app purchases
- Pro tier: $4.99/month

### 9. Submit for Review

## 🚀 One-Click Deploy Script

For convenience, here's a simple script that opens everything you need:

```bash
#!/bin/bash
# save this as deploy.sh and run it

echo "Opening Chrome Web Store Developer Dashboard..."
open "https://chrome.google.com/webstore/devconsole"

echo "Opening extension package location..."
open extension/

echo "Opening screenshots folder..."
open store-assets/

echo "Opening store listing document..."
open CHROME_STORE_LISTING.md

echo ""
echo "📋 Manual upload checklist:"
echo "1. Log in to Chrome Web Store Developer Dashboard"
echo "2. Click 'New Item'"
echo "3. Upload zkflow-pro.zip"
echo "4. Copy information from CHROME_STORE_LISTING.md"
echo "5. Upload screenshots in order (1-5)"
echo "6. Upload promotional images"
echo "7. Set pricing and submit!"
```

## 🎯 Tips for Success

1. **Have everything ready** before starting the upload
2. **Use the exact text** from CHROME_STORE_LISTING.md for best SEO
3. **Upload screenshots in order** for the best visual flow
4. **Double-check pricing** before submitting
5. **Save the item ID** after submission for future updates

## 📊 After Submission

- Review typically takes 1-3 business days
- You'll receive an email when approved
- Monitor the developer dashboard for any requested changes
- Once approved, start your marketing campaign!

## 🆘 Troubleshooting

If the automated script fails:
1. Make sure you have Node.js installed
2. Ensure Puppeteer is installed (`npm install puppeteer`)
3. Check that all files exist in the correct locations
4. Try the manual upload process instead

## 🎉 Ready to Launch!

Your extension is fully prepared and ready to go viral. Good luck with your launch!