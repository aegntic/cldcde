# Installation Guide

## Quick Start

### Prerequisites
- Python 3.8+
- uv package manager (recommended) or pip
- OpenRouter API key

### 1. Install uv (if not already installed)
```bash
# macOS/Linux
curl -LsSf https://astral.sh/uv/install.sh | sh

# Windows (PowerShell)
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"

# Alternative: pip install
pip install uv
```

### 2. Clone and Setup
```bash
# Clone the repository
git clone https://github.com/aegntic/MCP.git
cd MCP/ai-collaboration-hub

# Install dependencies
uv sync

# Get OpenRouter API key from https://openrouter.ai
export OPENROUTER_API_KEY=your_key_here
```

### 3. Test Installation
```bash
# Test the server
uv run python -m ai_collaboration_hub.server

# Should output: "🚀 AI Collaboration Hub initialized"
# Press Ctrl+C to stop
```

### 4. Configure Claude Code
Add to your Claude Code MCP configuration:

```json
{
  "mcpServers": {
    "ai-collaboration-hub": {
      "command": "uv",
      "args": ["run", "python", "-m", "ai_collaboration_hub.server"],
      "cwd": "/path/to/MCP/ai-collaboration-hub",
      "env": {
        "OPENROUTER_API_KEY": "your_key_here"
      }
    }
  }
}
```

## Alternative Installation Methods

### Using pip
```bash
# Clone repository
git clone https://github.com/aegntic/MCP.git
cd MCP/ai-collaboration-hub

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -e .

# Run server
python -m ai_collaboration_hub.server
```

### System Installation
```bash
# Install globally with uv
uv tool install ai-collaboration-hub

# Configure Claude Code to use global installation
{
  "mcpServers": {
    "ai-collaboration-hub": {
      "command": "ai-collaboration-hub",
      "env": {
        "OPENROUTER_API_KEY": "your_key_here"
      }
    }
  }
}
```

### Docker Installation
```bash
# Build Docker image
docker build -t ai-collaboration-hub .

# Run with Docker
docker run --rm -i \
  --env OPENROUTER_API_KEY=your_key_here \
  ai-collaboration-hub

# Configure Claude Code for Docker
{
  "mcpServers": {
    "ai-collaboration-hub": {
      "command": "docker",
      "args": [
        "run", "--rm", "-i",
        "--env", "OPENROUTER_API_KEY=your_key_here",
        "ai-collaboration-hub:latest"
      ]
    }
  }
}
```

## Configuration

### Environment Variables
```bash
# Required
export OPENROUTER_API_KEY=your_openrouter_api_key

# Optional
export GEMINI_MODEL=google/gemini-pro-1.5
export MAX_TOKENS=1000000
export DEFAULT_MAX_EXCHANGES=50
```

### Configuration File
Create `config.json` in the project directory:
```json
{
  "openrouter": {
    "api_key": "your_key_here",
    "model": "google/gemini-pro-1.5",
    "max_tokens": 1000000
  },
  "session_defaults": {
    "max_exchanges": 50,
    "require_approval": true
  }
}
```

## Verification

### Test Basic Functionality
```python
# In Claude Code, run:
start_collaboration({"max_exchanges": 5})
# Should return session ID

collaborate_with_gemini({
    "session_id": "your_session_id",
    "content": "Hello, this is a test message"
})
# Should return Gemini's response
```

### Troubleshooting
- **API Key Issues:** Verify key is set in environment or config
- **Connection Errors:** Check internet connection and OpenRouter status
- **Permission Errors:** Ensure proper file permissions and Python version