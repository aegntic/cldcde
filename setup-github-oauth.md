# GitHub OAuth Integration Setup Guide

## Prerequisites

To integrate CLDCDE Pro with GitHub, you need to create a GitHub OAuth App and configure the environment variables.

## Step 1: Create a GitHub OAuth App

1. Go to GitHub Settings → Developer settings → OAuth Apps
   - Direct link: https://github.com/settings/developers
   
2. Click "New OAuth App"

3. Fill in the application details:
   - **Application name**: CLDCDE Pro
   - **Homepage URL**: http://localhost:8083
   - **Authorization callback URL**: http://localhost:8083/auth/github/callback
   - **Description**: Autonomous AI development orchestration system

4. Click "Register application"

5. You'll receive:
   - **Client ID**: (copy this)
   - **Client Secret**: (click "Generate a new client secret" and copy it)

## Step 2: Configure Environment Variables

Create a `.env` file in the project root:

```bash
# GitHub OAuth Configuration
export GITHUB_CLIENT_ID="your_client_id_here"
export GITHUB_CLIENT_SECRET="your_client_secret_here"
export GITHUB_REDIRECT_URI="http://localhost:8083/auth/github/callback"

# Optional: Personal Access Token (alternative to OAuth)
export GITHUB_TOKEN="your_personal_access_token"

# Dashboard Configuration
export DASHBOARD_PORT=8083
export JWT_SECRET="your-secret-key-change-in-production"
export SESSION_TIMEOUT=3600
```

## Step 3: Run with Environment Variables

```bash
# Load environment variables
source .env

# Run the web dashboard
cargo run -p web-dashboard
```

## Step 4: Access GitHub OAuth

Once configured, you can:

1. Go to http://localhost:8083/login
2. Click "Login with GitHub" button (or navigate to http://localhost:8083/auth/github)
3. Authorize the application on GitHub
4. You'll be redirected back and logged in with your GitHub account

## OAuth Flow URLs

- **Start OAuth**: http://localhost:8083/auth/github
- **Callback URL**: http://localhost:8083/auth/github/callback

## Alternative: Personal Access Token

If you prefer not to use OAuth, you can use a GitHub Personal Access Token:

1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token with scopes:
   - `repo` (Full control of private repositories)
   - `read:user` (Read all user profile data)
   - `user:email` (Access user email addresses)
   - `project` (Read project data)

3. Set the token in your environment:
   ```bash
   export GITHUB_TOKEN="ghp_your_token_here"
   ```

## Current Integration Status

The GitHub integration in the code supports:
- OAuth authentication flow
- User profile fetching
- Repository listing
- Issues and PR management
- Project synchronization

## Troubleshooting

1. **OAuth redirect fails**: Make sure the callback URL in your GitHub app matches exactly
2. **No repositories showing**: Ensure your token/OAuth app has the `repo` scope
3. **Authentication errors**: Check that environment variables are properly set

## Testing the Integration

After setup, you should be able to:
1. Login with GitHub
2. See your GitHub username and avatar in the dashboard
3. View all your repositories in the repositories page
4. Access repository details and manage issues/PRs