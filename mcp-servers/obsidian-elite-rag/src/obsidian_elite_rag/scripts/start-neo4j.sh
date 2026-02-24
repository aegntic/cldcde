#!/bin/bash

# Neo4j Database Startup Script for Elite RAG System
# Part of the Graphiti knowledge graph integration

set -e

echo "🧠 Starting Neo4j Knowledge Graph Database..."

# Check if Neo4j is already running
if docker ps | grep -q neo4j; then
    echo "✅ Neo4j is already running"
    exit 0
fi

# Create data directory if it doesn't exist
mkdir -p data/neo4j

# Stop and remove existing container if it exists
if docker ps -a | grep -q neo4j; then
    echo "🛑 Stopping existing Neo4j container..."
    docker stop neo4j 2>/dev/null || true
    docker rm neo4j 2>/dev/null || true
fi

# Start Neo4j container
echo "🚀 Starting Neo4j container..."
docker run -d \
    --name neo4j \
    -p 7474:7474 \
    -p 7687:7687 \
    -p 7688:7688 \
    -v $(pwd)/data/neo4j:/data \
    -v $(pwd)/data/neo4j/logs:/logs \
    -v $(pwd)/data/neo4j/import:/var/lib/neo4j/import \
    -v $(pwd)/data/neo4j/plugins:/plugins \
    --env NEO4J_AUTH=neo4j/password \
    --env NEO4J_PLUGINS=["apoc", "graph-data-science"] \
    --env NEO4J_dbms_security_procedures_unrestricted=apoc.*,gds.* \
    --env NEO4J_dbms_memory_heap_initial__size=512m \
    --env NEO4J_dbms_memory_heap_max__size=2G \
    --env NEO4J_dbms_memory_pagecache_size=1G \
    neo4j:5.14

# Wait for Neo4j to be ready
echo "⏳ Waiting for Neo4j to be ready..."
max_attempts=30
attempt=0

while [ $attempt -lt $max_attempts ]; do
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:7474 | grep -q "200\|302"; then
        echo "✅ Neo4j is ready!"
        break
    fi

    attempt=$((attempt + 1))
    echo "Attempt $attempt/$max_attempts..."
    sleep 2
done

if [ $attempt -eq $max_attempts ]; then
    echo "❌ Neo4j failed to start within expected time"
    echo "📊 Check logs: docker logs neo4j"
    exit 1
fi

echo "🌐 Neo4j Web Interface: http://localhost:7474"
echo "🔌 Neo4j Bolt URI: bolt://localhost:7687"
echo "👤 Username: neo4j"
echo "🔑 Password: password"
echo ""
echo "🔍 Verify connection:"
echo "docker exec -it neo4j cypher-shell -u neo4j -p password 'RETURN 1;'"