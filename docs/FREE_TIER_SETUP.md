# Free Tier Setup Guide

```
╔═╗ ╔═╗ ╔═╗ ╔═╗     ╔╦╗ ╦ ╔═╗ ╔═╗ 
╠═  ╠╦╝ ╠═  ╠═       ║  ║ ╠═  ╠╦╝ 
╩   ╩╚═ ╚═╝ ╚═╝      ╩  ╩ ╚═╝ ╩╚═ 
```

This guide helps you set up cldcde.cc using only free tier services, making it accessible for developers on a budget.

## Overview

The platform can operate entirely on free tiers:
- **Cloudflare**: Free Workers & Pages (100K requests/day)
- **Supabase**: Free tier (500MB database, 2GB storage)
- **OpenRouter**: Free premium AI models
- **X API**: Basic tier (10K tweets/month)
- **GitHub API**: 5K requests/hour (authenticated)

## 1. X (Twitter) API - Free Tier

### Limitations
- **10,000 tweets/month** read quota
- No posting capabilities
- Basic search only

### Setup
1. Apply for Basic access at [developer.twitter.com](https://developer.twitter.com)
2. Create a project and app
3. Generate Bearer Token
4. Add to Cloudflare: `wrangler secret put X_BEARER_TOKEN`

### Optimization Strategy
The tracker is pre-configured for free tier:
- Scans every 12 hours (not 2)
- Monitors top 3 innovators only
- Caches results for 24 hours
- Focuses on high-engagement content (50+ likes)

## 2. OpenRouter - Free Premium Models

### Available Free Models
- **Google Gemini 2.0 Flash** (1M context) - Best for complex blog posts
- **Meta Llama 3.2 3B** (128K context) - Fast and efficient
- **Mistral 7B Instruct** - Good for code-heavy content
- **Qwen 2 7B** - Excellent for technical writing

### Setup
1. Sign up at [openrouter.ai](https://openrouter.ai)
2. Get your API key
3. Add to Cloudflare: `wrangler secret put OPENROUTER_API_KEY`

### Usage Tips
- The pipeline auto-selects the best free model
- Gemini 2.0 Flash is preferred for quality
- Falls back to smaller models if rate limited
- All models support JSON output for structured generation

## 3. GitHub API - Free Tier

### Limits
- **60 requests/hour** (unauthenticated)
- **5,000 requests/hour** (authenticated)

### Setup (Optional but Recommended)
1. Create a GitHub personal access token
2. Add to Cloudflare: `wrangler secret put GITHUB_TOKEN`

### Benefits
- 83x more API calls
- Access to more repository data
- Better innovation tracking

## 4. Cost Breakdown

### Monthly Costs (Free Tier)
- **Cloudflare Workers**: $0 (100K requests/day free)
- **Cloudflare KV**: $0 (100K reads/day free)
- **Supabase**: $0 (500MB database free)
- **OpenRouter**: $0 (free models)
- **X API**: $0 (Basic tier)
- **GitHub API**: $0
- **Total**: $0/month

### When You'll Need to Upgrade
- **Cloudflare**: >3M requests/month
- **Supabase**: >500MB data or >2GB storage
- **X API**: Need posting or >10K reads/month
- **OpenRouter**: Need specific premium models

## 5. Monitoring Agent Schedule

Optimized for free tiers:

```yaml
# Recommended cron schedule
anthropic_monitor: "0 */6 * * *"    # Every 6 hours
github_innovation: "0 */8 * * *"    # Every 8 hours  
youtube_discoverer: "0 */12 * * *"  # Every 12 hours
x_innovation: "0 */12 * * *"        # Every 12 hours (was 2)
auto_generation: "0 */6 * * *"      # Every 6 hours
```

## 6. Performance Tips

### Caching Strategy
- KV cache for 24 hours on all discoveries
- Deduplication prevents reprocessing
- Frontend caches API responses

### Database Optimization
- Indexes on all search fields
- Partial indexes for active records
- Regular cleanup of old discoveries

### API Usage
- Batch requests where possible
- Use pagination efficiently
- Implement exponential backoff

## 7. Upgrade Path

When ready to scale:

1. **X API Pro** ($100/month): 1M tweets, posting capability
2. **Supabase Pro** ($25/month): 8GB database, better performance
3. **Cloudflare Workers Paid** ($5/month): 10M requests
4. **OpenRouter Credits**: Access to GPT-4, Claude, etc.

## Conclusion

The platform is designed to run entirely on free tiers while maintaining high quality. The smart model selection, aggressive caching, and optimized schedules ensure you stay within limits while discovering the best Claude innovations.

As your platform grows, each service can be independently upgraded based on your needs. Start free, scale when ready!