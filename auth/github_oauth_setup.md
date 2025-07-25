# GitHub OAuth App Setup - Production
## By SecurityMaster

### Step 1: Create GitHub OAuth App

1. Go to: https://github.com/settings/developers
2. Click "New OAuth App"
3. Fill in:
   - **Application name**: CLDCDE Pro
   - **Homepage URL**: https://cldcde.pro (or your domain)
   - **Authorization callback URL**: https://cldcde.pro/auth/github/callback
   - **Enable Device Flow**: No

### Step 2: Development App (for local testing)
1. Create another app for development:
   - **Application name**: CLDCDE Pro (Dev)
   - **Homepage URL**: http://localhost:3000
   - **Authorization callback URL**: http://localhost:3000/auth/github/callback

### Step 3: Store Credentials Securely

```bash
# Production .env
GITHUB_CLIENT_ID=your_production_client_id
GITHUB_CLIENT_SECRET=your_production_client_secret
GITHUB_REDIRECT_URI=https://cldcde.pro/auth/github/callback

# Development .env.local
GITHUB_CLIENT_ID=your_dev_client_id
GITHUB_CLIENT_SECRET=your_dev_client_secret
GITHUB_REDIRECT_URI=http://localhost:3000/auth/github/callback
```

### OAuth Flow Implementation Plan

1. **Authorization URL**:
   ```
   https://github.com/login/oauth/authorize?
     client_id={CLIENT_ID}&
     redirect_uri={REDIRECT_URI}&
     scope=repo,user,workflow&
     state={CSRF_TOKEN}
   ```

2. **Token Exchange**:
   ```
   POST https://github.com/login/oauth/access_token
   ```

3. **Required Scopes**:
   - `repo` - Full repository access
   - `user` - User profile data
   - `workflow` - GitHub Actions access
   - `read:org` - Organization membership

### Security Implementation
- PKCE flow for additional security
- State parameter for CSRF protection
- Encrypted token storage in database
- Automatic token refresh
- Rate limiting on auth endpoints