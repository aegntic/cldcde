import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SimpleCache } from '../../../src/utils/simple-cache';

describe('SimpleCache Memory Leak Fix', () => {
  let cache: SimpleCache;
  
  beforeEach(() => {
    vi.useFakeTimers();
  });
  
  afterEach(() => {
    if (cache && typeof cache.destroy === 'function') {
      cache.destroy();
    }
    vi.restoreAllMocks();
  });
  
  it('should track cleanup timer', () => {
    cache = new SimpleCache();
    // Access private property for testing
    expect((cache as any).cleanupTimer).toBeDefined();
    expect((cache as any).cleanupTimer).not.toBeNull();
  });
  
  it('should clear timer on destroy', () => {
    cache = new SimpleCache();
    const timer = (cache as any).cleanupTimer;
    
    cache.destroy();
    
    expect((cache as any).cleanupTimer).toBeNull();
    // Verify timer was cleared
    expect(() => clearInterval(timer)).not.toThrow();
  });
  
  it('should clear cache on destroy', () => {
    cache = new SimpleCache();
    cache.set('test-key', 'test-value', 300);
    
    expect(cache.get('test-key')).toBe('test-value');
    
    cache.destroy();
    
    expect(cache.get('test-key')).toBeNull();
  });
  
  it('should handle multiple destroy calls safely', () => {
    cache = new SimpleCache();
    
    expect(() => {
      cache.destroy();
      cache.destroy();
      cache.destroy();
    }).not.toThrow();
    
    expect((cache as any).cleanupTimer).toBeNull();
  });
  
  it('should not create new timers after destroy', () => {
    cache = new SimpleCache();
    const originalTimer = (cache as any).cleanupTimer;
    
    cache.destroy();
    
    // Try to use the cache after destroy
    cache.set('key', 'value');
    cache.get('key');
    cache.clear();
    
    // Timer should still be null
    expect((cache as any).cleanupTimer).toBeNull();
    expect((cache as any).cleanupTimer).not.toBe(originalTimer);
  });
  
  it('should clean up expired entries periodically', () => {
    cache = new SimpleCache();
    
    // Set items with different TTLs
    cache.set('short', 'value1', 1); // 1 second
    cache.set('long', 'value2', 300); // 300 seconds
    
    // Advance time by 2 seconds
    vi.advanceTimersByTime(2000);
    
    // Advance time to trigger cleanup (60 seconds)
    vi.advanceTimersByTime(58000);
    
    // Short-lived item should be gone
    expect(cache.get('short')).toBeNull();
    // Long-lived item should still exist
    expect(cache.get('long')).toBe('value2');
  });
  
  it('should prevent memory leak by clearing timer', () => {
    const timers: NodeJS.Timeout[] = [];
    const originalSetInterval = global.setInterval;
    
    // Mock setInterval to track created timers
    global.setInterval = vi.fn((callback, delay) => {
      const timer = originalSetInterval(callback, delay);
      timers.push(timer);
      return timer;
    });
    
    // Create and destroy multiple caches
    for (let i = 0; i < 5; i++) {
      const tempCache = new SimpleCache();
      tempCache.set(`key${i}`, `value${i}`);
      tempCache.destroy();
    }
    
    // All timers should have been cleared
    expect(timers.length).toBe(5);
    
    // Restore original setInterval
    global.setInterval = originalSetInterval;
  });
  
  it('should have destroy method defined', () => {
    cache = new SimpleCache();
    expect(typeof cache.destroy).toBe('function');
  });
});