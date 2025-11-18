# 🚀 Simplified Deployment Guide for cldcde.cc

## Overview

The new simplified architecture uses just 4 services instead of 10+:

1. **Supabase** - Database, Auth, and Realtime
2. **Meilisearch** - Search functionality  
3. **Cloudflare** - Hosting, CDN, and Caching
4. **Sentry** - Error tracking (optional)

## Prerequisites

- Bun installed locally
- Accounts created at:
  - Cloudflare (free)
  - Supabase (free tier)
  - Meilisearch Cloud (free tier)
  - Sentry (optional, free tier)

## Step-by-Step Deployment

### 1. Initial Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/claude-extensions-website.git
cd claude-extensions-website

# Install dependencies
bun install
```

### 2. Run Setup Wizard

```bash
# Run the interactive setup wizard
bun run setup:wizard
```

The wizard will:
- Guide you through getting credentials from each service
- Test connections as you go
- Create your `.env` file automatically

### 3. Set Up Supabase Database

```bash
# Run the Supabase setup script
bun run supabase:setup
```

If automatic setup fails, manually run the schema:
1. Go to your Supabase SQL Editor
2. Copy contents of `supabase/schema.sql`
3. Run the SQL commands

### 4. Deploy to Cloudflare

```bash
# Create KV namespace for caching
wrangler kv:namespace create CACHE

# Update wrangler-v2.toml with the KV namespace ID

# Set production secrets
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_ANON_KEY  
wrangler secret put SUPABASE_SERVICE_KEY
wrangler secret put MEILISEARCH_HOST
wrangler secret put MEILISEARCH_KEY

# Deploy the Worker
wrangler deploy -c wrangler-v2.toml

# Deploy frontend to Pages
bun run build
wrangler pages deploy dist --project-name=cldcde
```

### 5. Post-Deployment Setup

```bash
# Index initial data in Meilisearch
bun run search:index

# Verify deployment
curl https://your-worker.workers.dev/health
```

### 6. Configure Supabase

In your Supabase dashboard:

1. **Enable Email Auth**:
   - Authentication → Providers → Email → Enable

2. **Set up OAuth (optional)**:
   - Authentication → Providers → GitHub → Enable
   - Add redirect URL: `https://cldcde.cc/auth/callback`

3. **Configure Email Templates**:
   - Authentication → Email Templates
   - Customize as needed

4. **Enable Row Level Security**:
   - SQL Editor → Run:
   ```sql
   -- This is already in the schema, but verify it's enabled
   ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
   ALTER TABLE extensions ENABLE ROW LEVEL SECURITY;
   -- etc for other tables
   ```

## Environment Variables

Your `.env` file should contain:

```env
# Cloudflare
CLOUDFLARE_ACCOUNT_ID=your_account_id

# Supabase (Database + Auth + Realtime)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key

# Meilisearch (Search)
MEILISEARCH_HOST=https://ms-xxxxx.meilisearch.io
MEILISEARCH_KEY=your_api_key

# Sentry (Optional)
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
```

## Architecture Benefits

### Before (Complex):
- 10+ services to manage
- Complex deployment process
- High maintenance overhead
- $200-500/month at scale

### After (Simplified):
- Only 4 services (2 required + 2 optional)
- Single deployment command
- Minimal maintenance
- $50-100/month at scale

## Monitoring

### Health Checks
```bash
# Check overall health
curl https://cldcde.workers.dev/health

# Check specific service
curl https://cldcde.workers.dev/api
```

### Cloudflare Analytics
- Workers & Pages → Analytics
- Real-time request monitoring
- Automatic performance tracking

### Supabase Monitoring
- Database → Logs
- API usage statistics
- Realtime connection monitoring

## Troubleshooting

### Common Issues

**Worker not deploying:**
- Check wrangler is logged in: `wrangler whoami`
- Verify account ID in wrangler.toml

**Supabase connection errors:**
- Verify service key has admin privileges
- Check Row Level Security policies

**Search not working:**
- Run `bun run search:index` again
- Verify Meilisearch API key permissions

**Caching issues:**
- Clear KV namespace: `wrangler kv:key list --binding=CACHE`
- Check cache hit rates in Worker analytics

## Maintenance

### Daily
- Monitor error rates in Cloudflare dashboard
- Check Supabase connection pool usage

### Weekly  
- Review search analytics in Meilisearch
- Update search synonyms based on queries

### Monthly
- Review costs across all services
- Optimize database queries if needed
- Update dependencies: `bun update`

## Scaling

The simplified architecture scales automatically:

- **Cloudflare Workers**: Unlimited scale, pay per request
- **Supabase**: Auto-scales connections, upgrade plan as needed
- **Meilisearch**: Handles millions of documents on free tier
- **Cloudflare KV**: 1GB free, unlimited reads

## Cost Breakdown

### Free Tier Limits
- Cloudflare Workers: 100k requests/day
- Cloudflare KV: 1GB storage, 100k reads/day
- Supabase: 500MB database, 2GB bandwidth
- Meilisearch: 100k documents
- Sentry: 5k errors/month

### Estimated Monthly Costs
- 1k users: $0 (all free tiers)
- 10k users: ~$20
- 100k users: ~$100

## Support

- Cloudflare: https://community.cloudflare.com
- Supabase: https://github.com/supabase/supabase/discussions
- Meilisearch: https://github.com/meilisearch/meilisearch/discussions

---

🎉 Congratulations! Your simplified cldcde.cc platform is deployed and ready to scale!