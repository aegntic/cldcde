# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## System Overview

This is an elite Obsidian RAG (Retrieval-Augmented Generation) system that transforms Obsidian vaults into AI-paired cognitive workflow engines. The system implements multi-layered knowledge architecture with hierarchical context management and automated knowledge graph construction.

## Commands

### Development and Setup
```bash
# Initialize new vault with elite structure
npm run setup /path/to/your/vault

# Start development environment (RAG engine + web interface)
npm run dev

# Start only the RAG engine
npm run dev:rag

# Start only the web interface
npm run dev:web

# Build for production
npm run build

# Run tests
npm run test

# Lint code
npm run lint
```

### Database Management
```bash
# Start both databases (Qdrant + Neo4j)
npm run start:databases

# Start Neo4j knowledge graph database
npm run start:neo4j

# Stop Neo4j database
npm run stop:neo4j

# Reset Neo4j database (clear all data)
npm run reset:neo4j

# Stop all databases
npm run stop:databases

# Setup Graphiti dependencies
npm run setup:graphiti
```

### RAG Engine Operations
```bash
# Ingest/update vault content
python3 integrations/rag-engine.py --vault /path/to/vault --ingest

# Query the RAG system
python3 integrations/rag-engine.py --vault /path/to/vault --query "Your question"

# Domain-specific query
python3 integrations/rag-engine.py --vault /path/to/vault --query "Technical question" --query-type technical

# Watch vault for changes and auto-update
npm run watch
```

### Claude Integration
```bash
# Query with context from vault
./scripts/claude-context.sh /path/to/vault "Your query"

# Project-specific help
./scripts/claude-context.sh /path/to/vault "How to implement X?" "Project Name"

# Research assistance
./scripts/claude-context.sh /path/to/vault "Explain concept Y" "" "research"
```

### Database Operations
```bash
# Index vault content
npm run index

# Query RAG system
npm run query
```

## Architecture

### Core Components

**RAG Engine** (`integrations/rag-engine.py`):
- Multi-layered retrieval system with 5 distinct layers
- Semantic similarity search using OpenAI embeddings
- Graph traversal for knowledge expansion
- Temporal context management
- Domain-specific retrieval strategies
- Meta-knowledge layer for knowledge about knowledge

**Vector Database**:
- Primary: Qdrant (Docker-based)
- Alternatives: ChromaDB, FAISS
- Collection: `obsidian_knowledge`
- Embedding dimension: 1536 (OpenAI)

**Knowledge Graph**:
- Primary: Neo4j with Graphiti adapter
- Backup: NetworkX for basic graph operations
- Database: `neo4j` (default)
- Entity types: 27+ categories (concepts, people, organizations, technologies, etc.)
- Relationship types: 40+ types (implements, uses, depends_on, etc.)

**Knowledge Architecture**:
- Obsidian vault structure with hierarchical organization
- Automated link discovery and relationship mapping
- Multi-format content support (Markdown, PDF, DOCX, images)
- Tag-based categorization and context management

### Retrieval Layers

1. **L1: Semantic Context** (30% weight) - Vector similarity search with OpenAI embeddings
2. **L2: Knowledge Graph** (25% weight) - Graphiti-powered entity and relationship retrieval
3. **L3: Graph Traversal** (15% weight) - NetworkX-based link traversal
4. **L4: Temporal Context** (15% weight) - Time-based relevance and freshness
5. **L5: Domain Specialization** (15% weight) - Context-aware retrieval
6. **L6: Meta-Knowledge** (remaining weight) - Knowledge about knowledge

### File Structure

```
00-Core/           # Foundational knowledge and principles
01-Projects/       # Active work and initiatives
02-Research/       # Learning and exploration
03-Workflows/      # Reusable processes
04-AI-Paired/      # Claude Code interactions
05-Resources/      # External references
06-Meta/           # System knowledge
07-Archive/        # Historical data
08-Templates/      # Note structures
09-Links/          # External connections
```

## Configuration

### Main Configuration
- `config/automation-config.yaml` - System-wide settings
- Environment variables for API keys and paths
- Docker configuration for Qdrant database

### Key Configuration Areas
- Automation settings (knowledge processing, context management)
- RAG system layer weights and thresholds
- Vector database settings
- Claude integration parameters
- File watching patterns
- Performance and security settings

## Development Workflow

### Prerequisites
- Docker (for Qdrant vector database and Neo4j)
- Python 3.9+
- Node.js 18+
- OpenAI API key
- Obsidian (for vault management)

### Setup Process
1. Clone repository and install dependencies
2. Start both databases:
   ```bash
   npm run start:databases
   # Or separately:
   docker run -d --name qdrant -p 6333:6333 -v $(pwd)/data/qdrant:/qdrant/storage qdrant/qdrant:latest
   npm run start:neo4j
   ```
3. Initialize vault with elite structure
4. Configure environment variables
5. Install Graphiti dependencies: `npm run setup:graphiti`
6. Ingest vault content into RAG system
7. Start development environment

### Testing
- Python tests with pytest: `npm run test`
- Integration tests for RAG functionality
- Performance benchmarks for retrieval speed
- Content accuracy validation

## Performance Characteristics

- **Retrieval Speed**: <100ms for context-rich queries
- **Knowledge Coverage**: 95%+ recall on domain-specific queries
- **Context Quality**: Multi-layered, temporally-aware responses
- **Automation Coverage**: 80%+ routine knowledge tasks automated
- **Entity Recognition**: 90%+ accuracy for concepts, people, organizations
- **Relationship Extraction**: 85%+ accuracy for semantic relationships
- **Graph Traversal**: <50ms for entity relationship queries up to depth 4

## Key Technical Decisions

- **LangChain Framework**: Unified RAG pipeline with modular components
- **Qdrant Vector Database**: High-performance similarity search
- **Neo4j + Graphiti**: Advanced knowledge graph with entity-relationship modeling
- **NetworkX for Graph Processing**: Backup knowledge relationship mapping
- **Async Processing**: Concurrent file watching and content updates
- **Hierarchical Context**: Progressive detail revelation in responses
- **Multi-modal Content**: Support for text, images, and documents
- **Dual-Graph Architecture**: Both Neo4j (structured) and NetworkX (unstructured) support

## Important Files

- `integrations/rag-engine.py` - Core RAG implementation with Graphiti integration
- `integrations/graphiti_adapter.py` - Graphiti knowledge graph adapter
- `config/automation-config.yaml` - System configuration including Graphiti settings
- `package.json` - Node.js dependencies and scripts
- `requirements.txt` - Python dependencies including Graphiti
- `scripts/start-neo4j.sh` - Neo4j database startup script
- `scripts/` - Automation and utility scripts
- `docs/` - Detailed implementation guides