import { Ban, RadioTower, ShieldAlert, VideoOff } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { MetricCard } from '@/components/ui/metric-card'
import type { NostubePresetContent } from '@/features/presets/types/preset'

export function PresetStats({ content }: { content: NostubePresetContent }) {
  const { t } = useTranslation('settings')

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard
        title={t('presets.stats.relays')}
        value={`${content.defaultRelays.length}`}
        icon={RadioTower}
        tone="relay"
      />
      <MetricCard
        title={t('presets.stats.blockedPubkeys')}
        value={`${content.blockedPubkeys.length}`}
        icon={Ban}
        tone="default"
      />
      <MetricCard
        title={t('presets.stats.nsfwPubkeys')}
        value={`${content.nsfwPubkeys.length}`}
        icon={ShieldAlert}
        tone="zap"
      />
      <MetricCard
        title={t('presets.stats.blockedEvents')}
        value={`${content.blockedEvents.length}`}
        icon={VideoOff}
        tone="default"
      />
    </div>
  )
}
