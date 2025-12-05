# AI Collaboration Hub - Resources & Configuration

## Resource Management

### Session Resources

**Session Storage:**
- In-memory session management
- Conversation history persistence
- Message approval tracking
- Session limits enforcement

**Resource Limits:**
- Maximum exchanges per session: 50 (configurable)
- Session timeout: 60 minutes (configurable)
- Context size: Up to 1M tokens via Gemini
- Concurrent sessions: Unlimited

### OpenRouter Integration

**API Resources:**
- Base URL: `https://openrouter.ai/api/v1`
- Model: `google/gemini-pro-1.5`
- Max tokens: 1,000,000
- Timeout: 60 seconds

**Free Tier Benefits:**
- $5 free credits for new users
- Pay-per-use pricing after credits
- No monthly subscription required
- Access to multiple models

## Configuration Options

### Environment Variables

```bash
# Required
OPENROUTER_API_KEY=your_openrouter_api_key_here

# Optional - Model Configuration  
GEMINI_MODEL=google/gemini-pro-1.5           # Default model
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1  # API endpoint
MAX_TOKENS=1000000                           # Context window size

# Optional - Session Defaults
DEFAULT_MAX_EXCHANGES=50                     # Default session limit
DEFAULT_TIMEOUT_MINUTES=60                   # Default session timeout
DEFAULT_REQUIRE_APPROVAL=true               # Default approval setting
```

### Configuration File

Create `config.json` in project root:
```json
{
  "openrouter": {
    "api_key": "your_key_here",
    "base_url": "https://openrouter.ai/api/v1",
    "model": "google/gemini-pro-1.5",
    "max_tokens": 1000000,
    "timeout": 60
  },
  "session_defaults": {
    "max_exchanges": 50,
    "timeout_minutes": 60,
    "require_approval": true
  },
  "logging": {
    "level": "INFO",
    "file": "collaboration.log",
    "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
  }
}
```

## Claude Code Integration

### MCP Server Configuration

**Standard Setup:**
```json
{
  "mcpServers": {
    "ai-collaboration-hub": {
      "command": "uv",
      "args": ["run", "python", "-m", "ai_collaboration_hub.server"],
      "cwd": "/path/to/ai-collaboration-hub",
      "env": {
        "OPENROUTER_API_KEY": "your_key_here"
      }
    }
  }
}
```

**Development Setup:**
```json
{
  "mcpServers": {
    "ai-collaboration-hub-dev": {
      "command": "uv",
      "args": ["run", "python", "-m", "ai_collaboration_hub.server"],
      "cwd": "/path/to/ai-collaboration-hub",
      "env": {
        "OPENROUTER_API_KEY": "your_key_here",
        "DEBUG": "true",
        "LOG_LEVEL": "DEBUG"
      }
    }
  }
}
```

### Alternative Configurations

**System Installation:**
```json
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

**Docker Setup:**
```json
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

## External Dependencies

### Required Dependencies

**Core Libraries:**
- `mcp>=1.0.0` - Model Context Protocol framework
- `httpx>=0.27.0` - Async HTTP client for OpenRouter API  
- `pydantic>=2.0.0` - Data validation and settings management

**Python Version:**
- Minimum: Python 3.8
- Recommended: Python 3.11+
- Tested on: 3.8, 3.9, 3.10, 3.11, 3.12

### Development Dependencies

**Testing:**
- `pytest>=8.0.0` - Testing framework
- `pytest-asyncio>=0.23.0` - Async test support

**Code Quality:**
- `black>=24.0.0` - Code formatting
- `ruff>=0.3.0` - Linting and code analysis
- `mypy>=1.8.0` - Type checking

## OpenRouter Setup

### Getting Started

1. **Sign up:** Visit https://openrouter.ai
2. **Get credits:** Claim $5 free credits for new accounts
3. **Generate API key:** Create API key in dashboard
4. **Test connection:** Use provided test script

### Model Options

**Gemini Models:**
- `google/gemini-pro-1.5` - 1M context, best performance (recommended)
- `google/gemini-pro` - Standard Gemini model
- `google/gemini-flash` - Faster, lower cost alternative

**Alternative Models:**
- `anthropic/claude-3-haiku` - Fast responses
- `openai/gpt-4-turbo` - OpenAI's latest
- `meta-llama/llama-2-70b` - Open source option

### Cost Management

**Free Tier:**
- $5 in free credits
- No expiration on credits
- Pay-as-you-go after credits exhausted

**Cost Optimization:**
- Use shorter contexts when possible
- Set session limits appropriately
- Monitor usage in OpenRouter dashboard
- Choose appropriate model for task complexity

## Troubleshooting Resources

### Common Issues

**API Connection Errors:**
- Verify OPENROUTER_API_KEY is set correctly
- Check network connectivity
- Ensure sufficient credits in account

**Session Management Issues:**
- Check session ID validity
- Verify session hasn't exceeded limits
- Ensure session is still active

**Performance Issues:**
- Reduce context size for faster responses
- Use session limits to prevent runaway conversations
- Monitor OpenRouter API rate limits

### Debug Mode

Enable debug logging:
```bash
export DEBUG=true
export LOG_LEVEL=DEBUG
uv run python -m ai_collaboration_hub.server
```

### Support Resources

- **GitHub Issues:** https://github.com/aegntic/MCP/issues
- **OpenRouter Docs:** https://openrouter.ai/docs
- **MCP Documentation:** https://modelcontextprotocol.io
- **Community Discord:** [MCP Discord Server]