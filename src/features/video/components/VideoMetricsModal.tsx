import type { NDKEvent } from '@nostr-dev-kit/ndk'
import { useNDK } from '@nostr-dev-kit/ndk-hooks'
import { t } from 'i18next'
import { BarChart3, MessageSquareText, PlayCircle, Wallet } from 'lucide-react'
import { useMemo } from 'react'
import { useMediaQuery } from '@/components/modal_v2/use-media-query'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { Skeleton } from '@/components/ui/skeleton'
import { useVideoMetrics } from '@/features/video/hooks/useVideoMetrics'
import { formatCount } from '@/helper/format'

interface VideoMetricsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  event: NDKEvent
}

function formatMetricValue(value: number | null, suffix?: string) {
  if (value === null) {
    return '--'
  }

  const formatted = String(formatCount(value))
  return suffix ? `${formatted} ${suffix}` : formatted
}

function MetricCard({
  icon: Icon,
  label,
  value,
  isLoading,
}: {
  icon: typeof Wallet
  label: string
  value: string
  isLoading: boolean
}) {
  return (
    <div className="rounded-2xl border bg-card p-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className="size-4" />
        <span>{label}</span>
      </div>
      <div className="mt-3 text-xl font-semibold text-foreground">
        {isLoading ? <Skeleton className="h-6 w-20" /> : value}
      </div>
    </div>
  )
}

export function VideoMetricsModal({ open, onOpenChange, event }: VideoMetricsModalProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const { ndk } = useNDK()
  const metrics = useVideoMetrics({ ndk: ndk ?? undefined, event, enabled: open })

  const cards = useMemo(
    () => [
      {
        key: 'views',
        icon: PlayCircle,
        label: t('video_metrics.cards.views'),
        value: formatMetricValue(metrics.data?.views ?? null),
      },
      {
        key: 'comments',
        icon: MessageSquareText,
        label: t('video_metrics.cards.comments'),
        value: formatMetricValue(metrics.data?.comments ?? null),
      },
      {
        key: 'zapCount',
        icon: BarChart3,
        label: t('video_metrics.cards.zap_count'),
        value: formatMetricValue(metrics.data?.zapCount ?? null),
      },
      {
        key: 'zapTotalSats',
        icon: Wallet,
        label: t('video_metrics.cards.zap_total'),
        value: formatMetricValue(metrics.data?.zapTotalSats ?? null, 'sats'),
      },
    ],
    [metrics.data],
  )

  const content = (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2">
        {cards.map((card) => (
          <MetricCard
            key={card.key}
            icon={card.icon}
            label={card.label}
            value={card.value}
            isLoading={metrics.isLoading}
          />
        ))}
      </div>

      {metrics.error ? (
        <div className="rounded-2xl border border-amber-500/40 bg-amber-500/5 p-4 text-sm text-muted-foreground">
          {t('video_metrics.partial_error')}
        </div>
      ) : null}

      <div className="flex justify-end">
        {metrics.isFetching && !metrics.isLoading ? (
          <Button type="button" variant="ghost" size="sm" onClick={() => void metrics.refetch()}>
            {t('video_metrics.support.refreshing')}
          </Button>
        ) : (
          <Button type="button" variant="ghost" size="sm" onClick={() => void metrics.refetch()}>
            {t('video_metrics.support.refresh')}
          </Button>
        )}
      </div>
    </div>
  )

  const footer = (
    <div className="flex justify-end">
      <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
        {t('zap.actions.close')}
      </Button>
    </div>
  )

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('video_metrics.modal_title')}</DialogTitle>
            <DialogDescription>{t('video_metrics.modal_description')}</DialogDescription>
          </DialogHeader>
          {content}
          <DialogFooter>{footer}</DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="px-4 pb-6">
        <DrawerHeader className="px-0 pt-2">
          <DrawerTitle>{t('video_metrics.modal_title')}</DrawerTitle>
          <DrawerDescription>{t('video_metrics.modal_description')}</DrawerDescription>
        </DrawerHeader>
        {content}
        <DrawerFooter className="px-0">{footer}</DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
