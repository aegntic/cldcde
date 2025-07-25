# GitHub Integration Guide for CLDCDE Pro

## Current Status

The GitHub dark theme is fully implemented and the OAuth integration code is ready. To enable GitHub login and repository access, you need to configure GitHub OAuth credentials.

## Quick Start

### Option 1: GitHub OAuth App (Recommended)

1. **Create GitHub OAuth App**
   ```
   Go to: https://github.com/settings/developers
   Click: "New OAuth App"
   
   Fill in:
   - Application name: CLDCDE Pro
   - Homepage URL: http://localhost:8083
   - Authorization callback URL: http://localhost:8083/auth/github/callback
   ```

2. **Configure Environment**
   ```bash
   # Copy the example env file
   cp .env.example .env
   
   # Edit .env and add your credentials:
   GITHUB_CLIENT_ID="your_client_id_here"
   GITHUB_CLIENT_SECRET="your_client_secret_here"
   ```

3. **Run with GitHub Integration**
   ```bash
   # Load environment and run
   source .env && cargo run -p web-dashboard
   ```

4. **Login with GitHub**
   - Go to: http://localhost:8083/login
   - Click "Continue with GitHub"
   - Authorize the app
   - You'll see your repos and profile!

### Option 2: Personal Access Token

1. **Generate Token**
   ```
   Go to: https://github.com/settings/tokens
   Click: "Generate new token (classic)"
   
   Select scopes:
   - repo (Full control of private repositories)
   - read:user (Read all user profile data)
   - user:email (Access user email)
   ```

2. **Configure Token**
   ```bash
   # Add to .env file:
   GITHUB_TOKEN="ghp_your_token_here"
   ```

## Available Features

Once configured, you get:

- ✅ GitHub login authentication
- ✅ User profile with avatar
- ✅ Repository listing
- ✅ Repository details (stars, forks, language)
- ✅ GitHub dark theme UI
- ✅ Issues and PR management (backend ready)
- ✅ Project synchronization (backend ready)

## Testing Without GitHub

If you want to test the UI without GitHub setup:

1. Use default credentials:
   - Username: `admin`
   - Password: `admin123`

2. The UI will show mock data for repositories

## Troubleshooting

### "GitHub authentication via personal access token" message
This means OAuth credentials aren't configured. The system falls back to admin login.

### No repositories showing
- Check if your token has `repo` scope
- Ensure environment variables are loaded (`source .env`)

### OAuth redirect fails
- Verify callback URL matches exactly
- Check that port 8083 is correct in your OAuth app

## URLs

- **Home**: http://localhost:8083/
- **Login**: http://localhost:8083/login
- **GitHub OAuth Start**: http://localhost:8083/auth/github
- **Dashboard**: http://localhost:8083/dashboard (after login)
- **Repositories**: http://localhost:8083/repositories (after login)

## Next Steps

After setting up GitHub integration:

1. Login with GitHub
2. Your repositories will automatically load
3. Click on any repo to see details
4. Use the dashboard to manage your development workflow

The GitHub dark theme is already applied and working!