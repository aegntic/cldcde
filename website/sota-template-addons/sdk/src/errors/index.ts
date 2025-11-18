/**
 * Error classes for SOTA Template SDK
 */

export class SOTAError extends Error {
  public readonly code: string;
  public readonly details: Record<string, any>;
  public readonly timestamp: number;

  constructor(
    message: string,
    options: {
      code?: string;
      details?: Record<string, any>;
      cause?: Error;
    } = {}
  ) {
    super(message);
    this.name = 'SOTAError';
    this.code = options.code || 'SOTA_ERROR';
    this.details = options.details || {};
    this.timestamp = Date.now();

    if (options.cause) {
      this.cause = options.cause;
    }

    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, SOTAError);
    }
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      details: this.details,
      timestamp: this.timestamp,
      stack: this.stack
    };
  }
}

export class ModuleError extends SOTAError {
  constructor(
    moduleName: string,
    message: string,
    options: {
      code?: string;
      details?: Record<string, any>;
      cause?: Error;
    } = {}
  ) {
    super(message, {
      code: options.code || 'MODULE_ERROR',
      details: {
        moduleName,
        ...options.details
      },
      cause: options.cause
    });
    this.name = 'ModuleError';
  }
}

export class PerformanceError extends SOTAError {
  constructor(
    message: string,
    options: {
      code?: string;
      details?: Record<string, any>;
      cause?: Error;
    } = {}
  ) {
    super(message, {
      code: options.code || 'PERFORMANCE_ERROR',
      details: options.details,
      cause: options.cause
    });
    this.name = 'PerformanceError';
  }
}

export class AnimationError extends SOTAError {
  constructor(
    message: string,
    options: {
      code?: string;
      details?: Record<string, any>;
      cause?: Error;
    } = {}
  ) {
    super(message, {
      code: options.code || 'ANIMATION_ERROR',
      details: options.details,
      cause: options.cause
    });
    this.name = 'AnimationError';
  }
}

export class ThemeError extends SOTAError {
  constructor(
    message: string,
    options: {
      code?: string;
      details?: Record<string, any>;
      cause?: Error;
    } = {}
  ) {
    super(message, {
      code: options.code || 'THEME_ERROR',
      details: options.details,
      cause: options.cause
    });
    this.name = 'ThemeError';
  }
}

export class ValidationError extends SOTAError {
  public readonly field: string;
  public readonly value: any;

  constructor(
    field: string,
    message: string,
    value: any,
    options: {
      code?: string;
      details?: Record<string, any>;
      cause?: Error;
    } = {}
  ) {
    super(message, {
      code: options.code || 'VALIDATION_ERROR',
      details: {
        field,
        value,
        ...options.details
      },
      cause: options.cause
    });
    this.name = 'ValidationError';
    this.field = field;
    this.value = value;
  }
}

export class NetworkError extends SOTAError {
  constructor(
    message: string,
    options: {
      code?: string;
      details?: Record<string, any>;
      cause?: Error;
    } = {}
  ) {
    super(message, {
      code: options.code || 'NETWORK_ERROR',
      details: options.details,
      cause: options.cause
    });
    this.name = 'NetworkError';
  }
}

export class ConfigurationError extends SOTAError {
  constructor(
    message: string,
    options: {
      code?: string;
      details?: Record<string, any>;
      cause?: Error;
    } = {}
  ) {
    super(message, {
      code: options.code || 'CONFIGURATION_ERROR',
      details: options.details,
      cause: options.cause
    });
    this.name = 'ConfigurationError';
  }
}

// Error factory functions
export function createModuleError(
  moduleName: string,
  error: Error | string
): ModuleError {
  if (error instanceof Error) {
    return new ModuleError(
      moduleName,
      error.message,
      {
        code: 'MODULE_ERROR',
        cause: error
      }
    );
  }
  return new ModuleError(moduleName, error);
}

export function createPerformanceError(
  metric: string,
  error: Error | string
): PerformanceError {
  if (error instanceof Error) {
    return new PerformanceError(
      `Performance metric ${metric} error: ${error.message}`,
      {
        code: 'METRIC_ERROR',
        details: { metric },
        cause: error
      }
    );
  }
  return new PerformanceError(`Performance metric ${metric} error: ${error}`);
}

export function createAnimationError(
  animation: string,
  error: Error | string
): AnimationError {
  if (error instanceof Error) {
    return new AnimationError(
      `Animation ${animation} error: ${error.message}`,
      {
        code: 'ANIMATION_ERROR',
        details: { animation },
        cause: error
      }
    );
  }
  return new AnimationError(`Animation ${animation} error: ${error}`);
}

export function createValidationError(
  field: string,
  value: any,
  expectedType: string
): ValidationError {
  return new ValidationError(
    field,
    `Field '${field}' must be of type ${expectedType}`,
    value,
    {
      code: 'TYPE_VALIDATION_ERROR',
      details: { expectedType }
    }
  );
}

// Error handling utilities
export function handleError(error: Error, context?: string): SOTAError {
  if (error instanceof SOTAError) {
    return error;
  }

  return new SOTAError(
    `${context ? `${context}: ` : ''}${error.message}`,
    {
      code: 'UNKNOWN_ERROR',
      cause: error
    }
  );
}

export function isSOTAError(error: any): error is SOTAError {
  return error instanceof SOTAError;
}

export function getErrorCode(error: Error): string {
  if (error instanceof SOTAError) {
    return error.code;
  }
  return 'UNKNOWN_ERROR';
}

export function getErrorDetails(error: Error): Record<string, any> {
  if (error instanceof SOTAError) {
    return error.details;
  }
  return {};
}