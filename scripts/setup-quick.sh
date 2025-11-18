#!/bin/bash
# 🚀 Quick Setup Script for cldcde.cc

set -e

echo "🎯 cldcde.cc Quick Setup Script"
echo "==============================="
echo ""

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command -v bun &> /dev/null; then
    echo "❌ Bun is not installed. Please install from https://bun.sh"
    exit 1
fi

if ! command -v wrangler &> /dev/null; then
    echo "📦 Installing Wrangler CLI..."
    bun add -g wrangler
fi

# Install dependencies
echo "📦 Installing dependencies..."
bun install

# Setup configuration
echo "🔧 Setting up configuration..."

if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "⚠️  Please edit .env with your service credentials"
    echo "   Required services:"
    echo "   - Cloudflare (Account ID + API Token)"
    echo "   - Neo4j Aura (free tier)"
    echo "   - Upstash Redis (free tier)"
    echo "   - Meilisearch Cloud (free tier)"
    echo "   - Supabase (free tier)"
    echo ""
    read -p "Press enter when you've updated .env..."
fi

# Source environment variables
if [ -f .env ]; then
    source .env
else
    echo "❌ .env file not found. Please create it from .env.example"
    exit 1
fi

# Create Cloudflare resources
echo "☁️  Setting up Cloudflare resources..."

# Create D1 database
echo "Creating D1 database..."
DB_OUTPUT=$(wrangler d1 create cldcde-content 2>&1 || true)
if [[ $DB_OUTPUT == *"database_id"* ]]; then
    DB_ID=$(echo "$DB_OUTPUT" | grep -o '"database_id": "[^"]*"' | cut -d'"' -f4)
    echo "✅ D1 Database created with ID: $DB_ID"
    
    # Update wrangler.toml
    sed -i.bak "s/YOUR_D1_DATABASE_ID/$DB_ID/g" wrangler.toml
fi

# Create KV namespace
echo "Creating KV namespace for cache..."
KV_OUTPUT=$(wrangler kv:namespace create CACHE 2>&1 || true)
if [[ $KV_OUTPUT == *"id"* ]]; then
    KV_ID=$(echo "$KV_OUTPUT" | grep -o '"id": "[^"]*"' | cut -d'"' -f4)
    echo "✅ KV namespace created with ID: $KV_ID"
    sed -i.bak "s/YOUR_KV_NAMESPACE_ID/$KV_ID/g" wrangler.toml
fi

# Create R2 bucket
echo "Creating R2 bucket..."
wrangler r2 bucket create cldcde-assets 2>&1 || true

# Run database migrations
echo "🗄️  Running database migrations..."

# Neo4j setup
echo "Setting up Neo4j..."
bun run db:init

# D1 migrations
echo "Running D1 migrations..."
wrangler d1 execute cldcde-content --file=./migrations/001_initial_schema.sql

# Setup secrets
echo "🔐 Setting up secrets..."
echo "Setting Cloudflare Worker secrets..."

# Function to set secret
set_secret() {
    local key=$1
    local value=$2
    if [ ! -z "$value" ]; then
        echo "$value" | wrangler secret put $key
    fi
}

set_secret "NEO4J_URI" "$NEO4J_URI"
set_secret "NEO4J_USERNAME" "$NEO4J_USERNAME"
set_secret "NEO4J_PASSWORD" "$NEO4J_PASSWORD"
set_secret "JWT_SECRET" "$JWT_SECRET"
set_secret "UPSTASH_REDIS_REST_URL" "$UPSTASH_REDIS_REST_URL"
set_secret "UPSTASH_REDIS_REST_TOKEN" "$UPSTASH_REDIS_REST_TOKEN"
set_secret "MEILISEARCH_KEY" "$MEILISEARCH_KEY"
set_secret "SUPABASE_ANON_KEY" "$SUPABASE_ANON_KEY"

# Build application
echo "🏗️  Building application..."
bun run build

# Index search data
echo "🔍 Indexing search data..."
bun run scripts/index-search.ts

# Deploy
echo "🚀 Deploying to Cloudflare..."
wrangler deploy

echo ""
echo "✅ Setup complete!"
echo ""
echo "📌 Next steps:"
echo "1. Deploy frontend: wrangler pages deploy dist --project-name=cldcde"
echo "2. Configure custom domain in Cloudflare dashboard"
echo "3. Warm cache: bun run scripts/warm-cache.ts"
echo "4. Check health: curl https://your-worker.workers.dev/health"
echo ""
echo "🎉 Your cldcde.cc platform is ready!"