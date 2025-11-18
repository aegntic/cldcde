/**
 * Web Vitals Performance Monitoring
 * Client-side performance metrics collection
 */

export interface WebVitalsMetric {
  name: 'FCP' | 'LCP' | 'CLS' | 'FID' | 'TTFB' | 'INP'
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  delta: number
  id: string
  navigationType: 'navigate' | 'reload' | 'back-forward' | 'prerender'
  entries: PerformanceEntry[]
}

export interface PerformanceData {
  url: string
  userAgent: string
  effectiveType?: string
  deviceMemory?: number
  hardwareConcurrency?: number
  timestamp: number
}

export class WebVitalsCollector {
  private readonly endpoint: string
  private readonly buffer: WebVitalsMetric[] = []
  private readonly maxBufferSize = 10
  private readonly flushDelay = 5000

  constructor(endpoint: string = '/api/metrics/vitals') {
    this.endpoint = endpoint
    this.initializeObservers()
  }

  /**
   * Initialize performance observers
   */
  private initializeObservers(): void {
    if (typeof window === 'undefined') return

    // Largest Contentful Paint
    this.observeLCP()
    
    // First Input Delay / Interaction to Next Paint
    this.observeINP()
    
    // Cumulative Layout Shift
    this.observeCLS()
    
    // First Contentful Paint
    this.observeFCP()
    
    // Time to First Byte
    this.observeTTFB()

    // Send metrics on page visibility change
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.flush()
      }
    })

    // Send metrics before unload
    window.addEventListener('beforeunload', () => {
      this.flush()
    })
  }

  /**
   * Observe Largest Contentful Paint
   */
  private observeLCP(): void {
    if (!('PerformanceObserver' in window)) return

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const lastEntry = entries[entries.length - 1] as any

      const metric: WebVitalsMetric = {
        name: 'LCP',
        value: lastEntry.startTime,
        rating: this.getRating('LCP', lastEntry.startTime),
        delta: lastEntry.startTime,
        id: this.generateId(),
        navigationType: this.getNavigationType(),
        entries: entries as PerformanceEntry[]
      }

      this.record(metric)
    })

    observer.observe({ type: 'largest-contentful-paint', buffered: true })
  }

  /**
   * Observe Interaction to Next Paint
   */
  private observeINP(): void {
    if (!('PerformanceObserver' in window)) return

    let maxDuration = 0

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as any[]) {
        if (!entry.interactionId) continue

        const duration = entry.duration
        if (duration > maxDuration) {
          maxDuration = duration

          const metric: WebVitalsMetric = {
            name: 'INP',
            value: duration,
            rating: this.getRating('INP', duration),
            delta: duration,
            id: this.generateId(),
            navigationType: this.getNavigationType(),
            entries: [entry]
          }

          this.record(metric)
        }
      }
    })

    observer.observe({ type: 'event', buffered: true, durationThreshold: 40 })
  }

  /**
   * Observe Cumulative Layout Shift
   */
  private observeCLS(): void {
    if (!('PerformanceObserver' in window)) return

    let clsValue = 0
    let clsEntries: PerformanceEntry[] = []
    let sessionValue = 0
    let sessionEntries: PerformanceEntry[] = []

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as any[]) {
        // Only count layout shifts without recent input
        if (!entry.hadRecentInput) {
          const firstSessionEntry = sessionEntries[0]
          const lastSessionEntry = sessionEntries[sessionEntries.length - 1]

          // If the entry occurred less than 1 second after the previous entry
          // and less than 5 seconds after the first entry in the session,
          // include the entry in the current session. Otherwise, start a new session.
          if (sessionValue &&
              entry.startTime - lastSessionEntry.startTime < 1000 &&
              entry.startTime - firstSessionEntry.startTime < 5000) {
            sessionValue += entry.value
            sessionEntries.push(entry)
          } else {
            sessionValue = entry.value
            sessionEntries = [entry]
          }

          // If the current session value is larger than the current CLS value,
          // update CLS and the entries contributing to it.
          if (sessionValue > clsValue) {
            clsValue = sessionValue
            clsEntries = sessionEntries

            const metric: WebVitalsMetric = {
              name: 'CLS',
              value: clsValue,
              rating: this.getRating('CLS', clsValue),
              delta: clsValue,
              id: this.generateId(),
              navigationType: this.getNavigationType(),
              entries: clsEntries
            }

            this.record(metric)
          }
        }
      }
    })

    observer.observe({ type: 'layout-shift', buffered: true })
  }

  /**
   * Observe First Contentful Paint
   */
  private observeFCP(): void {
    if (!('PerformanceObserver' in window)) return

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          const metric: WebVitalsMetric = {
            name: 'FCP',
            value: entry.startTime,
            rating: this.getRating('FCP', entry.startTime),
            delta: entry.startTime,
            id: this.generateId(),
            navigationType: this.getNavigationType(),
            entries: [entry]
          }

          this.record(metric)
          observer.disconnect()
        }
      }
    })

    observer.observe({ type: 'paint', buffered: true })
  }

  /**
   * Observe Time to First Byte
   */
  private observeTTFB(): void {
    const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    
    if (navigationEntry) {
      const ttfb = navigationEntry.responseStart - navigationEntry.requestStart

      const metric: WebVitalsMetric = {
        name: 'TTFB',
        value: ttfb,
        rating: this.getRating('TTFB', ttfb),
        delta: ttfb,
        id: this.generateId(),
        navigationType: this.getNavigationType(),
        entries: [navigationEntry]
      }

      this.record(metric)
    }
  }

  /**
   * Record a metric
   */
  private record(metric: WebVitalsMetric): void {
    this.buffer.push(metric)

    if (this.buffer.length >= this.maxBufferSize) {
      this.flush()
    } else {
      this.scheduleFlush()
    }
  }

  /**
   * Schedule flush
   */
  private flushTimer?: NodeJS.Timeout
  private scheduleFlush(): void {
    if (this.flushTimer) return

    this.flushTimer = setTimeout(() => {
      this.flush()
      this.flushTimer = undefined
    }, this.flushDelay)
  }

  /**
   * Flush metrics to server
   */
  private async flush(): Promise<void> {
    if (this.buffer.length === 0) return

    const metrics = [...this.buffer]
    this.buffer.length = 0

    const performanceData = this.getPerformanceData()

    try {
      // Use sendBeacon for reliability
      if ('sendBeacon' in navigator) {
        navigator.sendBeacon(this.endpoint, JSON.stringify({
          metrics,
          performance: performanceData
        }))
      } else {
        // Fallback to fetch
        fetch(this.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            metrics,
            performance: performanceData
          }),
          keepalive: true
        }).catch(() => {
          // Silently ignore metrics endpoint failures
        })
      }
    } catch (error) {
      console.error('Failed to send web vitals:', error)
    }
  }

  /**
   * Get performance context data
   */
  private getPerformanceData(): PerformanceData {
    const data: PerformanceData = {
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: Date.now()
    }

    // Network information
    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      data.effectiveType = connection.effectiveType
    }

    // Device capabilities
    if ('deviceMemory' in navigator) {
      data.deviceMemory = (navigator as any).deviceMemory
    }

    if ('hardwareConcurrency' in navigator) {
      data.hardwareConcurrency = navigator.hardwareConcurrency
    }

    return data
  }

  /**
   * Get rating for metric value
   */
  private getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
    const thresholds: Record<string, [number, number]> = {
      'LCP': [2500, 4000],
      'FID': [100, 300],
      'INP': [200, 500],
      'CLS': [0.1, 0.25],
      'FCP': [1800, 3000],
      'TTFB': [800, 1800]
    }

    const [good, poor] = thresholds[name] || [0, 0]
    
    if (value <= good) return 'good'
    if (value <= poor) return 'needs-improvement'
    return 'poor'
  }

  /**
   * Get navigation type
   */
  private getNavigationType(): WebVitalsMetric['navigationType'] {
    if (performance.getEntriesByType) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      if (navigation) {
        switch (navigation.type) {
          case 'reload': return 'reload'
          case 'back_forward': return 'back-forward'
          case 'prerender': return 'prerender'
          default: return 'navigate'
        }
      }
    }
    return 'navigate'
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `v3-${Date.now()}-${Math.floor(Math.random() * (9e12 - 1)) + 1e12}`
  }
}

/**
 * Initialize Web Vitals collection
 */
export function initWebVitals(endpoint?: string): WebVitalsCollector {
  return new WebVitalsCollector(endpoint)
}

/**
 * Report custom performance mark
 */
export function reportTiming(name: string, startTime: number, endTime: number = performance.now()): void {
  if ('performance' in window && 'measure' in performance) {
    try {
      performance.measure(name, {
        start: startTime,
        end: endTime
      })
    } catch (error) {
      // Fallback for older browsers
      console.debug(`Performance timing: ${name} = ${endTime - startTime}ms`)
    }
  }
}