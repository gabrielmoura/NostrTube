import type { NDKEvent } from '@nostr-dev-kit/ndk'
import { t } from 'i18next'
import { HandCoins } from 'lucide-react'
import { type ReactNode, useState } from 'react'
import { Button } from '@/components/ui/button'
import { type ZapButtonPresentationProps, ZapModal } from '@/features/zap/components/ZapModal'
import type { ZapTarget } from '@/features/zap/types/zap'

type ZapButtonProps = ZapButtonPresentationProps & {
  children?: ReactNode
} & (
    | {
        zapType: 'user'
        pubkey: string
      }
    | {
        zapType: 'event'
        event: NDKEvent
      }
  )

function getTarget(props: ZapButtonProps): ZapTarget {
  if (props.zapType === 'user') {
    return {
      type: 'user',
      pubkey: props.pubkey,
    }
  }

  return {
    type: 'event',
    event: props.event,
  }
}

export function ZapButton(props: ZapButtonProps) {
  const [open, setOpen] = useState(false)
  const target = getTarget(props)

  return (
    <>
      <Button
        type="button"
        variant={props.variant ?? 'secondary'}
        size={props.size ?? 'sm'}
        className={props.className}
        onClick={() => setOpen(true)}
      >
        <HandCoins className="size-4" />
        {props.children ?? t('zap.actions.open')}
      </Button>

      <ZapModal open={open} onOpenChange={setOpen} target={target} />
    </>
  )
}
