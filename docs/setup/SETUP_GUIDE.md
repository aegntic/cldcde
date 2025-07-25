# 🚀 cldcde.cc Setup Guide

## Prerequisites

Before running the setup, you need to create accounts and obtain credentials from these services:

### 1. Cloudflare (Required)
1. Sign up at https://cloudflare.com
2. Go to **My Profile** → **API Tokens**
3. Click **Create Token**
4. Use the **Edit Cloudflare Workers** template
5. Save your:
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID` (found in dashboard URL or right sidebar)

### 2. Neo4j Aura (Required)
1. Sign up at https://neo4j.com/cloud/aura-free/
2. Create a **Free** instance
3. Save the credentials shown (you won't see the password again!):
   - `NEO4J_URI` (starts with `neo4j+s://`)
   - `NEO4J_USERNAME` (usually `neo4j`)
   - `NEO4J_PASSWORD`

### 3. Upstash Redis (Required)
1. Sign up at https://upstash.com
2. Create a new Redis database (free tier)
3. Go to **REST API** tab
4. Copy:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

### 4. Meilisearch Cloud (Required)
1. Sign up at https://cloud.meilisearch.com
2. Create a new project (free tier)
3. Save:
   - `MEILISEARCH_HOST` (e.g., `https://ms-xxxx.meilisearch.io`)
   - `MEILISEARCH_KEY` (Master key from Settings)

### 5. Supabase (Required)
1. Sign up at https://supabase.com
2. Create a new project
3. Go to **Settings** → **API**
4. Copy:
   - `SUPABASE_URL` (Project URL)
   - `SUPABASE_ANON_KEY` (Anon/Public key)

## Setup Steps

### Step 1: Configure Environment

```bash
# Create a new .env file with all required variables
cat > .env << 'EOF'
# Cloudflare
CLOUDFLARE_API_TOKEN=your_token_here
CLOUDFLARE_ACCOUNT_ID=your_account_id_here

# Neo4j
NEO4J_URI=neo4j+s://your-instance.databases.neo4j.io
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your_password_here

# Upstash Redis
UPSTASH_REDIS_REST_URL=https://your-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token_here

# Meilisearch
MEILISEARCH_HOST=https://ms-your-instance.meilisearch.io
MEILISEARCH_KEY=your_master_key_here

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here

# JWT Secret (generate a random one)
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Optional monitoring
SENTRY_DSN=
GRAFANA_API_KEY=

# Server config
NODE_ENV=development
PORT=3000
EOF
```

### Step 2: Edit the .env file

Open `.env` in your editor and replace all the placeholder values with your actual credentials.

### Step 3: Run Setup

```bash
# 1. Check everything is ready
bun run preflight

# 2. If all checks pass, run setup
bun run setup
```

## What the Setup Script Does

1. **Installs dependencies** via Bun
2. **Creates Cloudflare resources**:
   - D1 database for content
   - KV namespace for caching
   - R2 bucket for file storage
3. **Initializes databases**:
   - Neo4j constraints and indexes
   - D1 schema and tables
4. **Configures secrets** in Cloudflare Workers
5. **Builds the application**
6. **Indexes search data** in Meilisearch
7. **Deploys to Cloudflare**

## Troubleshooting

### "Missing environment variables"
- Make sure you've filled in ALL values in `.env`
- Don't use quotes around the values
- Check for trailing spaces

### "Wrangler not found"
- The setup script will install it automatically
- Or install manually: `bun add -g wrangler`

### "Database connection failed"
- Verify your Neo4j instance is running
- Check the URI format (should start with `neo4j+s://`)
- Ensure password is correct (no quotes needed)

### "Cloudflare API error"
- Verify your API token has the correct permissions
- Check your account ID is correct
- Ensure you're not hitting rate limits

## Next Steps

After successful deployment:

1. **Access your site** at the Worker URL shown in deployment output
2. **Configure custom domain** (optional):
   - Go to Cloudflare Dashboard → Workers & Pages
   - Select your worker → Settings → Domains & Routes
   - Add custom domain

3. **Monitor your application**:
   - Check health: `curl https://your-worker.workers.dev/health`
   - View logs: `wrangler tail`
   - Check metrics in Cloudflare dashboard

## Support

- **Issues**: Create an issue in the GitHub repository
- **Cloudflare Discord**: https://discord.cloudflare.com
- **Documentation**: See INTEGRATION.md for detailed architecture docs