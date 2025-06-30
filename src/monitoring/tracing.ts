/**
 * Distributed Tracing Setup for cldcde.cc
 * OpenTelemetry-compatible tracing with Cloudflare Workers
 */

export interface TraceContext {
  traceId: string
  spanId: string
  parentSpanId?: string
  flags: number
  traceState?: string
}

export interface SpanContext {
  name: string
  kind: 'SERVER' | 'CLIENT' | 'PRODUCER' | 'CONSUMER' | 'INTERNAL'
  startTime: number
  endTime?: number
  attributes: Record<string, any>
  events: SpanEvent[]
  status: SpanStatus
  links: SpanLink[]
}

export interface SpanEvent {
  name: string
  timestamp: number
  attributes?: Record<string, any>
}

export interface SpanStatus {
  code: 'UNSET' | 'OK' | 'ERROR'
  message?: string
}

export interface SpanLink {
  context: TraceContext
  attributes?: Record<string, any>
}

export class Tracer {
  private readonly serviceName: string
  private readonly endpoint?: string
  private readonly spans: Map<string, Span> = new Map()
  private readonly exportInterval = 10000 // 10 seconds
  private exportTimer?: NodeJS.Timeout

  constructor(serviceName: string, endpoint?: string) {
    this.serviceName = serviceName
    this.endpoint = endpoint
    this.startExporter()
  }

  /**
   * Start a new trace
   */
  startTrace(name: string, parentContext?: TraceContext): Span {
    const traceContext: TraceContext = parentContext ? {
      traceId: parentContext.traceId,
      spanId: this.generateSpanId(),
      parentSpanId: parentContext.spanId,
      flags: parentContext.flags,
      traceState: parentContext.traceState
    } : {
      traceId: this.generateTraceId(),
      spanId: this.generateSpanId(),
      flags: 1 // Sampled
    }

    const span = new Span(name, traceContext, this)
    this.spans.set(span.context.spanId, span)
    
    return span
  }

  /**
   * Extract trace context from headers
   */
  extractContext(headers: Headers): TraceContext | undefined {
    const traceparent = headers.get('traceparent')
    if (!traceparent) return undefined

    // Parse W3C Trace Context format: version-trace-id-parent-id-flags
    const parts = traceparent.split('-')
    if (parts.length !== 4) return undefined

    return {
      traceId: parts[1],
      spanId: this.generateSpanId(),
      parentSpanId: parts[2],
      flags: parseInt(parts[3], 16),
      traceState: headers.get('tracestate') || undefined
    }
  }

  /**
   * Inject trace context into headers
   */
  injectContext(context: TraceContext, headers: Headers): void {
    const traceparent = `00-${context.traceId}-${context.spanId}-${context.flags.toString(16).padStart(2, '0')}`
    headers.set('traceparent', traceparent)
    
    if (context.traceState) {
      headers.set('tracestate', context.traceState)
    }
  }

  /**
   * Complete a span
   */
  completeSpan(spanId: string): void {
    const span = this.spans.get(spanId)
    if (span && !span.isEnded()) {
      span.end()
    }
  }

  /**
   * Export spans
   */
  private async exportSpans(): Promise<void> {
    const spansToExport = Array.from(this.spans.values())
      .filter(span => span.isEnded())
      .map(span => span.toJSON())

    if (spansToExport.length === 0) return

    // Clear exported spans
    spansToExport.forEach(span => {
      this.spans.delete(span.context.spanId)
    })

    if (!this.endpoint) {
      // Log to console in development
      console.log('Trace export:', JSON.stringify(spansToExport, null, 2))
      return
    }

    try {
      // Export to tracing backend (Jaeger, Zipkin, etc.)
      await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          serviceName: this.serviceName,
          spans: spansToExport
        })
      })
    } catch (error) {
      console.error('Failed to export traces:', error)
    }
  }

  /**
   * Start periodic exporter
   */
  private startExporter(): void {
    this.exportTimer = setInterval(() => {
      this.exportSpans()
    }, this.exportInterval) as any
  }

  /**
   * Stop the tracer
   */
  stop(): void {
    if (this.exportTimer) {
      clearInterval(this.exportTimer)
    }
    this.exportSpans()
  }

  /**
   * Generate trace ID (128-bit hex)
   */
  private generateTraceId(): string {
    return Array.from({ length: 32 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('')
  }

  /**
   * Generate span ID (64-bit hex)
   */
  private generateSpanId(): string {
    return Array.from({ length: 16 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('')
  }
}

export class Span {
  public readonly context: TraceContext
  private readonly spanContext: SpanContext
  private ended = false

  constructor(
    name: string,
    context: TraceContext,
    private readonly tracer: Tracer
  ) {
    this.context = context
    this.spanContext = {
      name,
      kind: 'INTERNAL',
      startTime: Date.now(),
      attributes: {},
      events: [],
      status: { code: 'UNSET' },
      links: []
    }
  }

  /**
   * Set span kind
   */
  setKind(kind: SpanContext['kind']): this {
    this.spanContext.kind = kind
    return this
  }

  /**
   * Set attributes
   */
  setAttributes(attributes: Record<string, any>): this {
    Object.assign(this.spanContext.attributes, attributes)
    return this
  }

  /**
   * Set single attribute
   */
  setAttribute(key: string, value: any): this {
    this.spanContext.attributes[key] = value
    return this
  }

  /**
   * Add event
   */
  addEvent(name: string, attributes?: Record<string, any>): this {
    this.spanContext.events.push({
      name,
      timestamp: Date.now(),
      attributes
    })
    return this
  }

  /**
   * Set status
   */
  setStatus(code: SpanStatus['code'], message?: string): this {
    this.spanContext.status = { code, message }
    return this
  }

  /**
   * Record exception
   */
  recordException(error: Error): this {
    this.addEvent('exception', {
      'exception.type': error.name,
      'exception.message': error.message,
      'exception.stacktrace': error.stack
    })
    this.setStatus('ERROR', error.message)
    return this
  }

  /**
   * Add link to another span
   */
  addLink(context: TraceContext, attributes?: Record<string, any>): this {
    this.spanContext.links.push({ context, attributes })
    return this
  }

  /**
   * End the span
   */
  end(): void {
    if (this.ended) return
    
    this.spanContext.endTime = Date.now()
    this.ended = true
    
    // Auto-set OK status if not set
    if (this.spanContext.status.code === 'UNSET') {
      this.spanContext.status.code = 'OK'
    }
  }

  /**
   * Check if span has ended
   */
  isEnded(): boolean {
    return this.ended
  }

  /**
   * Convert to JSON for export
   */
  toJSON(): any {
    return {
      context: this.context,
      name: this.spanContext.name,
      kind: this.spanContext.kind,
      startTime: this.spanContext.startTime,
      endTime: this.spanContext.endTime,
      duration: this.spanContext.endTime ? 
        this.spanContext.endTime - this.spanContext.startTime : undefined,
      attributes: this.spanContext.attributes,
      events: this.spanContext.events,
      status: this.spanContext.status,
      links: this.spanContext.links
    }
  }
}

/**
 * Tracing middleware for Hono
 */
export function tracingMiddleware(tracer: Tracer) {
  return async (c: any, next: any) => {
    // Extract parent context from headers
    const parentContext = tracer.extractContext(c.req.headers)
    
    // Start server span
    const span = tracer.startTrace(`${c.req.method} ${c.req.path}`, parentContext)
      .setKind('SERVER')
      .setAttributes({
        'http.method': c.req.method,
        'http.url': c.req.url,
        'http.target': c.req.path,
        'http.host': c.req.headers.get('host'),
        'http.scheme': new URL(c.req.url).protocol.slice(0, -1),
        'http.user_agent': c.req.headers.get('user-agent'),
        'net.host.name': c.req.headers.get('host'),
        'cloudflare.ray': c.req.headers.get('cf-ray'),
        'cloudflare.country': c.req.headers.get('cf-ipcountry')
      })

    // Inject context for downstream services
    const headers = new Headers()
    tracer.injectContext(span.context, headers)
    c.set('traceHeaders', headers)
    c.set('span', span)

    try {
      await next()
      
      // Set response attributes
      span.setAttributes({
        'http.status_code': c.res.status,
        'http.response_content_length': c.res.headers.get('content-length')
      })

      // Set status based on HTTP status code
      if (c.res.status >= 400) {
        span.setStatus('ERROR', `HTTP ${c.res.status}`)
      }
    } catch (error) {
      // Record exception
      if (error instanceof Error) {
        span.recordException(error)
      }
      throw error
    } finally {
      span.end()
    }
  }
}

/**
 * Create child span helper
 */
export async function withSpan<T>(
  tracer: Tracer,
  name: string,
  parentContext: TraceContext,
  fn: (span: Span) => Promise<T>
): Promise<T> {
  const span = tracer.startTrace(name, parentContext)
  
  try {
    const result = await fn(span)
    span.setStatus('OK')
    return result
  } catch (error) {
    if (error instanceof Error) {
      span.recordException(error)
    }
    throw error
  } finally {
    span.end()
  }
}

/**
 * Initialize global tracer
 */
let globalTracer: Tracer | undefined

export function initTracing(serviceName: string, endpoint?: string): Tracer {
  globalTracer = new Tracer(serviceName, endpoint)
  return globalTracer
}

export function getTracer(): Tracer {
  if (!globalTracer) {
    throw new Error('Tracer not initialized. Call initTracing first.')
  }
  return globalTracer
}