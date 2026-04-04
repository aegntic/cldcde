import { invalidateCacheByPattern, batchInvalidate, CACHE_PREFIXES } from './upstash'

/**
 * Cache invalidation strategies for featured content
 */

/**
 * Invalidate featured content caches when new content is added
 */
export async function invalidateOnContentAdded(
  type: 'extension' | 'mcp'
): Promise<void> {
  const keysToInvalidate = [
    `${CACHE_PREFIXES.FEATURED}:type:all`,
    `${CACHE_PREFIXES.FEATURED}:type:new`,
    // Also invalidate lists as they might show in featured
    `${CACHE_PREFIXES.EXTENSIONS_LIST}:*`,
    `${CACHE_PREFIXES.MCP_LIST}:*`
  ]

  // Invalidate featured content
  await Promise.all([
    invalidateCacheByPattern(`${CACHE_PREFIXES.FEATURED}:*`),
    batchInvalidate(keysToInvalidate)
  ])
}

/**
 * Invalidate trending caches when downloads/ratings change
 */
export async function invalidateOnEngagementUpdate(
  targetId: string,
  targetType: 'extension' | 'mcp',
  action: 'download' | 'rating'
): Promise<void> {
  const keysToInvalidate = [
    `${CACHE_PREFIXES.FEATURED}:type:all`,
    `${CACHE_PREFIXES.FEATURED}:type:trending`,
    `${CACHE_PREFIXES.FEATURED}:type:popular`
  ]

  // Also invalidate specific item detail
  const detailPrefix = targetType === 'extension' 
    ? CACHE_PREFIXES.EXTENSIONS_DETAIL 
    : CACHE_PREFIXES.MCP_DETAIL
  
  keysToInvalidate.push(`${detailPrefix}:id:${targetId}`)

  await batchInvalidate(keysToInvalidate)
}

/**
 * Invalidate user-related featured content
 */
export async function invalidateOnUserActivity(
  userId: string,
  action: 'joined' | 'created_content'
): Promise<void> {
  if (action === 'joined') {
    // Only invalidate stats in featured
    await batchInvalidate([
      `${CACHE_PREFIXES.FEATURED}:type:all`,
      `${CACHE_PREFIXES.STATS}:*`
    ])
  } else if (action === 'created_content') {
    // Full featured invalidation
    await invalidateCacheByPattern(`${CACHE_PREFIXES.FEATURED}:*`)
  }
}

/**
 * Smart invalidation based on time patterns
 * Run this periodically to ensure fresh content
 */
export async function smartInvalidation(): Promise<void> {
  const now = new Date()
  const hour = now.getHours()

  // During peak hours (9 AM - 6 PM), invalidate more frequently
  if (hour >= 9 && hour <= 18) {
    // Invalidate trending every hour during peak
    await batchInvalidate([
      `${CACHE_PREFIXES.FEATURED}:type:trending`,
      `${CACHE_PREFIXES.FEATURED}:type:popular`
    ])
  }

  // Always invalidate 'new' content to ensure freshness
  await batchInvalidate([
    `${CACHE_PREFIXES.FEATURED}:type:new`
  ])
}

/**
 * Batch invalidation for multiple content updates
 */
export async function batchInvalidateContent(
  updates: Array<{
    id: string
    type: 'extension' | 'mcp'
    action: 'add' | 'update' | 'delete'
  }>
): Promise<void> {
  const keysToInvalidate = new Set<string>()

  // Always invalidate main featured
  keysToInvalidate.add(`${CACHE_PREFIXES.FEATURED}:type:all`)

  updates.forEach(({ type, action }) => {
    if (action === 'add') {
      keysToInvalidate.add(`${CACHE_PREFIXES.FEATURED}:type:new`)
    }
    
    if (action === 'update') {
      keysToInvalidate.add(`${CACHE_PREFIXES.FEATURED}:type:trending`)
      keysToInvalidate.add(`${CACHE_PREFIXES.FEATURED}:type:popular`)
    }

    // Add list caches
    if (type === 'extension') {
      keysToInvalidate.add(`${CACHE_PREFIXES.EXTENSIONS_LIST}:*`)
    } else {
      keysToInvalidate.add(`${CACHE_PREFIXES.MCP_LIST}:*`)
    }
  })

  await Promise.all([
    ...Array.from(keysToInvalidate).map(pattern => 
      pattern.includes('*') 
        ? invalidateCacheByPattern(pattern)
        : batchInvalidate([pattern])
    )
  ])
}

/**
 * Selective invalidation for curated content
 */
export async function invalidateCuratedContent(): Promise<void> {
  await batchInvalidate([
    `${CACHE_PREFIXES.FEATURED}:type:curated`,
    `${CACHE_PREFIXES.FEATURED}:type:all`
  ])
}

/**
 * Full featured content cache purge
 * Use sparingly, only when major updates occur
 */
export async function purgeFeaturedCache(): Promise<void> {
  await invalidateCacheByPattern(`${CACHE_PREFIXES.FEATURED}:*`)
}