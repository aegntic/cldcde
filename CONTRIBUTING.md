# Contributing to cldcde.cc

Thank you for your interest in contributing to cldcde.cc! This document provides guidelines and information for contributors.

## 🎯 Ways to Contribute

### 1. Extension & MCP Server Submissions
- Submit new Claude Code extensions
- Add MCP servers to the directory
- Update existing extension information
- Provide installation guides and documentation

### 2. Code Contributions
- Bug fixes and improvements
- New features and functionality
- Performance optimizations
- UI/UX enhancements

### 3. Content & Documentation
- Write tutorials and guides
- Improve existing documentation
- Create video walkthroughs
- Translate content to other languages

### 4. Community & Support
- Help answer questions in issues
- Review pull requests
- Test new features
- Report bugs and provide feedback

## 🚀 Getting Started

### Prerequisites
- [Bun](https://bun.sh/) or Node.js 18+
- [Git](https://git-scm.com/)
- [Cloudflare account](https://cloudflare.com/) (for testing deployments)
- [Supabase account](https://supabase.com/) (for database)

### Setup Development Environment

1. **Fork the repository**
   ```bash
   # Fork on GitHub, then clone your fork
   git clone https://github.com/YOUR_USERNAME/cldcde.git
   cd cldcde
   ```

2. **Install dependencies**
   ```bash
   bun install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase and API credentials
   ```

4. **Start development server**
   ```bash
   bun dev
   ```

5. **Create a feature branch**
   ```bash
   git checkout -b feature/my-awesome-feature
   ```

## 📝 Development Guidelines

### Code Style
- Use TypeScript for all new code
- Follow existing code formatting (Prettier configured)
- Use meaningful variable and function names
- Add JSDoc comments for public APIs

### File Organization
```
src/
├── api/          # API route handlers
├── db/           # Database connections and queries
├── auth/         # Authentication logic
├── cache/        # Caching strategies
├── search/       # Search functionality
└── utils/        # Utility functions

frontend/src/
├── components/   # React components
├── hooks/        # Custom React hooks
├── styles/       # Theme definitions
└── contexts/     # React context providers
```

### Commit Messages
Use conventional commit format:
```
type(scope): description

feat(api): add extension search endpoint
fix(ui): resolve theme switching bug
docs(readme): update installation instructions
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

### Testing
- Write tests for new features
- Ensure existing tests pass: `bun test`
- Test in multiple browsers for UI changes
- Verify mobile responsiveness

## 🔍 Submitting Changes

### Pull Request Process

1. **Update documentation** if needed
2. **Add tests** for new functionality
3. **Run the test suite**
   ```bash
   bun test
   bun run lint
   bun run type-check
   ```

4. **Create pull request**
   - Use a descriptive title
   - Reference any related issues
   - Include screenshots for UI changes
   - Describe testing performed

### PR Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Performance improvement

## Testing
- [ ] Tested locally
- [ ] Added/updated tests
- [ ] Verified in multiple browsers

## Screenshots (if applicable)
[Add screenshots here]

## Related Issues
Fixes #123
```

## 🐛 Bug Reports

When reporting bugs, please include:

1. **Environment information**
   - Browser and version
   - Operating system
   - Node.js/Bun version

2. **Steps to reproduce**
   - Clear, numbered steps
   - Expected vs actual behavior
   - Screenshots/video if helpful

3. **Additional context**
   - Console errors
   - Network requests
   - Relevant logs

## 💡 Feature Requests

For new features:

1. **Check existing issues** to avoid duplicates
2. **Describe the problem** you're trying to solve
3. **Propose a solution** with implementation details
4. **Consider alternatives** and their trade-offs
5. **Discuss impact** on existing functionality

## 🏗️ Architecture Decisions

When making significant changes:

1. **Create an RFC** (Request for Comments) for major features
2. **Discuss in issues** before implementing
3. **Consider performance** impact
4. **Maintain backward compatibility** when possible
5. **Update documentation** accordingly

## 📊 Extension Submissions

To submit a new extension or MCP server:

### Required Information
- **Name and description**
- **GitHub repository URL**
- **Installation instructions**
- **Compatible Claude Code versions**
- **Author/maintainer information**
- **License information**

### Submission Process
1. Create a new issue with the "extension-submission" label
2. Fill out the extension template
3. Wait for community review and testing
4. Address any feedback or requests
5. Extension will be added to the directory

### Quality Guidelines
- ✅ Must be open source
- ✅ Clear documentation
- ✅ Active maintenance
- ✅ Follows security best practices
- ✅ Works with latest Claude Code

## 🤝 Community Guidelines

### Code of Conduct
- Be respectful and inclusive
- Help newcomers and be patient
- Focus on constructive feedback
- Celebrate diverse perspectives
- Report inappropriate behavior

### Communication
- **GitHub Issues**: Bug reports, feature requests
- **Pull Requests**: Code review and discussion
- **Discussions**: General questions and ideas
- **Discord**: Real-time community chat

## 🎉 Recognition

Contributors are recognized in:
- **Contributors page** on the website
- **Release notes** for significant contributions
- **Hall of Fame** for outstanding contributors
- **Swag and stickers** for active community members

## 📚 Resources

### Documentation
- [Architecture Overview](./docs/architecture/)
- [API Documentation](./docs/api/)
- [Deployment Guide](./docs/deployment/)

### External Resources
- [Claude Code Documentation](https://docs.anthropic.com/en/docs/claude-code)
- [MCP Protocol Specification](https://spec.modelcontextprotocol.io/)
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Supabase Documentation](https://supabase.com/docs)

## ❓ Questions?

- **Technical questions**: Create a GitHub issue
- **General discussion**: Join our Discord
- **Security concerns**: Email security@cldcde.cc
- **Other inquiries**: Email hello@cldcde.cc

---

Thank you for contributing to cldcde.cc! 🚀