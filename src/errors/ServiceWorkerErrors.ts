import type { AppErrorContext } from './AppError'
import { DomainError } from './DomainError'

export class ServiceWorkerUnavailableError extends DomainError {
  constructor(message = 'Service worker not available', context?: AppErrorContext, options?: ErrorOptions) {
    super(message, 'SERVICE_WORKER_UNAVAILABLE', context, options)
  }
}
