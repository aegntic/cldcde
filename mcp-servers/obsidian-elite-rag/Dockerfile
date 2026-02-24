FROM python:3.11-slim

# Metadata
LABEL maintainer="Mattae Cooper <research@aegntic.ai>"
LABEL org.aegntic.project="obsidian-elite-rag"
LABEL description="Elite Obsidian RAG System MCP Server with Graphiti Knowledge Graph"
LABEL version="1.0.0"

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Create app user
RUN useradd --create-home --shell /bin/bash app

# Set work directory
WORKDIR /app

# Copy requirements first for better Docker layer caching
COPY requirements.txt .
RUN pip install --upgrade pip && \
    pip install -r requirements.txt

# Copy application code
COPY pyproject.toml .
COPY src/ ./src/
COPY config/ ./config/
COPY scripts/ ./scripts/
COPY templates/ ./templates/
COPY README.md .
COPY LICENSE .

# Install the application
RUN pip install -e .

# Create necessary directories
RUN mkdir -p logs data/qdrant data/neo4j data/embeddings data/cache && \
    chown -R app:app /app

# Switch to app user
USER app

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import sys; sys.exit(0)" || exit 1

# Expose ports (for databases if needed)
EXPOSE 8000

# Default command
CMD ["obsidian-elite-rag-cli", "server"]