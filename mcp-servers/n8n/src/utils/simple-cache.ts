/**
 * Simple in-memory cache with TTL support
 * No external dependencies needed
 */
export class SimpleCache {
  private cache = new Map<string, { data: any; expires: number }>();
  private cleanupTimer: NodeJS.Timeout | null = null;
  
  constructor() {
    // Clean up expired entries every minute
    this.cleanupTimer = setInterval(() => {
      const now = Date.now();
      for (const [key, item] of this.cache.entries()) {
        if (item.expires < now) this.cache.delete(key);
      }
    }, 60000);
  }
  
  get(key: string): any {
    const item = this.cache.get(key);
    if (!item || item.expires < Date.now()) {
      this.cache.delete(key);
      return null;
    }
    return item.data;
  }
  
  set(key: string, data: any, ttlSeconds: number = 300): void {
    this.cache.set(key, {
      data,
      expires: Date.now() + (ttlSeconds * 1000)
    });
  }
  
  clear(): void {
    this.cache.clear();
  }
  
  /**
   * Clean up the cache and stop the cleanup timer
   * Essential for preventing memory leaks in long-running servers
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.cache.clear();
  }
}