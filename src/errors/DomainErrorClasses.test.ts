import { describe, expect, it } from 'vitest'
import { ErrorLoginNeed, SignerUnavailableError } from './AuthErrors'
import { DomainError } from './DomainError'
import { MessengerNotReadyError, RecipientResolutionError } from './MessagingErrors'
import { RelayDirectoryError } from './RelayErrors'
import { ServiceWorkerUnavailableError } from './ServiceWorkerErrors'
import { InvalidIdError, MissingFieldError } from './ValidationErrors'

describe('domain error classes', () => {
  it('keeps login errors as domain errors for UI handling', () => {
    const error = new ErrorLoginNeed('Login required', { action: 'upload' })

    expect(error).toBeInstanceOf(DomainError)
    expect(error.code).toBe('AUTH_LOGIN_REQUIRED')
    expect(error.toLogPayload().level).toBe('warn')
    expect(error.toLogPayload().context).toContain('upload')
  })

  it.each([
    [new ServiceWorkerUnavailableError(), 'SERVICE_WORKER_UNAVAILABLE'],
    [new RelayDirectoryError(), 'RELAY_DIRECTORY_REQUEST_FAILED'],
    [new MessengerNotReadyError(), 'AUTH_LOGIN_REQUIRED'],
    [new SignerUnavailableError(), 'AUTH_SIGNER_UNAVAILABLE'],
    [new RecipientResolutionError(), 'MESSAGING_RECIPIENT_NOT_RESOLVED'],
    [new MissingFieldError('No ID provided', 'eventId'), 'VALIDATION_MISSING_FIELD'],
    [new InvalidIdError('ID invalid'), 'VALIDATION_INVALID_ID'],
  ])('assigns a stable code for %s', (error, code) => {
    expect(error).toBeInstanceOf(DomainError)
    expect(error.code).toBe(code)
  })
})
