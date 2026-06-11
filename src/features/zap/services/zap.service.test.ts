import { describe, expect, it, vi } from 'vitest'
import { getZapErrorMessage } from '@/features/zap/services/zap.service'
import { ZapFlowError } from '@/features/zap/types/zap'

vi.mock('i18next', () => ({
  t: (key: string) => key,
}))

describe('zap.service', () => {
  it('maps typed zap errors to translation keys', () => {
    expect(getZapErrorMessage(new ZapFlowError('zap-unavailable', 'no lnurl'))).toBe('zap.errors.zap_unavailable')
    expect(getZapErrorMessage(new ZapFlowError('zap-payment-cancelled', 'cancelled'))).toBe('zap.errors.zap_payment_cancelled')
  })

  it('falls back to generic translation key for unknown errors', () => {
    expect(getZapErrorMessage(null)).toBe('zap.errors.unknown')
  })
})
