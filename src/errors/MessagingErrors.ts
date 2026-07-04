import type { AppErrorContext } from './AppError'
import { ErrorLoginNeed } from './AuthErrors'
import { DomainError } from './DomainError'

export class MessengerNotReadyError extends ErrorLoginNeed {
  constructor(
    message = 'Messenger is not ready for the current user session',
    context?: AppErrorContext,
    options?: ErrorOptions,
  ) {
    super(message, { reason: 'messenger-not-ready', ...context }, options)
    this.name = 'MessengerNotReadyError'
  }
}

export class RecipientResolutionError extends DomainError {
  constructor(
    message = 'Could not resolve Nostr recipient for private message.',
    context?: AppErrorContext,
    options?: ErrorOptions,
  ) {
    super(message, 'MESSAGING_RECIPIENT_NOT_RESOLVED', context, options)
  }
}
