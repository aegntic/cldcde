#!/bin/bash

# Prologue Email Registration Setup Script
# This script sets up the email registration server with Resend

set -e

echo "🎭 Prologue Email Registration Setup"
echo "=================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm are installed"

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env file and add your RESEND_API_KEY"
    echo "   Get your API key from: https://resend.com/api-keys"
else
    echo "✅ .env file already exists"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the project
echo "🔨 Building TypeScript..."
npm run build

# Check if build was successful
if [ -d "dist" ]; then
    echo "✅ Build completed successfully"
else
    echo "❌ Build failed"
    exit 1
fi

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "🚀 To start the email registration server:"
echo "   npm run server:dev"
echo ""
echo "📧 Once running, you can access:"
echo "   - Registration form: http://localhost:3001/register"
echo "   - API endpoint: http://localhost:3001/api/register"
echo "   - Health check: http://localhost:3001/health"
echo ""
echo "📊 To view registration statistics:"
echo "   curl http://localhost:3001/api/stats"
echo ""
echo "⚠️  Remember to:"
echo "   1. Add your RESEND_API_KEY to .env file"
echo "   2. Configure FROM_EMAIL and ADMIN_EMAIL"
echo "   3. Set CORS_ORIGIN to your domain in production"
echo ""