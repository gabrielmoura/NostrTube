import type { AppErrorContext } from './AppError'
import { DomainError } from './DomainError'

export class ErrorLoginNeed extends DomainError {
  constructor(message = 'User must be logged in to continue.', context?: AppErrorContext, options?: ErrorOptions) {
    super(message, 'AUTH_LOGIN_REQUIRED', context, options)
  }
}

export class SignerUnavailableError extends DomainError {
  constructor(message = 'No signer available for this operation.', context?: AppErrorContext, options?: ErrorOptions) {
    super(message, 'AUTH_SIGNER_UNAVAILABLE', { reason: 'missing-signer', ...context }, options)
  }
}
