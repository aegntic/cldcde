/**
 * Structured Logging System for cldcde.cc
 * JSON-formatted logs with correlation IDs and context
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal'

export interface LogContext {
  correlationId?: string
  userId?: string
  sessionId?: string
  requestId?: string
  traceId?: string
  spanId?: string
  [key: string]: any
}

export interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context: LogContext
  error?: {
    name: string
    message: string
    stack?: string
  }
  metadata?: Record<string, any>
}

export class Logger {
  private static instance: Logger
  private context: LogContext = {}
  private readonly serviceName: string
  private readonly environment: string

  constructor(serviceName: string = 'cldcde-api', environment: string = 'production') {
    this.serviceName = serviceName
    this.environment = environment
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger()
    }
    return Logger.instance
  }

  /**
   * Set global context that will be included in all logs
   */
  setContext(context: LogContext): void {
    this.context = { ...this.context, ...context }
  }

  /**
   * Create a child logger with additional context
   */
  child(context: LogContext): Logger {
    const child = new Logger(this.serviceName, this.environment)
    child.context = { ...this.context, ...context }
    return child
  }

  /**
   * Log at debug level
   */
  debug(message: string, metadata?: Record<string, any>): void {
    this.log('debug', message, metadata)
  }

  /**
   * Log at info level
   */
  info(message: string, metadata?: Record<string, any>): void {
    this.log('info', message, metadata)
  }

  /**
   * Log at warn level
   */
  warn(message: string, metadata?: Record<string, any>): void {
    this.log('warn', message, metadata)
  }

  /**
   * Log at error level
   */
  error(message: string, error?: Error | unknown, metadata?: Record<string, any>): void {
    const logEntry = this.createLogEntry('error', message, metadata)
    
    if (error instanceof Error) {
      logEntry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack
      }
    } else if (error) {
      logEntry.error = {
        name: 'UnknownError',
        message: String(error)
      }
    }

    this.output(logEntry)
  }

  /**
   * Log at fatal level
   */
  fatal(message: string, error?: Error | unknown, metadata?: Record<string, any>): void {
    const logEntry = this.createLogEntry('fatal', message, metadata)
    
    if (error instanceof Error) {
      logEntry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack
      }
    }

    this.output(logEntry)
  }

  /**
   * Create a timer for measuring operations
   */
  time(label: string): () => void {
    const start = Date.now()
    return () => {
      const duration = Date.now() - start
      this.info(`${label} completed`, { duration_ms: duration })
    }
  }

  /**
   * Log HTTP request details
   */
  logRequest(request: Request, response?: Response, duration?: number): void {
    const url = new URL(request.url)
    
    const metadata = {
      method: request.method,
      path: url.pathname,
      query: Object.fromEntries(url.searchParams.entries()),
      status: response?.status,
      duration_ms: duration,
      user_agent: request.headers.get('user-agent'),
      content_type: request.headers.get('content-type'),
      referer: request.headers.get('referer'),
      cf_ray: request.headers.get('cf-ray'),
      cf_connecting_ip: request.headers.get('cf-connecting-ip'),
      cf_country: request.headers.get('cf-ipcountry')
    }

    const level = response && response.status >= 400 ? 'error' : 'info'
    this.log(level, `${request.method} ${url.pathname}`, metadata)
  }

  /**
   * Log database query
   */
  logQuery(operation: string, table: string, duration: number, success: boolean, error?: Error): void {
    const metadata = {
      db_operation: operation,
      db_table: table,
      duration_ms: duration,
      success
    }

    if (success) {
      this.debug(`Database query: ${operation} ${table}`, metadata)
    } else {
      this.error(`Database query failed: ${operation} ${table}`, error, metadata)
    }
  }

  /**
   * Log cache operation
   */
  logCache(operation: 'get' | 'set' | 'delete', key: string, hit?: boolean, ttl?: number): void {
    const metadata = {
      cache_operation: operation,
      cache_key: this.sanitizeKey(key),
      cache_hit: hit,
      cache_ttl: ttl
    }

    this.debug(`Cache ${operation}: ${key}`, metadata)
  }

  /**
   * Internal: Create log entry
   */
  private createLogEntry(level: LogLevel, message: string, metadata?: Record<string, any>): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: {
        ...this.context,
        service: this.serviceName,
        environment: this.environment
      },
      metadata: metadata || {}
    }
  }

  /**
   * Internal: Log at specified level
   */
  private log(level: LogLevel, message: string, metadata?: Record<string, any>): void {
    const entry = this.createLogEntry(level, message, metadata)
    this.output(entry)
  }

  /**
   * Internal: Output log entry
   */
  private output(entry: LogEntry): void {
    // In production, logs are automatically collected by Cloudflare
    // Format as JSON for structured logging
    const output = JSON.stringify(entry)

    switch (entry.level) {
      case 'debug':
        console.debug(output)
        break
      case 'info':
        console.log(output)
        break
      case 'warn':
        console.warn(output)
        break
      case 'error':
      case 'fatal':
        console.error(output)
        break
    }
  }

  /**
   * Sanitize sensitive keys
   */
  private sanitizeKey(key: string): string {
    // Remove potential PII from cache keys
    return key.replace(/user:\d+/, 'user:***')
              .replace(/email:[^:]+/, 'email:***')
              .replace(/token:[^:]+/, 'token:***')
  }
}

/**
 * Request logging middleware
 */
export function requestLoggingMiddleware(logger: Logger) {
  return async (c: any, next: any) => {
    const start = Date.now()
    const correlationId = c.req.header('x-correlation-id') || generateCorrelationId()
    const requestId = c.req.header('cf-ray') || generateRequestId()

    // Create request-scoped logger
    const requestLogger = logger.child({
      correlationId,
      requestId,
      path: c.req.path,
      method: c.req.method
    })

    // Attach logger to context
    c.set('logger', requestLogger)
    c.set('correlationId', correlationId)

    try {
      await next()
      const duration = Date.now() - start
      requestLogger.logRequest(c.req.raw, c.res, duration)
    } catch (error) {
      const duration = Date.now() - start
      requestLogger.error('Request failed', error, { duration_ms: duration })
      throw error
    }
  }
}

/**
 * Generate correlation ID
 */
function generateCorrelationId(): string {
  return `cid_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Generate request ID
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Export singleton instance
 */
export const logger = Logger.getInstance()