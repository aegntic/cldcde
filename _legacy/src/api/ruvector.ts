/**
 * CLDCDE Platform API Routes for RuVector
 *
 * Enhanced search, recommendations, and trending endpoints
 * using ruvector's high-performance capabilities
 */

import { Hono } from 'hono';
import { PlatformRuVectorService } from '../services/ruvector/platform-ruvector-service';

const ruvectorRoutes = new Hono();
const ruvectorService = new PlatformRuVectorService();

// Initialize service on first use
let initialized = false;
async function ensureInitialized() {
  if (!initialized) {
    await ruvectorService.initialize();
    initialized = true;
  }
}

/**
 * POST /api/ruvector/search
 * Enhanced semantic search for extensions
 */
ruvectorRoutes.post('/search', async (c) => {
  await ensureInitialized();

  const { query, category, minRating, limit, userId } = await c.req.json();

  if (!query) {
    return c.json({ error: 'Query parameter is required' }, 400);
  }

  const results = await ruvectorService.searchExtensions(query, {
    limit: limit || 10,
    category,
    minRating,
    personalizedForUser: userId
  });

  return c.json({
    query,
    results,
    count: results.length
  });
});

/**
 * GET /api/ruvector/trending
 * Get trending extensions
 */
ruvectorRoutes.get('/trending', async (c) => {
  await ensureInitialized();

  const timeWindow = c.req.query('timeWindow') || 'day';
  const limit = parseInt(c.req.query('limit') || '10');

  const trending = await ruvectorService.getTrendingExtensions(
    timeWindow as any,
    limit
  );

  return c.json({
    timeWindow,
    trending,
    count: trending.length
  });
});

/**
 * POST /api/ruvector/recommend
 * Get personalized recommendations
 */
ruvectorRoutes.post('/recommend', async (c) => {
  await ensureInitialized();

  const { installedExtensions, limit } = await c.req.json();

  if (!installedExtensions || !Array.isArray(installedExtensions)) {
    return c.json({ error: 'installedExtensions array is required' }, 400);
  }

  const recommendations = await ruvectorService.recommendExtensions(
    installedExtensions,
    limit || 5
  );

  return c.json({
    recommendations,
    count: recommendations.length
  });
});

/**
 * POST /api/ruvector/track
 * Track user activity for personalization
 */
ruvectorRoutes.post('/track', async (c) => {
  await ensureInitialized();

  const { userId, activity } = await c.req.json();

  if (!userId || !activity) {
    return c.json({ error: 'userId and activity are required' }, 400);
  }

  await ruvectorService.trackUserActivity(userId, activity);

  return c.json({
    success: true,
    message: 'Activity tracked successfully'
  });
});

/**
 * GET /api/ruvector/similar/:extensionId
 * Find similar extensions (for deduplication)
 */
ruvectorRoutes.get('/similar/:extensionId', async (c) => {
  await ensureInitialized();

  const extensionId = c.req.param('extensionId');
  const threshold = parseFloat(c.req.query('threshold') || '0.85');
  const limit = parseInt(c.req.query('limit') || '5');

  const similar = await ruvectorService.findSimilarExtensions(
    extensionId,
    threshold,
    limit
  );

  return c.json({
    extensionId,
    threshold,
    similar,
    count: similar.length
  });
});

/**
 * GET /api/ruvector/stats
 * Get ruvector service statistics
 */
ruvectorRoutes.get('/stats', async (c) => {
  await ensureInitialized();

  const stats = await ruvectorService.getStats();

  return c.json(stats);
});

export default ruvectorRoutes;
