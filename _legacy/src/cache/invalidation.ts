import { 
  invalidateCacheByPattern, 
  batchInvalidate,
  CACHE_PREFIXES 
} from './upstash'
import { invalidateByTags } from './strategies'

/**
 * Cache invalidation logic for user actions
 */

/**
 * Invalidate caches after user login
 * @param userId - User ID
 * @param username - Username
 */
export async function invalidateOnLogin(userId: string, username: string): Promise<void> {
  try {
    // Invalidate user-specific caches
    const keysToInvalidate = [
      `${CACHE_PREFIXES.USER_PROFILE}:username:${username}`,
      `${CACHE_PREFIXES.USER_STATS}:username:${username}`
    ]
    
    await batchInvalidate(keysToInvalidate)
  } catch (error) {
    console.error('Login cache invalidation error:', error)
  }
}

/**
 * Invalidate caches after creating an extension
 * @param authorUsername - Extension author's username
 * @param category - Extension category
 * @param extensionId - New extension ID
 */
export async function invalidateOnExtensionCreate(
  authorUsername: string, 
  category: string,
  extensionId: string
): Promise<void> {
  try {
    // Invalidate extension lists
    await invalidateCacheByPattern(`${CACHE_PREFIXES.EXTENSIONS_LIST}:*`)
    
    // Invalidate category-specific caches
    await invalidateCacheByPattern(`${CACHE_PREFIXES.EXTENSIONS_LIST}:*category:${category}*`)
    
    // Invalidate user's extension list
    await invalidateCacheByPattern(`${CACHE_PREFIXES.USER_EXTENSIONS}:username:${authorUsername}*`)
    
    // Invalidate user stats
    await batchInvalidate([
      `${CACHE_PREFIXES.USER_STATS}:username:${authorUsername}`
    ])
    
    // Invalidate by tags
    await invalidateByTags(['extensions', 'categories'])
  } catch (error) {
    console.error('Extension create cache invalidation error:', error)
  }
}

/**
 * Invalidate caches after creating an MCP server
 * @param authorUsername - MCP server author's username
 * @param category - MCP server category
 * @param mcpId - New MCP server ID
 */
export async function invalidateOnMcpCreate(
  authorUsername: string,
  category: string,
  mcpId: string
): Promise<void> {
  try {
    // Invalidate MCP lists
    await invalidateCacheByPattern(`${CACHE_PREFIXES.MCP_LIST}:*`)
    
    // Invalidate category-specific caches
    await invalidateCacheByPattern(`${CACHE_PREFIXES.MCP_LIST}:*category:${category}*`)
    
    // Invalidate user's MCP list
    await invalidateCacheByPattern(`${CACHE_PREFIXES.USER_MCP}:username:${authorUsername}*`)
    
    // Invalidate user stats
    await batchInvalidate([
      `${CACHE_PREFIXES.USER_STATS}:username:${authorUsername}`
    ])
    
    // Invalidate by tags
    await invalidateByTags(['mcp', 'categories'])
  } catch (error) {
    console.error('MCP create cache invalidation error:', error)
  }
}

/**
 * Invalidate caches after rating an extension or MCP server
 * @param itemType - Type of item (extension or mcp)
 * @param itemId - Item ID
 * @param authorUsername - Item author's username
 */
export async function invalidateOnRating(
  itemType: 'extension' | 'mcp',
  itemId: string,
  authorUsername: string
): Promise<void> {
  try {
    const prefix = itemType === 'extension' 
      ? CACHE_PREFIXES.EXTENSIONS_DETAIL 
      : CACHE_PREFIXES.MCP_DETAIL
    
    const listPrefix = itemType === 'extension'
      ? CACHE_PREFIXES.EXTENSIONS_LIST
      : CACHE_PREFIXES.MCP_LIST
    
    // Invalidate item detail
    await batchInvalidate([
      `${prefix}:id:${itemId}`
    ])
    
    // Invalidate sorted lists (rating affects sort order)
    await invalidateCacheByPattern(`${listPrefix}:*sort:rating*`)
    
    // Invalidate author's stats
    await batchInvalidate([
      `${CACHE_PREFIXES.USER_STATS}:username:${authorUsername}`
    ])
  } catch (error) {
    console.error('Rating cache invalidation error:', error)
  }
}

/**
 * Invalidate caches after updating an extension
 * @param extensionId - Extension ID
 * @param authorUsername - Extension author's username
 * @param oldCategory - Previous category (if changed)
 * @param newCategory - New category (if changed)
 */
export async function invalidateOnExtensionUpdate(
  extensionId: string,
  authorUsername: string,
  oldCategory?: string,
  newCategory?: string
): Promise<void> {
  try {
    // Invalidate extension detail
    await batchInvalidate([
      `${CACHE_PREFIXES.EXTENSIONS_DETAIL}:id:${extensionId}`
    ])
    
    // Invalidate lists
    await invalidateCacheByPattern(`${CACHE_PREFIXES.EXTENSIONS_LIST}:*`)
    
    // If category changed, invalidate both old and new category caches
    if (oldCategory && newCategory && oldCategory !== newCategory) {
      await invalidateCacheByPattern(`${CACHE_PREFIXES.EXTENSIONS_LIST}:*category:${oldCategory}*`)
      await invalidateCacheByPattern(`${CACHE_PREFIXES.EXTENSIONS_LIST}:*category:${newCategory}*`)
    }
    
    // Invalidate user's extension list
    await invalidateCacheByPattern(`${CACHE_PREFIXES.USER_EXTENSIONS}:username:${authorUsername}*`)
  } catch (error) {
    console.error('Extension update cache invalidation error:', error)
  }
}

/**
 * Invalidate caches after updating an MCP server
 * @param mcpId - MCP server ID
 * @param authorUsername - MCP server author's username
 * @param oldCategory - Previous category (if changed)
 * @param newCategory - New category (if changed)
 */
export async function invalidateOnMcpUpdate(
  mcpId: string,
  authorUsername: string,
  oldCategory?: string,
  newCategory?: string
): Promise<void> {
  try {
    // Invalidate MCP detail
    await batchInvalidate([
      `${CACHE_PREFIXES.MCP_DETAIL}:id:${mcpId}`
    ])
    
    // Invalidate lists
    await invalidateCacheByPattern(`${CACHE_PREFIXES.MCP_LIST}:*`)
    
    // If category changed, invalidate both old and new category caches
    if (oldCategory && newCategory && oldCategory !== newCategory) {
      await invalidateCacheByPattern(`${CACHE_PREFIXES.MCP_LIST}:*category:${oldCategory}*`)
      await invalidateCacheByPattern(`${CACHE_PREFIXES.MCP_LIST}:*category:${newCategory}*`)
    }
    
    // Invalidate user's MCP list
    await invalidateCacheByPattern(`${CACHE_PREFIXES.USER_MCP}:username:${authorUsername}*`)
  } catch (error) {
    console.error('MCP update cache invalidation error:', error)
  }
}

/**
 * Invalidate caches after user profile update
 * @param username - Username
 */
export async function invalidateOnProfileUpdate(username: string): Promise<void> {
  try {
    await batchInvalidate([
      `${CACHE_PREFIXES.USER_PROFILE}:username:${username}`
    ])
  } catch (error) {
    console.error('Profile update cache invalidation error:', error)
  }
}

/**
 * Invalidate caches after extension download
 * @param extensionId - Extension ID
 */
export async function invalidateOnExtensionDownload(extensionId: string): Promise<void> {
  try {
    // Only invalidate detail page (stats endpoint)
    await batchInvalidate([
      `${CACHE_PREFIXES.EXTENSIONS_DETAIL}:id:${extensionId}`
    ])
    
    // Invalidate sorted lists by downloads
    await invalidateCacheByPattern(`${CACHE_PREFIXES.EXTENSIONS_LIST}:*sort:downloads*`)
  } catch (error) {
    console.error('Extension download cache invalidation error:', error)
  }
}

/**
 * Invalidate caches after MCP server download
 * @param mcpId - MCP server ID
 */
export async function invalidateOnMcpDownload(mcpId: string): Promise<void> {
  try {
    // Only invalidate detail page (stats endpoint)
    await batchInvalidate([
      `${CACHE_PREFIXES.MCP_DETAIL}:id:${mcpId}`
    ])
    
    // Invalidate sorted lists by downloads
    await invalidateCacheByPattern(`${CACHE_PREFIXES.MCP_LIST}:*sort:downloads*`)
  } catch (error) {
    console.error('MCP download cache invalidation error:', error)
  }
}

/**
 * Invalidate all caches (nuclear option)
 * Use sparingly, only for major updates or emergencies
 */
export async function invalidateAllCaches(): Promise<void> {
  try {
    const patterns = [
      `${CACHE_PREFIXES.EXTENSIONS_LIST}:*`,
      `${CACHE_PREFIXES.EXTENSIONS_DETAIL}:*`,
      `${CACHE_PREFIXES.MCP_LIST}:*`,
      `${CACHE_PREFIXES.MCP_DETAIL}:*`,
      `${CACHE_PREFIXES.USER_PROFILE}:*`,
      `${CACHE_PREFIXES.USER_EXTENSIONS}:*`,
      `${CACHE_PREFIXES.USER_MCP}:*`,
      `${CACHE_PREFIXES.USER_STATS}:*`,
      `${CACHE_PREFIXES.CATEGORIES}:*`,
      `${CACHE_PREFIXES.STATS}:*`
    ]
    
    for (const pattern of patterns) {
      await invalidateCacheByPattern(pattern)
    }
    
    console.log('All caches invalidated')
  } catch (error) {
    console.error('Full cache invalidation error:', error)
  }
}