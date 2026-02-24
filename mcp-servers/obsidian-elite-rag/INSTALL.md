# Installation Guide

This guide provides detailed installation instructions for the Obsidian Elite RAG MCP Server.

## Prerequisites

### System Requirements
- **Python 3.9+** (3.10+ recommended)
- **Docker** and **Docker Compose**
- **Git**
- **4GB+ RAM** (8GB+ recommended)
- **10GB+ free disk space**

### Required Accounts
- **OpenAI API key** for embeddings
- **Docker Hub account** (for pulling images)

## Installation Options

### Option 1: Quick Install (Recommended)

```bash
# Install the package
pip install obsidian-elite-rag-mcp

# Initialize the system
obsidian-elite-rag-cli setup

# Start databases
obsidian-elite-rag-cli start-databases
```

### Option 2: Development Install

```bash
# Clone the repository
git clone https://github.com/aegntic/aegntic-MCP.git
cd aegntic-MCP/obsidian-elite-rag

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install in development mode
pip install -e ".[dev]"

# Install Graphiti dependencies
pip install graphiti-core neo4j py2neo
```

### Option 3: Docker Install

```bash
# Clone the repository
git clone https://github.com/aegntic/aegntic-MCP.git
cd aegntic-MCP/obsidian-elite-rag

# Build Docker image
docker build -t obsidian-elite-rag .

# Run with Docker Compose
docker-compose up -d
```

## Database Setup

### Automatic Setup (Recommended)

```bash
# Start both databases with proper configuration
obsidian-elite-rag-cli start-databases
```

### Manual Setup

#### Qdrant Vector Database

```bash
# Start Qdrant
docker run -d --name qdrant \
  -p 6333:6333 \
  -p 6334:6334 \
  -v $(pwd)/data/qdrant:/qdrant/storage \
  qdrant/qdrant:latest

# Verify it's running
curl http://localhost:6333/collections
```

#### Neo4j Knowledge Graph Database

```bash
# Start Neo4j with plugins
docker run -d --name neo4j \
  -p 7474:7474 \
  -p 7687:7687 \
  -p 7688:7688 \
  -v $(pwd)/data/neo4j:/data \
  -v $(pwd)/data/neo4j/logs:/logs \
  -v $(pwd)/data/neo4j/import:/var/lib/neo4j/import \
  -v $(pwd)/data/neo4j/plugins:/plugins \
  --env NEO4J_AUTH=neo4j/password \
  --env NEO4J_PLUGINS='["apoc","graph-data-science"]' \
  --env NEO4J_dbms_security_procedures_unrestricted=apoc.*,gds.* \
  --env NEO4J_dbms_memory_heap_initial__size=512m \
  --env NEO4J_dbms_memory_heap_max__size=2G \
  --env NEO4J_dbms_memory_pagecache_size=1G \
  neo4j:5.14

# Wait for startup (30-60 seconds)
# Check status: curl http://localhost:7474
```

## Configuration

### Environment Variables

Create a `.env` file in your project root:

```bash
# Required
OPENAI_API_KEY=your-openai-api-key-here

# Optional (auto-configured)
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=password
QDRANT_HOST=localhost
QDRANT_PORT=6333

# Logging
LOG_LEVEL=INFO
```

### Configuration File

The system uses `config/automation-config.yaml`. Key sections:

```yaml
knowledge_graph:
  enabled: true
  provider: graphiti
  graphiti:
    neo4j_uri: bolt://localhost:7687
    neo4j_user: neo4j
    neo4j_password: "password"

rag_system:
  layers:
    semantic:
      weight: 0.3
      similarity_threshold: 0.7
    knowledge_graph:
      weight: 0.25
      max_depth: 4
```

## Verification

### Test Database Connections

```bash
# Check system status
obsidian-elite-rag-cli status /path/to/test/vault

# Expected output:
# ✅ Vault: /path/to/test/vault (X markdown files)
# ✅ Qdrant: Connected (collection 'obsidian_knowledge' exists)
# ✅ Neo4j: Connected
# ✅ Graphiti: Enabled
# 🚀 System ready for RAG operations!
```

### Test with Sample Vault

```bash
# Create a test vault
mkdir -p test-vault
echo "# Machine Learning
Machine learning is a subset of artificial intelligence that focuses on algorithms that can learn from data.

## Key Concepts
- Supervised Learning
- Unsupervised Learning
- Neural Networks
- Deep Learning

## Important People
- Geoffrey Hinton
- Yann LeCun
- Yoshua Bengio

## Related Technologies
- TensorFlow
- PyTorch
- Scikit-learn" > test-vault/ml-notes.md

# Ingest the test vault
obsidian-elite-rag-cli ingest test-vault

# Test queries
obsidian-elite-rag-cli query "What is machine learning?" test-vault
obsidian-elite-rag-cli graph test-vault --entity-query "neural networks"
```

## MCP Server Setup

### Claude Code Integration

1. **Install Claude Code** (if not already installed)

2. **Configure MCP Server** in `~/.config/claude-code/config.json`:

```json
{
  "mcpServers": {
    "obsidian-elite-rag": {
      "command": "obsidian-elite-rag-cli",
      "args": ["server"],
      "env": {
        "OPENAI_API_KEY": "your-openai-api-key"
      }
    }
  }
}
```

3. **Restart Claude Code**

4. **Test the integration**:
   ```
   @obsidian-elite-rag please get the system status for vault /path/to/my/vault
   @obsidian-elite-rag query "what are the main concepts in my vault?"
   ```

### Other MCP Clients

The server supports standard MCP protocol and can be used with any MCP-compatible client.

## Troubleshooting

### Common Issues

#### 1. Database Connection Errors

**Problem**: `Connection failed` errors for Neo4j or Qdrant

**Solution**:
```bash
# Check if containers are running
docker ps

# Restart databases
docker restart neo4j qdrant

# Check logs
docker logs neo4j
docker logs qdrant
```

#### 2. Import Errors

**Problem**: `ModuleNotFoundError: No module named 'graphiti'`

**Solution**:
```bash
# Install missing dependencies
pip install graphiti-core neo4j py2neo

# Or reinstall the package
pip install --force-reinstall obsidian-elite-rag-mcp
```

#### 3. OpenAI API Errors

**Problem**: Authentication errors with OpenAI

**Solution**:
```bash
# Check API key
echo $OPENAI_API_KEY

# Set in environment
export OPENAI_API_KEY="your-key-here"

# Add to .env file
echo "OPENAI_API_KEY=your-key-here" >> .env
```

#### 4. Docker Port Conflicts

**Problem**: Port already in use errors

**Solution**:
```bash
# Check what's using the ports
lsof -i :6333  # Qdrant
lsof -i :7687  # Neo4j

# Use different ports
docker run -d --name qdrant -p 16333:6333 qdrant/qdrant:latest
docker run -d --name neo4j -p 17687:7687 neo4j:5.14

# Update configuration accordingly
```

### Performance Optimization

#### Memory Settings

For better performance, adjust Docker memory limits:

```bash
# Neo4j memory optimization
docker run -d --name neo4j \
  --memory=4g \
  --env NEO4J_dbms_memory_heap_max__size=3G \
  --env NEO4J_dbms_memory_pagecache_size=1G \
  neo4j:5.14
```

#### Concurrent Processing

Adjust configuration for faster ingestion:

```yaml
processing:
  parallelism:
    max_workers: 8  # Increase based on CPU cores
    batch_processing: true
```

### Getting Help

1. **Check logs**: `tail -f logs/mcp-server.log`
2. **Run diagnostics**: `obsidian-elite-rag-cli status /path/to/vault`
3. **GitHub Issues**: https://github.com/aegntic/aegntic-MCP/issues
4. **Email support**: research@aegntic.ai

## Next Steps

After successful installation:

1. **Ingest your Obsidian vault**: `obsidian-elite-rag-cli ingest /path/to/vault`
2. **Start MCP server**: `obsidian-elite-rag-cli server`
3. **Configure Claude Code**: Add MCP server configuration
4. **Test with queries**: Try different query types and knowledge graph searches
5. **Customize configuration**: Adjust weights and thresholds for your use case

For advanced usage and configuration, see the main [README.md](README.md).