# Security Policy

## Reporting Security Vulnerabilities

If you discover a security vulnerability in n8n-mcp, please report it by creating a private security advisory on GitHub or emailing the maintainer directly. Please do not create public issues for security vulnerabilities.

## Security Best Practices

### 1. Environment Variables

**NEVER** commit real API keys, tokens, or credentials to the repository.

- Use `.env` files for local development (already in `.gitignore`)
- Use `.env.example` as a template with placeholder values
- Generate strong tokens using: `openssl rand -base64 32`

### 2. API Keys and Tokens

- **Rotate credentials immediately** if they are exposed
- Use environment variables exclusively - no hardcoded fallbacks
- Implement proper token expiration when possible
- Use least-privilege access for API keys

### 3. Code Security

#### ❌ DON'T DO THIS:
```typescript
// NEVER hardcode credentials
const apiKey = process.env.N8N_API_KEY || 'n8n_api_actual_key_here';
const apiUrl = process.env.N8N_API_URL || 'https://production-url.com';
```

#### ✅ DO THIS INSTEAD:
```typescript
// Always require environment variables
const apiKey = process.env.N8N_API_KEY;
const apiUrl = process.env.N8N_API_URL;

if (!apiKey || !apiUrl) {
  console.error('Error: Required environment variables are missing');
  process.exit(1);
}
```

### 4. Git Security

Before committing, always check:
```bash
# Check for tracked sensitive files
git ls-files | grep -E "\.(env|pem|key|cert)$"

# Check staged changes for secrets
git diff --staged | grep -iE "(api[_-]?key|secret|token|password)"
```

### 5. Docker Security

- Never include `.env` files in Docker images
- Use build arguments for compile-time configuration
- Use runtime environment variables for secrets
- Run containers as non-root users

### 6. Dependencies

- Regularly update dependencies: `npm audit`
- Review dependency changes carefully
- Use lock files (`package-lock.json`)
- Monitor for security advisories

## Security Checklist

Before each release or deployment:

- [ ] No hardcoded credentials in source code
- [ ] All sensitive configuration uses environment variables
- [ ] `.env` files are not tracked in git
- [ ] Dependencies are up to date
- [ ] No sensitive data in logs
- [ ] API endpoints use proper authentication
- [ ] Docker images don't contain secrets

## Known Security Considerations

1. **MCP Authentication**: When running in HTTP mode, always use strong `AUTH_TOKEN` values
2. **n8n API Access**: The n8n API key provides full access to workflows - protect it carefully
3. **Database Access**: The SQLite database contains node information but no credentials

## Tools for Security

- **SecureKeyGuard**: Automated scanning for exposed secrets
- **npm audit**: Check for vulnerable dependencies
- **git-secrets**: Prevent committing secrets to git
- **dotenv-vault**: Secure environment variable management

Remember: Security is everyone's responsibility. When in doubt, ask for a security review.