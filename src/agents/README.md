# Anthropic Monitoring Agent

This directory contains the automated monitoring and blog generation agents for tracking Anthropic announcements and Claude updates.

**Note**: The auto-generation pipeline now uses OpenRouter's free premium models instead of the Anthropic API for content generation.

## Overview

The monitoring system consists of three main components:

1. **Anthropic Monitor** (`anthropic-monitor.ts`) - Tracks official Anthropic channels
2. **Blog Generator** (`blog-generator.ts`) - Automatically creates blog posts from important updates
3. **Cron Handler** (`cron-handler.ts`) - Scheduled job endpoints

## Features

### Monitoring Sources

- **Anthropic Blog** - RSS feed monitoring for official blog posts
- **GitHub Repositories** - Tracks releases and significant commits from:
  - anthropic-sdk-python
  - anthropic-sdk-typescript
  - claude-artifacts
  - courses
- **Twitter/X** - Monitors @AnthropicAI tweets (requires Twitter API bearer token)

### Content Processing

- **Relevance Scoring** - Automatically scores content based on keywords and context
- **Content Extraction** - Extracts key information and generates summaries
- **Deduplication** - Ensures content is only processed once
- **Quality Filtering** - Only high-relevance content is queued for blog generation

### Auto-Blog Generation

- Groups related content for consolidated posts
- Generates well-formatted markdown blog posts
- Automatically publishes to the news section
- Maintains source attribution and metadata

## Setup

### 1. Database Migration

Run the monitoring content migration to create necessary tables:

```sql
-- Run in Supabase SQL editor
-- Contents of supabase/migrations/monitoring_content.sql
```

### 2. Environment Variables

Add these to your `.env` file:

```env
# Required
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key
CRON_SECRET=your_secure_cron_secret
OPENROUTER_API_KEY=your_openrouter_api_key

# Optional (for enhanced monitoring)
GITHUB_TOKEN=your_github_personal_access_token
TWITTER_BEARER_TOKEN=your_twitter_api_bearer_token
```

### 3. Cron Job Setup

Schedule these endpoints in your hosting platform:

- **Monitoring Only**: `POST /api/cron/monitor-anthropic`
  - Recommended: Every 4 hours
  - Headers: `X-Cron-Secret: your_cron_secret`

- **Blog Generation Only**: `POST /api/cron/generate-blogs`
  - Recommended: Daily at 9 AM
  - Headers: `X-Cron-Secret: your_cron_secret`

- **Combined (Monitor + Generate)**: `POST /api/cron/monitor-and-generate`
  - Recommended: Every 6 hours
  - Headers: `X-Cron-Secret: your_cron_secret`

## API Endpoints

### Public Endpoints

- `GET /api/monitoring/anthropic/recent` - Get recent Anthropic updates
- `GET /api/monitoring/anthropic/important` - Get high-relevance updates
- `GET /api/monitoring/anthropic/search?q=query` - Search monitoring content
- `GET /api/monitoring/anthropic/stats` - Get monitoring statistics

### Admin Endpoints

- `POST /api/monitoring/anthropic/trigger` - Manually trigger monitoring (requires admin auth)

## Relevance Scoring

Content is scored from 0-1 based on keyword matches:

- **High Relevance (0.7+)**: Model releases, API updates, new features
- **Medium Relevance (0.4-0.7)**: General updates, partnerships, research
- **Low Relevance (<0.4)**: General company news, not directly Claude-related

## Blog Generation Logic

1. **Content Grouping**: Related content is grouped by:
   - Same publication date
   - Common tags (2+ matches)
   - Similar titles (2+ significant words)

2. **Title Generation**: 
   - Single item: Cleaned source title
   - Multiple items: Summary title based on content type

3. **Auto-Publishing**: Generated posts are automatically published with:
   - Proper categorization
   - Source attribution
   - Metadata tracking
   - Auto-generated tag

## Monitoring Best Practices

1. **API Rate Limits**: 
   - GitHub: 5000 requests/hour with token
   - Twitter: Varies by plan
   - Use caching to avoid repeated requests

2. **Error Handling**:
   - Failed sources don't block other monitoring
   - Errors are logged but process continues
   - Retries handled at cron level

3. **Content Quality**:
   - Review auto-generated posts periodically
   - Adjust relevance thresholds as needed
   - Monitor false positives/negatives

## Troubleshooting

### Common Issues

1. **No Twitter data**: Ensure `TWITTER_BEARER_TOKEN` is set
2. **GitHub rate limits**: Add `GITHUB_TOKEN` for higher limits
3. **Duplicate content**: Check `source_id` uniqueness constraint
4. **Blog generation fails**: Check Supabase permissions and RLS policies

### Debug Mode

Set environment variable `DEBUG=monitoring:*` for detailed logs

## Future Enhancements

- [ ] Webhook support for real-time updates
- [ ] Discord/Slack notifications for high-relevance content
- [ ] Custom relevance scoring models
- [ ] Multi-language support
- [ ] RSS feed for generated blogs
- [ ] Advanced model selection based on content type