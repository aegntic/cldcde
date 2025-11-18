# X API v2 Free Tier Guide

## Overview

The X (Twitter) API v2 Free Tier has significant limitations compared to paid tiers. This guide documents the constraints and how the X Innovation Tracker has been optimized to work within these limits.

## Free Tier Limitations (as of 2024)

### Monthly Limits
- **Read Operations**: 10,000 tweets per month at user level
- **Write Operations**: 1,500 tweets per month at app level
- **Daily Read Limit**: Approximately 333 tweets per day (10,000 / 30 days)
- **Access**: 1 app ID + Login with X functionality

### Rate Limits
- Maximum 10 results per search query (reduced from 100)
- No access to advanced search features in some cases
- Limited thread traversal capabilities

## Optimizations Implemented

### 1. Reduced Search Scope
- Limited to 5 search queries per scan (down from 20+)
- Combined multiple keywords into single queries using OR operators
- Increased minimum engagement thresholds to reduce result counts
- Focus on top 3 innovators instead of 15

### 2. Aggressive Caching
- 24-hour cache for search results
- Cache checks before any API call
- Reuse cached data when rate limits are approaching

### 3. Rate Limit Tracking
- Daily and monthly usage tracking
- Automatic reset detection
- Pre-flight checks before API calls
- Graceful degradation when limits are reached

### 4. Scan Frequency Reduction
- Scans run every 12 hours instead of every 2 hours
- Skip scans when insufficient quota remains
- Focus on high-value content only

### 5. Query Optimization
- Higher engagement thresholds (min_faves:50-100)
- Exclude retweets to reduce noise
- Combine related searches into single queries
- Focus on recent, high-impact content

## Usage Patterns

### Optimal Usage Schedule
```
Daily Budget: 333 tweets
- Morning Scan: ~150 tweets (45% of daily budget)
- Evening Scan: ~150 tweets (45% of daily budget)
- Reserve: ~33 tweets (10% buffer)

Monthly Budget: 10,000 tweets
- Regular Scans: ~9,000 tweets (90%)
- Manual Queries: ~1,000 tweets (10% reserve)
```

### Search Query Examples

Instead of multiple specific searches:
```
"claude code" -is:retweet
"claude cli" -is:retweet
"claude mcp" -is:retweet
```

Use combined queries:
```
("claude code" OR "claude cli" OR "claude mcp") -is:retweet min_faves:50
```

## Workarounds for Common Limitations

### 1. Thread Depth Analysis
- **Limitation**: Can't traverse full threads without consuming many API calls
- **Workaround**: Use reply_count as a proxy for thread depth

### 2. User Timeline Monitoring
- **Limitation**: Fetching full timelines is expensive
- **Workaround**: Monitor only top 3 innovators, cache results for 24 hours

### 3. Real-time Monitoring
- **Limitation**: No streaming API access in free tier
- **Workaround**: Periodic scans with intelligent caching

### 4. Historical Data
- **Limitation**: Limited to recent tweets (7 days)
- **Workaround**: Store high-value tweets in local database for long-term analysis

## Monitoring Rate Limits

Check current usage:
```typescript
const status = xInnovationTracker.getRateLimitStatus()
console.log(status)
// Output:
// {
//   daily: { used: 150, limit: 333, remaining: 183 },
//   monthly: { used: 4500, limit: 10000, remaining: 5500 }
// }
```

## Best Practices

1. **Focus on Quality**: With limited API calls, prioritize high-engagement, innovative content
2. **Cache Everything**: Always check cache before making API calls
3. **Batch Operations**: Combine related searches when possible
4. **Monitor Usage**: Regularly check rate limit status
5. **Plan Ahead**: Reserve quota for important searches or viral content detection

## Upgrade Considerations

If you need more capacity, consider upgrading to:
- **Basic Tier**: $200/month for 100,000 tweets read per month
- **Pro Tier**: Higher limits for production applications

The current implementation is designed to extract maximum value from the free tier while providing a smooth upgrade path when needed.