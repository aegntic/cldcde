// Enhanced types for Inngest workflows with latest best practices

export interface UserEvent {
  userId: string
  email: string
  timestamp: number
  userAgent?: string
  ipAddress?: string
}

export interface ExtensionEvent {
  extensionId: string
  name: string
  authorId: string
  category: string
  timestamp: number
  version?: string
  tags?: string[]
}

export interface ContentEvent {
  contentId: string
  type: 'blog' | 'extension' | 'mcp'
  authorId: string
  timestamp: number
  status: 'draft' | 'published' | 'archived'
  metadata?: Record<string, any>
}

export interface SystemEvent {
  severity: 'low' | 'medium' | 'high' | 'critical'
  service: string
  message: string
  metadata?: Record<string, any>
  timestamp: number
  correlationId?: string
  userId?: string
}

export interface InnovationEvent {
  repositoryUrl: string
  title: string
  description: string
  language: string
  stars: number
  timestamp: number
  topics?: string[]
  license?: string
}

// Enhanced workflow configuration types
export interface WorkflowConfig {
  id: string
  name: string
  retries?: number
  concurrency?: {
    key: string
    limit: number
  }
  priority?: {
    run: string
  }
  cancel?: Array<{
    event: string
    if?: string
    timeout?: string
  }>
  batchEvents?: {
    maxSize: number
    timeout: string
    key: string
  }
}

// Enhanced error types for better handling
export interface InngestError {
  name: string
  message: string
  stack?: string
  isNonRetriable?: boolean
  retryAfter?: number | string
  context?: Record<string, any>
}

// Step result types with better typing
export interface StepResult<T = any> {
  data: T
  stepId: string
  timestamp: number
  duration: number
}

// Batch event processing types
export interface BatchEvent<T = any> {
  events: Array<{
    id: string
    name: string
    data: T
    timestamp: number
  }>
  size: number
  firstSeen: number
  lastSeen: number
}

// Priority execution types
export interface PriorityConfig {
  run: string // Expression to evaluate priority
}

// Function cancellation types
export interface CancellationRule {
  event: string
  if?: string // Conditional expression
  timeout?: string // Time limit for cancellation
}

// Concurrency control types
export interface ConcurrencyConfig {
  key: string // Event data key to group by
  limit: number // Max concurrent executions per key
  scope?: 'global' | 'account' | 'function' // Concurrency scope
}