import type { AppErrorContext } from './AppError'
import { DomainError } from './DomainError'

export class RelayDirectoryError extends DomainError {
  constructor(message = 'Relay directory request failed', context?: AppErrorContext, options?: ErrorOptions) {
    super(message, 'RELAY_DIRECTORY_REQUEST_FAILED', context, options)
  }
}
