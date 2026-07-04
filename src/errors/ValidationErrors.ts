import type { AppErrorContext } from './AppError'
import { DomainError } from './DomainError'

export class MissingFieldError extends DomainError {
  constructor(message: string, field: string, context?: AppErrorContext, options?: ErrorOptions) {
    super(message, 'VALIDATION_MISSING_FIELD', { field, ...context }, options)
  }
}

export class InvalidIdError extends DomainError {
  constructor(message: string, context?: AppErrorContext, options?: ErrorOptions) {
    super(message, 'VALIDATION_INVALID_ID', context, options)
  }
}
