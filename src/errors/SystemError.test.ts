import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const addLogMock = vi.hoisted(() => vi.fn().mockResolvedValue('mock-error-id'))

vi.mock('@/features/debug/services/error-log.service.ts', () => ({
  addLog: addLogMock,
}))

import { SystemError } from './SystemError'

class TestSystemError extends SystemError {
  constructor(severity: 'low' | 'medium' | 'high' | 'critical') {
    super('system failure', 'TEST_SYSTEM_ERROR', severity, { feature: 'upload' })
  }
}

describe('SystemError', () => {
  beforeEach(() => {
    addLogMock.mockClear()
    vi.stubGlobal('window', {})
    vi.stubGlobal('navigator', { userAgent: 'Vitest' })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('auto logs medium and higher severities', async () => {
    const error = new TestSystemError('medium')

    expect(addLogMock).toHaveBeenCalledTimes(1)
    expect(addLogMock).toHaveBeenCalledWith({
      timestamp: error.timestamp,
      level: 'warn',
      message: 'system failure',
      stack: error.stack,
      context: JSON.stringify({
        errorName: 'TestSystemError',
        code: 'TEST_SYSTEM_ERROR',
        timestamp: error.timestamp,
        context: { feature: 'upload' },
        severity: 'medium',
      }),
    })
  })

  it('does not auto log low severity errors', () => {
    new TestSystemError('low')

    expect(addLogMock).not.toHaveBeenCalled()
  })

  it('maps high severity to error level', () => {
    const error = new TestSystemError('high')

    expect(error.toLogPayload().level).toBe('error')
  })

  it('keeps low severity as informational when logged manually', () => {
    const error = new TestSystemError('low')

    expect(error.toLogPayload().level).toBe('info')
  })
})
