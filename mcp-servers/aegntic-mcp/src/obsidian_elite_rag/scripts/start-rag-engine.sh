#!/bin/bash

# Elite RAG Engine Startup Script
# Starts the multi-layer RAG system with all components

set -e

# Configuration
VAULT_PATH="${1:-$HOME/Documents/Obsidian}"
PORT="${2:-8000}"
ENVIRONMENT="${3:-development}"

echo "🚀 Starting Elite RAG Engine..."
echo "Vault: $VAULT_PATH"
echo "Port: $PORT"
echo "Environment: $ENVIRONMENT"

# Check if vault exists
if [ ! -d "$VAULT_PATH" ]; then
    echo "❌ Vault not found at $VAULT_PATH"
    echo "Run ./setup-vault.sh to create a new vault"
    exit 1
fi

# Create necessary directories
mkdir -p logs
mkdir -p data/embeddings
mkdir -p data/indexes
mkdir -p data/cache

# Start services in background
echo "📊 Starting Vector Database..."
docker run -d --name qdrant \
  -p 6333:6333 \
  -v $(pwd)/data/qdrant:/qdrant/storage \
  qdrant/qdrant:latest

echo "🧠 Starting Knowledge Graph Database..."
./scripts/start-neo4j.sh

# Wait for databases to be ready
echo "⏳ Waiting for databases..."
sleep 15

# Start Python RAG Engine
echo "🧠 Starting RAG Engine..."
cd "$(dirname "$0")/.."
python3 -m venv venv
source venv/bin/activate

# Install dependencies if needed
if [ ! -f "venv/pyvenv.cfg" ] || [ "requirements.txt" -nt "venv/pyvenv.cfg" ]; then
    echo "📦 Installing Python dependencies..."
    pip install -r requirements.txt
fi

# Start the main RAG engine
export VAULT_PATH="$VAULT_PATH"
export PORT="$PORT"
export ENVIRONMENT="$ENVIRONMENT"

python3 integrations/rag-engine.py &
RAG_PID=$!

# Start the web interface
echo "🌐 Starting Web Interface..."
cd frontend
npm install
npm run dev &
WEB_PID=$!

# Start the file watcher
echo "👁️ Starting File Watcher..."
python3 scripts/watch-vault.py "$VAULT_PATH" &
WATCH_PID=$!

echo "✅ Elite RAG Engine is running!"
echo ""
echo "🌐 Web Interface: http://localhost:$PORT"
echo "📊 Vector DB: http://localhost:6333"
echo "📝 Logs: tail -f logs/rag-engine.log"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for interrupt signal
trap 'echo "🛑 Stopping services..."; kill $RAG_PID $WEB_PID $WATCH_PID 2>/dev/null; docker stop qdrant 2>/dev/null; docker rm qdrant 2>/dev/null; echo "✅ All services stopped"; exit 0' INT

# Keep script running
wait