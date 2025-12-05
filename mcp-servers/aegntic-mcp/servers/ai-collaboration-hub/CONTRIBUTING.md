# Contributing to AI Collaboration Hub

**Authors:** Mattae Cooper <human@mattaecooper.org> and '{ae}'aegntic.ai <contact@aegntic.ai>

Thank you for your interest in contributing! This guide will help you get started.

## Important Note

This project is dual-licensed. Contributions will be subject to the same licensing terms (free for non-commercial use, commercial license required for business use). By contributing, you agree to these terms.

## Development Setup

```bash
# Clone the repository
git clone https://github.com/aegntic/MCP.git
cd MCP/ai-collaboration-hub

# Install development dependencies
uv sync

# Install pre-commit hooks
uv run pre-commit install

# Run tests
uv run pytest

# Check code quality
uv run black --check .
uv run ruff check .
uv run mypy .
```

## How to Contribute

### Reporting Issues
- Use the GitHub issue tracker
- Include clear reproduction steps
- Provide environment details
- Add relevant logs or error messages

### Submitting Changes
1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Add tests for new functionality
5. Update documentation
6. Run the test suite: `uv run pytest`
7. Submit a pull request

### Code Style
- Use Black for code formatting: `uv run black .`
- Follow PEP 8 guidelines
- Use type hints for all functions
- Write descriptive commit messages

### Testing
- Add tests for all new features
- Ensure existing tests pass
- Include integration tests where appropriate
- Use meaningful test names and docstrings

## Development Guidelines

### Architecture
- Keep the MCP server interface clean and simple
- Separate concerns between collaboration logic and OpenRouter integration
- Use dependency injection for testability
- Follow the existing patterns for error handling

### Documentation
- Update relevant documentation files
- Include docstrings for all public functions
- Add examples for new features
- Update the changelog

## Release Process

1. Update version in `pyproject.toml`
2. Update `CHANGELOG.md`
3. Create release PR
4. Tag release after merge
5. Publish to PyPI (maintainers only)

## Questions?

- Open a GitHub issue for questions
- Check existing issues and discussions
- Review the documentation in `/docs`

Thank you for contributing!