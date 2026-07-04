import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AppError } from './AppError'
import { DomainError } from './DomainError'

vi.mock('@/features/debug/services/error-log.service.ts', () => ({
  addLog: vi.fn().mockResolvedValue('mock-error-id'),
}))

class TestDomainError extends DomainError {
  constructor(message = 'domain failure', context?: Record<string, unknown>, options?: ErrorOptions) {
    super(message, 'TEST_DOMAIN_ERROR', context, options)
  }
}

describe('AppError hierarchy', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('formats domain errors for the existing logger payload', () => {
    vi.setSystemTime(new Date('2026-07-04T12:00:00.000Z'))

    const error = new TestDomainError('Validation failed', { field: 'title' })
    const payload = error.toLogPayload()

    expect(error).toBeInstanceOf(AppError)
    expect(error.name).toBe('TestDomainError')
    expect(error.code).toBe('TEST_DOMAIN_ERROR')
    expect(error.timestamp).toBe('2026-07-04T12:00:00.000Z')
    expect(payload).toEqual({
      timestamp: '2026-07-04T12:00:00.000Z',
      level: 'warn',
      message: 'Validation failed',
      stack: error.stack,
      context: JSON.stringify({
        errorName: 'TestDomainError',
        code: 'TEST_DOMAIN_ERROR',
        timestamp: '2026-07-04T12:00:00.000Z',
        context: { field: 'title' },
      }),
    })
  })

  it('preserves the cause in the log payload', () => {
    const cause = new Error('root cause')
    const error = new TestDomainError('Validation failed', undefined, { cause })
    const payload = error.toLogPayload()

    expect(payload.context).toContain('"cause"')
    expect(payload.context).toContain('root cause')
  })
})
