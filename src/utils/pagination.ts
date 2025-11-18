import { Context } from 'hono'

export interface PaginationParams {
  page: number
  limit: number
  offset: number
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

/**
 * Extract pagination parameters from request query
 * @param c - Hono context
 * @param defaultLimit - Default items per page (default: 20)
 * @param maxLimit - Maximum allowed items per page (default: 100)
 * @returns Pagination parameters
 */
export function getPaginationParams(
  c: Context,
  defaultLimit = 20,
  maxLimit = 100
): PaginationParams {
  const pageParam = c.req.query('page')
  const limitParam = c.req.query('limit')

  let page = pageParam ? parseInt(pageParam) : 1
  let limit = limitParam ? parseInt(limitParam) : defaultLimit

  // Validate page
  if (isNaN(page) || page < 1) {
    page = 1
  }

  // Validate limit
  if (isNaN(limit) || limit < 1) {
    limit = defaultLimit
  } else if (limit > maxLimit) {
    limit = maxLimit
  }

  const offset = (page - 1) * limit

  return { page, limit, offset }
}

/**
 * Create a paginated response object
 * @param data - Array of items for current page
 * @param page - Current page number
 * @param limit - Items per page
 * @param total - Total number of items
 * @returns Paginated response object
 */
export function createPaginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  total: number
): PaginatedResponse<T> {
  const totalPages = Math.ceil(total / limit)
  const hasNext = page < totalPages
  const hasPrev = page > 1

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext,
      hasPrev
    }
  }
}

/**
 * Generate pagination metadata for headers
 * @param page - Current page
 * @param limit - Items per page
 * @param total - Total items
 * @param baseUrl - Base URL for pagination links
 * @returns Headers object with pagination metadata
 */
export function generatePaginationHeaders(
  page: number,
  limit: number,
  total: number,
  baseUrl: string
): Record<string, string> {
  const totalPages = Math.ceil(total / limit)
  const headers: Record<string, string> = {
    'X-Page': page.toString(),
    'X-Limit': limit.toString(),
    'X-Total': total.toString(),
    'X-Total-Pages': totalPages.toString()
  }

  // Generate Link header for pagination navigation
  const links: string[] = []
  const url = new URL(baseUrl)

  // First page
  if (page > 1) {
    url.searchParams.set('page', '1')
    url.searchParams.set('limit', limit.toString())
    links.push(`<${url.toString()}>; rel="first"`)
  }

  // Previous page
  if (page > 1) {
    url.searchParams.set('page', (page - 1).toString())
    url.searchParams.set('limit', limit.toString())
    links.push(`<${url.toString()}>; rel="prev"`)
  }

  // Next page
  if (page < totalPages) {
    url.searchParams.set('page', (page + 1).toString())
    url.searchParams.set('limit', limit.toString())
    links.push(`<${url.toString()}>; rel="next"`)
  }

  // Last page
  if (page < totalPages) {
    url.searchParams.set('page', totalPages.toString())
    url.searchParams.set('limit', limit.toString())
    links.push(`<${url.toString()}>; rel="last"`)
  }

  if (links.length > 0) {
    headers['Link'] = links.join(', ')
  }

  return headers
}

/**
 * Calculate pagination offsets for database queries
 * @param page - Page number
 * @param limit - Items per page
 * @returns Object with skip and take values
 */
export function calculateOffsets(page: number, limit: number): { skip: number; take: number } {
  const skip = (page - 1) * limit
  return { skip, take: limit }
}

/**
 * Validate and sanitize cursor for cursor-based pagination
 * @param cursor - Cursor string
 * @returns Decoded cursor or null if invalid
 */
export function decodeCursor(cursor: string | null | undefined): any {
  if (!cursor) return null

  try {
    const decoded = atob(cursor)
    return JSON.parse(decoded)
  } catch {
    return null
  }
}

/**
 * Encode cursor for cursor-based pagination
 * @param data - Data to encode
 * @returns Base64 encoded cursor
 */
export function encodeCursor(data: any): string {
  return btoa(JSON.stringify(data))
}

/**
 * Create cursor-based pagination response
 * @param data - Array of items
 * @param hasMore - Whether there are more items
 * @param getCursor - Function to extract cursor from item
 * @returns Cursor-based pagination response
 */
export function createCursorPaginatedResponse<T>(
  data: T[],
  hasMore: boolean,
  getCursor: (item: T) => any
): {
  data: T[]
  pagination: {
    hasMore: boolean
    nextCursor: string | null
  }
} {
  const nextCursor = hasMore && data.length > 0 
    ? encodeCursor(getCursor(data[data.length - 1]))
    : null

  return {
    data,
    pagination: {
      hasMore,
      nextCursor
    }
  }
}

/**
 * Helper to apply pagination to SQL query
 * @param query - Base SQL query (without LIMIT/OFFSET)
 * @param params - Existing query parameters
 * @param pagination - Pagination parameters
 * @returns Object with paginated query and updated parameters
 */
export function applyPaginationToQuery(
  query: string,
  params: any[],
  pagination: PaginationParams
): { query: string; params: any[] } {
  const paginatedQuery = `${query} LIMIT ? OFFSET ?`
  const paginatedParams = [...params, pagination.limit, pagination.offset]
  
  return {
    query: paginatedQuery,
    params: paginatedParams
  }
}

/**
 * Generate page numbers for pagination UI
 * @param currentPage - Current page number
 * @param totalPages - Total number of pages
 * @param maxVisible - Maximum visible page numbers (default: 5)
 * @returns Array of page numbers to display
 */
export function generatePageNumbers(
  currentPage: number,
  totalPages: number,
  maxVisible = 5
): (number | '...')[] {
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  const pages: (number | '...')[] = []
  const halfVisible = Math.floor(maxVisible / 2)

  // Always show first page
  pages.push(1)

  let startPage = Math.max(2, currentPage - halfVisible)
  let endPage = Math.min(totalPages - 1, currentPage + halfVisible)

  // Adjust range if at the beginning or end
  if (currentPage <= halfVisible + 1) {
    endPage = maxVisible - 1
  } else if (currentPage >= totalPages - halfVisible) {
    startPage = totalPages - maxVisible + 2
  }

  // Add ellipsis if needed
  if (startPage > 2) {
    pages.push('...')
  }

  // Add page numbers
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i)
  }

  // Add ellipsis if needed
  if (endPage < totalPages - 1) {
    pages.push('...')
  }

  // Always show last page
  if (totalPages > 1) {
    pages.push(totalPages)
  }

  return pages
}