# CLDCDE Pro Deployment Guide

## 🔐 Security First

**NEVER commit production secrets to the repository!**

All sensitive configuration files are templated and must be created locally for deployment.

## 📋 Prerequisites

1. **Cloudflare Account** with Pages access
2. **Supabase Project** set up
3. **GitHub OAuth App** configured for your domain
4. **Domain** pointed to Cloudflare (if using custom domain)

## 🚀 Deployment Steps

### 1. Environment Setup

Copy the template files and fill in your actual values:

```bash
# Copy templates and customize
cp .env.production.template .env.production
cp wrangler.toml.template wrangler.toml
cp deploy.sh.template deploy.sh

# Make deploy script executable
chmod +x deploy.sh
```

### 2. Configure Environment Variables

Edit `.env.production` with your actual values:
- Replace `your_cloudflare_account_id` with your Cloudflare account ID
- Replace `your-project.supabase.co` with your Supabase project URL
- Replace `your_supabase_anon_key` with your Supabase anon key
- Set your domain name throughout the file

### 3. GitHub OAuth Setup

1. Go to GitHub Settings > Developer settings > OAuth Apps
2. Create a new OAuth App with:
   - **Application name**: CLDCDE Pro
   - **Homepage URL**: `https://your-domain.com`
   - **Authorization callback URL**: `https://your-domain.com/auth/callback`
3. Copy the Client ID and Client Secret to `.env.production`

### 4. Supabase Database Setup

Run the database schema:
```sql
-- Execute the contents of database/schema-postgres.sql in your Supabase SQL editor
```

### 5. Build and Deploy

```bash
# Install dependencies
cd frontend && npm install

# Build for production
./deploy.sh

# Deploy to Cloudflare Pages
wrangler pages deploy frontend/dist --project-name your-app-name
```

### 6. Configure Custom Domain (Optional)

1. In Cloudflare Pages, go to your project settings
2. Add your custom domain
3. Update DNS records as instructed

## 🔧 Local Development

For local development, use `.env.example`:

```bash
cp .env.example .env
# Edit .env with local development values
```

## 📊 Monitoring

The application includes built-in monitoring:
- **Health checks**: `/api/health`
- **Metrics**: `/api/metrics` (if enabled)
- **Logs**: Application logs via Cloudflare Workers logs

## 🔒 Security Checklist

- [ ] `.env.production` is not committed to git
- [ ] `wrangler.toml` is not committed to git
- [ ] GitHub OAuth app uses HTTPS callback URLs
- [ ] Supabase RLS policies are enabled
- [ ] JWT secret is cryptographically secure (256+ bits)
- [ ] CORS is properly configured for your domain

## 🐛 Troubleshooting

### Build Fails
- Check Node.js version (18+ required)
- Verify all dependencies are installed: `npm install`
- Check TypeScript errors: `npm run type-check`

### Authentication Issues
- Verify GitHub OAuth app configuration
- Check callback URL matches exactly
- Ensure Supabase auth is configured for your domain

### Deployment Issues
- Verify Cloudflare account ID is correct
- Check wrangler authentication: `wrangler whoami`
- Ensure custom domain DNS is pointed to Cloudflare

## 📞 Support

If you encounter issues:
1. Check the logs in Cloudflare Pages dashboard
2. Verify Supabase project settings
3. Review GitHub OAuth app configuration
4. Check this repository's issues for similar problems