import { addLog } from '@/features/debug/services/error-log.service.ts'
import { AppError, type AppErrorContext, type ErrorLogLevel } from './AppError'

export type SystemErrorSeverity = 'low' | 'medium' | 'high' | 'critical'

const AUTO_LOG_SEVERITIES: readonly SystemErrorSeverity[] = ['medium', 'high', 'critical']

export abstract class SystemError extends AppError {
  public readonly severity: SystemErrorSeverity

  protected constructor(
    message: string,
    code: string,
    severity: SystemErrorSeverity,
    context?: AppErrorContext,
    options?: ErrorOptions,
  ) {
    super(message, code, context, options)
    this.severity = severity

    if (this.shouldAutoLog()) {
      void this.persistToErrorLog()
    }
  }

  protected override getLogLevel(): ErrorLogLevel {
    switch (this.severity) {
      case 'low':
        return 'info'
      case 'medium':
        return 'warn'
      case 'high':
      case 'critical':
        return 'error'
    }
  }

  protected override getLogContext(): AppErrorContext {
    return {
      ...super.getLogContext(),
      severity: this.severity,
    }
  }

  private shouldAutoLog(): boolean {
    return AUTO_LOG_SEVERITIES.includes(this.severity)
  }

  private async persistToErrorLog(): Promise<void> {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return

    try {
      await addLog(this.toLogPayload())
    } catch {
      // Logging must never interfere with the originating failure.
    }
  }
}
