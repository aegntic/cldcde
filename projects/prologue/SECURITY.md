# ╔═══════════════════════════════════════════════════════════════════════════════════╗
# ║                                                                                   ║
# ║                           PROLOGUE SECURITY GUIDE                                ║
# ║                                                                                   ║
# ║  This document outlines security measures for protecting proprietary content   ║
# ║  while maintaining a public repository.                                        ║
# ╚═══════════════════════════════════════════════════════════════════════════════════╝

## Table of Contents
- [Overview](#overview)
- [Proprietary Content Protection](#proprietary-content-protection)
- [Environment Variables](#environment-variables)
- [Secure Configuration](#secure-configuration)
- [Deployment Security](#deployment-security)
- [API Key Management](#api-key-management)
- [Monitoring and Auditing](#monitoring-and-auditing)

## Overview

Prologue is designed to operate with a public repository while keeping proprietary content (such as the FPEF system prompt) secure. This is achieved through:

1. **Environment-based configuration** - Sensitive data loaded from environment variables
2. **Encrypted storage** - Optional encryption for local development
3. **Security-first deployment** - Automated checks prevent accidental exposure
4. **Public-safe defaults** - Repository contains only public-safe content

## Proprietary Content Protection

### What's Protected
- **FPEF System Prompt**: Core proprietary AI instructions
- **Agent-specific prompts**: Specialized instructions for each AI agent
- **API keys**: All service API keys and credentials
- **Configuration secrets**: Encryption keys, database URLs, etc.

### Protection Methods

#### 1. Environment Variables (Primary)
```bash
# Set your proprietary FPEF prompt
export FPEF_SYSTEM_PROMPT="Your proprietary FPEF system prompt here"

# Set agent-specific prompts
export PROLOGUE_AGENT_VISIONARY_PROMPT="Proprietary visionary prompt"
export PROLOGUE_AGENT_BUILDER_PROMPT="Proprietary builder prompt"
```

#### 2. Encrypted Storage (Development)
```javascript
import { secureConfig } from './src/config/secure-config';

// Store sensitive data securely
await secureConfig.storeSecureValue('fpef_prompt', 'your_proprietary_prompt');

// Load securely
const prompt = await secureConfig.getAIPrompt('visionary');
```

#### 3. .env Configuration
```bash
# Copy template and add your secrets
cp .env.template .env
# Edit .env with your actual values
```

## Environment Variables

### Required Variables
- `ANTHROPIC_API_KEY`: Anthropic API key (required for AI functionality)
- `RESEND_API_KEY`: Email service API key
- `FPEF_SYSTEM_PROMPT`: Proprietary FPEF system prompt

### Optional Variables
- `OPENAI_API_KEY`: OpenAI API key for additional AI capabilities
- `PROLOGUE_ENCRYPTION_KEY`: Custom encryption key for secure storage
- `JWT_SECRET`: Secret for JWT token signing
- `PORKBUN_API_KEY`: DNS management API key
- `PORKBUN_SECRET_KEY`: DNS management secret key

### Agent-Specific Prompts
```bash
export PROLOGUE_AGENT_VISIONARY_PROMPT="Your proprietary visionary instructions"
export PROLOGUE_AGENT_BUILDER_PROMPT="Your proprietary builder instructions"
export PROLOGUE_AGENT_DESIGNER_PROMPT="Your proprietary designer instructions"
export PROLOGUE_AGENT_DATA_PROMPT="Your proprietary data instructions"
export PROLOGUE_AGENT_SECURITY_PROMPT="Your proprietary security instructions"
export PROLOGUE_AGENT_DEPLOYMENT_PROMPT="Your proprietary deployment instructions"
```

## Secure Configuration

### Initialization
```bash
# Initialize secure configuration
prologue security init

# Check security status
prologue security status

# Validate configuration
prologue security check
```

### Configuration Files
- `.env.template`: Public template with no secrets
- `.env`: Local environment file (never committed)
- `.prologue-key`: Encryption key file (600 permissions)
- `config/secure.json`: Encrypted secure storage

### Security Rules
1. **Never commit `.env` files** to version control
2. **Never hardcode API keys** in source code
3. **Use environment variables** for all sensitive data
4. **Keep encryption keys secure** and backed up
5. **Regularly rotate API keys** and secrets

## Deployment Security

### Secure Deployment Process
```bash
# Use secure deployment script
./scripts/secure-deploy.sh

# Or via CLI
prologue secure-deploy
```

### Security Checks
The secure deployment script automatically checks for:
- ✅ No `.env` files in repository
- ✅ No hardcoded API keys in source code
- ✅ Proper file permissions on sensitive files
- ✅ No proprietary content in public files

### Production Deployment
For production environments:
1. Use CI/CD environment variables
2. Enable secret management services
3. Implement proper access controls
4. Set up monitoring and alerts
5. Regular security audits

## API Key Management

### Best Practices
```bash
# Generate strong API keys
openssl rand -hex 32

# Set environment variables
export ANTHROPIC_API_KEY="sk-ant-api03-your-key-here"

# Use different keys for dev/staging/prod
export NODE_ENV=production
export ANTHROPIC_API_KEY="sk-ant-api03-prod-key-here"
```

### Key Rotation
1. Generate new API key from service provider
2. Update environment variables
3. Test functionality with new key
4. Remove old key from service provider
5. Update documentation (if needed)

### Access Control
- **Read-only keys**: Use where possible
- **IP restrictions**: Limit to trusted IPs
- **Rate limiting**: Configure appropriate limits
- **Audit logging**: Enable API usage logging

## Monitoring and Auditing

### Security Monitoring
```bash
# Check configuration status
prologue security status

# Validate security setup
prologue security check

# Monitor API usage
# (Check service provider dashboards)
```

### Regular Audits
1. **Review environment variables** quarterly
2. **Audit API usage** monthly
3. **Check git history** for accidentally committed secrets
4. **Review access logs** regularly
5. **Update dependencies** for security patches

### Incident Response
If proprietary content is accidentally exposed:
1. **Immediate action**: Remove exposed content
2. **Rotate affected API keys**
3. **Review access logs** for unauthorized usage
4. **Update documentation** and procedures
5. **Team notification** and training

## CLI Security Commands

```bash
# Security management
prologue security check      # Validate security configuration
prologue security init       # Initialize secure configuration
prologue security status     # Show security status

# Secure deployment
prologue secure-deploy       # Deploy with security checks
prologue deploy --skip-security  # Deploy without checks (not recommended)

# DNS management (secure)
prologue dns configure       # Configure DNS with API keys
prologue dns status          # Check DNS status
```

## Troubleshooting

### Common Issues

#### 1. API Key Not Found
```
[ERROR] Anthropic API key not configured
```
**Solution**: Set `ANTHROPIC_API_KEY` environment variable

#### 2. Security Check Failed
```
[ERROR] .env file found in repository
```
**Solution**: Remove .env from git and add to .gitignore

#### 3. Encryption Key Missing
```
[WARNING] Encryption key not found
```
**Solution**: Set `PROLOGUE_ENCRYPTION_KEY` or let system generate one

### Getting Help
- Check environment variables: `env | grep PROLOGUE`
- Validate configuration: `prologue security check`
- Review logs for specific error messages
- Consult security documentation

## Summary

Prologue's security model ensures:
- ✅ **Public repository** contains no proprietary content
- ✅ **Proprietary prompts** are loaded securely from environment
- ✅ **API keys** are never hardcoded or committed
- ✅ **Automated checks** prevent accidental exposure
- ✅ **Secure deployment** with validation and monitoring

By following these guidelines, you can maintain a public repository while keeping your proprietary FPEF prompts and sensitive data completely secure.

---

**Last Updated**: $(date +%Y-%m-%d)
**Version**: 1.0.0
**Contact**: security@logue.pro