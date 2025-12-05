FROM python:3.11-slim

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

# Set working directory
WORKDIR /app

# Copy project files
COPY pyproject.toml uv.lock ./
COPY ai_collaboration_hub/ ./ai_collaboration_hub/

# Install dependencies
RUN uv sync --frozen --no-cache

# Set environment variables
ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1

# Expose port (if needed for future web interface)
EXPOSE 8000

# Run the MCP server
CMD ["uv", "run", "python", "-m", "ai_collaboration_hub.server"]