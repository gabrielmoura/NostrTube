import { useNDK, useNDKCurrentUser } from '@nostr-dev-kit/ndk-hooks'
import { t } from 'i18next'
import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { getZapErrorMessage, startZap } from '@/features/zap/services/zap.service'
import { type StartZapParams, ZapFlowError, type ZapOutcome } from '@/features/zap/types/zap'

type ZapSubmissionStatus = 'idle' | 'submitting' | 'success' | 'invoice-ready' | 'error'

type SubmitZapParams = Omit<StartZapParams, 'ndk'>

export function useZapSubmission() {
  const { ndk } = useNDK()
  const currentUser = useNDKCurrentUser()
  const [status, setStatus] = useState<ZapSubmissionStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [invoice, setInvoice] = useState<string | null>(null)

  const reset = useCallback(() => {
    setStatus('idle')
    setErrorMessage(null)
    setInvoice(null)
  }, [])

  const submit = useCallback(
    async ({ target, amountSats, comment }: SubmitZapParams): Promise<ZapOutcome | null> => {
      if (!currentUser || !ndk) {
        const message = getZapErrorMessage(
          new ZapFlowError('unauthenticated', 'User must be logged in before sending a zap.'),
        )
        setStatus('error')
        setErrorMessage(message)
        toast.error(message)
        return null
      }

      setStatus('submitting')
      setErrorMessage(null)
      setInvoice(null)

      try {
        const result = await startZap({
          ndk,
          target,
          amountSats,
          comment,
        })

        setInvoice(result.invoice)
        setStatus(result.status === 'paid' ? 'success' : 'invoice-ready')

        if (result.status === 'paid') {
          toast.success(t('zap.success.paid'))
        } else {
          toast.info(t('zap.success.invoice_ready'))
        }

        return result
      } catch (error) {
        const message = getZapErrorMessage(error)
        setStatus('error')
        setErrorMessage(message)
        toast.error(message)
        return null
      }
    },
    [currentUser, ndk],
  )

  return {
    status,
    errorMessage,
    invoice,
    isSubmitting: status === 'submitting',
    submit,
    reset,
  }
}
