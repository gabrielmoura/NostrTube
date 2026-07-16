export type ErrorLogLevel = 'error' | 'warn' | 'info'

export interface AppErrorLogPayload {
  timestamp: string
  level: ErrorLogLevel
  message: string
  stack?: string
  context?: string
}

export type AppErrorContext = Record<string, unknown>

function safeStringify(value: unknown): string {
  const seen = new WeakSet<object>()

  return JSON.stringify(value, (_key, currentValue) => {
    if (currentValue instanceof Error) {
      return {
        name: currentValue.name,
        message: currentValue.message,
        stack: currentValue.stack,
      }
    }

    if (typeof currentValue === 'object' && currentValue !== null) {
      if (seen.has(currentValue)) return '[Circular]'
      seen.add(currentValue)
    }

    return currentValue
  })
}

export abstract class AppError extends Error {
  public readonly code: string
  public readonly context?: AppErrorContext
  public readonly timestamp: string

  protected constructor(message: string, code: string, context?: AppErrorContext, options?: ErrorOptions) {
    super(message, options)
    this.name = new.target.name
    this.code = code
    this.context = context
    this.timestamp = new Date().toISOString()
  }

  public toLogPayload(): AppErrorLogPayload {
    return {
      timestamp: this.timestamp,
      level: this.getLogLevel(),
      message: this.message,
      stack: this.stack,
      context: safeStringify(this.getLogContext()),
    }
  }

  protected abstract getLogLevel(): ErrorLogLevel

  protected getLogContext(): AppErrorContext {
    const logContext: AppErrorContext = {
      errorName: this.name,
      code: this.code,
      timestamp: this.timestamp,
    }

    if (this.context !== undefined) {
      logContext.context = this.context
    }

    const cause = (this as Error & { cause?: unknown }).cause
    if (cause !== undefined) {
      logContext.cause =
        cause instanceof Error ? { name: cause.name, message: cause.message, stack: cause.stack } : cause
    }

    return logContext
  }
}
