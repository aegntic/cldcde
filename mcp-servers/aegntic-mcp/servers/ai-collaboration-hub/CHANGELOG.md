# Changelog

All notable changes to AI Collaboration Hub will be documented in this file.

## [1.0.0] - 2025-01-06

### Added
- Initial release of AI Collaboration Hub
- Bidirectional communication between Claude Code and Gemini
- User approval gates for AI-to-AI exchanges
- Session management with configurable limits
- OpenRouter integration for free Gemini access
- Complete conversation logging with timestamps
- Support for 1M token context window
- Comprehensive documentation and examples
- Test suite with pytest
- Type hints and code quality tools

### Features
- `start_collaboration` tool for creating supervised AI sessions
- `collaborate_with_gemini` tool for sending messages with context
- `view_conversation` tool for reviewing session history
- `end_collaboration` tool for terminating sessions
- Environment variable and config file support
- Docker and system installation options
- Development tools integration (black, ruff, mypy)

### Documentation
- Complete installation guide
- Tools reference with examples
- Prompts and use cases guide
- Resources and configuration documentation
- Real-world examples and patterns
- Contributing guidelines

### Technical
- Built with modern Python (3.8+) and uv package manager
- Async/await support for OpenRouter API calls
- Pydantic models for type safety
- Comprehensive error handling
- Session state management
- Configurable approval workflows

## [Unreleased]

### Planned
- Multiple AI model support
- Conversation export functionality
- Enhanced context management
- Performance optimizations
- Additional approval workflows