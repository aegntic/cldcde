# GitHub OAuth Setup Guide

This guide helps you set up GitHub OAuth for the seamless download flow.

## 1. Create GitHub OAuth App

1. Go to GitHub Settings → Developer settings → OAuth Apps
2. Click "New OAuth App"
3. Fill in the details:
   - **Application name**: cldcde.cc Downloads
   - **Homepage URL**: https://cldcde.cc
   - **Authorization callback URL**: https://api.cldcde.cc/api/github/callback
   - **Enable Device Flow**: No (unchecked)

4. Click "Register application"

## 2. Get Your Credentials

After creating the app:
1. Copy the **Client ID**
2. Click "Generate a new client secret"
3. Copy the **Client Secret** (save it securely, you won't see it again)

## 3. Configure Environment Variables

Add these to your Cloudflare Worker environment:

```bash
# In wrangler.toml
[vars]
GITHUB_CLIENT_ID = "your_client_id_here"
GITHUB_CLIENT_SECRET = "your_client_secret_here"
GITHUB_REDIRECT_URI = "https://api.cldcde.cc/api/github/callback"
```

Or via Cloudflare Dashboard:
1. Go to Workers & Pages → your worker → Settings → Variables
2. Add each variable as an encrypted environment variable

## 4. Update Supabase Schema

Run the GitHub integration schema:

```bash
# Connect to your Supabase database
psql $DATABASE_URL < supabase/github-integration-schema.sql
```

## 5. Test the Flow

1. Visit your site and try downloading a resource
2. You should see the consent modal
3. Clicking "Proceed with GitHub" should:
   - Redirect to GitHub for authorization
   - After approval, auto-follow @aegntic
   - Auto-star the repository
   - Redirect to download

## Security Notes

- Client Secret must be kept secure (use encrypted env vars)
- OAuth state parameter prevents CSRF attacks
- Tokens are not stored permanently
- Users can revoke access anytime in GitHub settings

## Troubleshooting

### "Bad credentials" error
- Check that Client ID and Secret are correct
- Ensure environment variables are properly set

### Redirect URI mismatch
- Verify the callback URL matches exactly
- Check for trailing slashes
- Ensure HTTPS is used

### Rate limiting
- GitHub has rate limits for OAuth operations
- Consider caching user tokens temporarily
- Implement exponential backoff for retries