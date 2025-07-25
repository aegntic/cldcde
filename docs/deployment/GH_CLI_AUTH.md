# GitHub CLI Authentication Guide

To authenticate GitHub CLI and allow me to create and manage your repository, please follow these steps:

## Option 1: Interactive Authentication (Recommended)

Open a terminal and run:
```bash
gh auth login
```

When prompted:
1. Choose "GitHub.com"
2. Choose "HTTPS" for protocol
3. Choose "Login with a web browser" or "Paste an authentication token"
4. If using browser: follow the prompts to authenticate
5. If using token: create a Personal Access Token with these scopes:
   - `repo` (Full control of private repositories)
   - `workflow` (Update GitHub Action workflows)
   - `admin:org` (If working with organizations)

## Option 2: Using Personal Access Token

1. Go to GitHub.com → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token"
3. Give it a name like "CLDCDE-CC Development"
4. Select scopes:
   - ✅ repo (all)
   - ✅ workflow
   - ✅ admin:public_key
   - ✅ admin:repo_hook
5. Click "Generate token"
6. Copy the token
7. Run in terminal:
```bash
echo "YOUR_TOKEN_HERE" | gh auth login --with-token
```

## Verify Authentication

After authenticating, verify it worked:
```bash
gh auth status
```

You should see:
```
✓ Logged in to github.com as YOUR_USERNAME
```

## Security Note

- Personal Access Tokens are like passwords - keep them secure
- Use tokens with minimal required permissions
- Set expiration dates on tokens
- Revoke tokens when no longer needed

Once you've authenticated, let me know and I can proceed with creating and managing your repository!