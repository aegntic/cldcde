/**
 * Sentry Integration for Error Tracking
 * Cloudflare Workers compatible implementation
 */

export interface SentryConfig {
  dsn: string
  environment: string
  release?: string
  sampleRate?: number
  tracesSampleRate?: number
}

export interface SentryContext {
  user?: {
    id?: string
    email?: string
    username?: string
  }
  tags?: Record<string, string>
  extra?: Record<string, any>
  fingerprint?: string[]
}

export class SentryClient {
  private readonly dsn: URL
  private readonly projectId: string
  private readonly publicKey: string
  private readonly environment: string
  private readonly release?: string
  private readonly sampleRate: number
  private readonly tracesSampleRate: number

  constructor(config: SentryConfig) {
    this.dsn = new URL(config.dsn)
    const match = this.dsn.hostname.match(/^([a-f0-9]+)\.ingest\.sentry\.io$/)
    if (!match) {
      throw new Error('Invalid Sentry DSN')
    }
    
    this.publicKey = this.dsn.username
    this.projectId = this.dsn.pathname.substring(1)
    this.environment = config.environment
    this.release = config.release
    this.sampleRate = config.sampleRate || 1.0
    this.tracesSampleRate = config.tracesSampleRate || 0.1
  }

  /**
   * Capture an exception
   */
  async captureException(error: Error | unknown, context?: SentryContext): Promise<void> {
    if (!this.shouldSample(this.sampleRate)) return

    const event = this.createEvent('error', error, context)
    await this.sendEvent(event)
  }

  /**
   * Capture a message
   */
  async captureMessage(message: string, level: 'debug' | 'info' | 'warning' | 'error' = 'info', context?: SentryContext): Promise<void> {
    if (!this.shouldSample(this.sampleRate)) return

    const event = this.createEvent('message', message, context, level)
    await this.sendEvent(event)
  }

  /**
   * Create a transaction for performance monitoring
   */
  startTransaction(name: string, op: string): Transaction {
    if (!this.shouldSample(this.tracesSampleRate)) {
      return new NoOpTransaction()
    }

    return new SentryTransaction(this, name, op)
  }

  /**
   * Create Sentry event
   */
  private createEvent(
    type: 'error' | 'message',
    data: Error | unknown | string,
    context?: SentryContext,
    level: string = 'error'
  ): any {
    const timestamp = new Date().toISOString()
    const eventId = this.generateEventId()

    const event: any = {
      event_id: eventId,
      timestamp,
      platform: 'javascript',
      environment: this.environment,
      release: this.release,
      level,
      contexts: {
        runtime: {
          name: 'Cloudflare Workers',
          version: 'unknown'
        }
      },
      tags: {
        ...context?.tags
      },
      extra: {
        ...context?.extra
      },
      user: context?.user,
      fingerprint: context?.fingerprint
    }

    if (type === 'error') {
      const error = data as Error
      event.exception = {
        values: [{
          type: error.name || 'Error',
          value: error.message || String(error),
          stacktrace: this.parseStackTrace(error.stack)
        }]
      }
    } else {
      event.message = {
        formatted: data as string
      }
    }

    return event
  }

  /**
   * Send event to Sentry
   */
  private async sendEvent(event: any): Promise<void> {
    const envelope = this.createEnvelope(event)
    const url = `https://${this.dsn.hostname}/api/${this.projectId}/envelope/`

    try {
      await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-sentry-envelope',
          'X-Sentry-Auth': this.getAuthHeader()
        },
        body: envelope
      })
    } catch (error) {
      console.error('Failed to send event to Sentry:', error)
    }
  }

  /**
   * Create Sentry envelope
   */
  private createEnvelope(event: any): string {
    const header = {
      event_id: event.event_id,
      dsn: this.dsn.toString()
    }

    const item = {
      type: 'event',
      content_type: 'application/json'
    }

    return JSON.stringify(header) + '\n' +
           JSON.stringify(item) + '\n' +
           JSON.stringify(event)
  }

  /**
   * Get auth header
   */
  private getAuthHeader(): string {
    const parts = [
      `sentry_version=7`,
      `sentry_timestamp=${Math.floor(Date.now() / 1000)}`,
      `sentry_client=cldcde-sentry/1.0`,
      `sentry_key=${this.publicKey}`
    ]
    
    return `Sentry ${parts.join(', ')}`
  }

  /**
   * Parse stack trace
   */
  private parseStackTrace(stack?: string): any {
    if (!stack) return { frames: [] }

    const frames = stack
      .split('\n')
      .slice(1)
      .map(line => {
        const match = line.match(/at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)/)
        if (!match) return null

        return {
          function: match[1],
          filename: match[2],
          lineno: parseInt(match[3]),
          colno: parseInt(match[4])
        }
      })
      .filter(Boolean)
      .reverse()

    return { frames }
  }

  /**
   * Generate event ID
   */
  private generateEventId(): string {
    return Array.from({ length: 32 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('')
  }

  /**
   * Should sample based on rate
   */
  private shouldSample(rate: number): boolean {
    return Math.random() < rate
  }
}

/**
 * Sentry Transaction for performance monitoring
 */
export class SentryTransaction {
  private readonly startTime: number
  private readonly spans: Span[] = []
  private finished = false

  constructor(
    private readonly client: SentryClient,
    private readonly name: string,
    private readonly op: string
  ) {
    this.startTime = Date.now()
  }

  /**
   * Start a child span
   */
  startSpan(description: string, op: string): Span {
    const span = new Span(description, op)
    this.spans.push(span)
    return span
  }

  /**
   * Finish transaction
   */
  async finish(): Promise<void> {
    if (this.finished) return
    this.finished = true

    const duration = Date.now() - this.startTime
    
    // Send transaction data to Sentry
    const transactionEvent = {
      type: 'transaction',
      transaction: this.name,
      start_timestamp: this.startTime / 1000,
      timestamp: Date.now() / 1000,
      contexts: {
        trace: {
          op: this.op,
          status: 'ok'
        }
      },
      spans: this.spans.map(span => span.toJSON())
    }

    // This would be sent similar to regular events
    // Implementation details omitted for brevity
  }
}

/**
 * Span for tracing
 */
export class Span {
  private readonly startTime: number
  private endTime?: number
  private readonly spanId: string

  constructor(
    private readonly description: string,
    private readonly op: string
  ) {
    this.startTime = Date.now()
    this.spanId = this.generateSpanId()
  }

  finish(): void {
    this.endTime = Date.now()
  }

  toJSON(): any {
    return {
      span_id: this.spanId,
      description: this.description,
      op: this.op,
      start_timestamp: this.startTime / 1000,
      timestamp: (this.endTime || Date.now()) / 1000
    }
  }

  private generateSpanId(): string {
    return Array.from({ length: 16 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('')
  }
}

/**
 * No-op implementations for when sampling is disabled
 */
class NoOpTransaction {
  startSpan(): Span {
    return new NoOpSpan()
  }
  
  async finish(): Promise<void> {}
}

class NoOpSpan extends Span {
  constructor() {
    super('', '')
  }
  
  finish(): void {}
}

/**
 * Transaction interface
 */
export interface Transaction {
  startSpan(description: string, op: string): Span
  finish(): Promise<void>
}

/**
 * Sentry middleware for Hono
 */
export function sentryMiddleware(sentry: SentryClient) {
  return async (c: any, next: any) => {
    const transaction = sentry.startTransaction(c.req.path, 'http.server')
    
    try {
      await next()
    } catch (error) {
      await sentry.captureException(error, {
        tags: {
          path: c.req.path,
          method: c.req.method,
          status: '500'
        },
        extra: {
          headers: Object.fromEntries(c.req.headers.entries()),
          query: Object.fromEntries(new URL(c.req.url).searchParams.entries())
        },
        user: c.get('user')
      })
      throw error
    } finally {
      await transaction.finish()
    }
  }
}

/**
 * Initialize Sentry for Cloudflare Workers
 */
export function initSentry(config: SentryConfig): SentryClient {
  return new SentryClient(config)
}