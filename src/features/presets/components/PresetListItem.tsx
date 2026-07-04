import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PresetPubkeyBadge } from '@/features/presets/components/PresetPubkeyBadge'
import type { NostubePreset } from '@/features/presets/types/preset'
import { formatPresetDate } from '@/features/presets/utils/presetFormatters'

interface PresetListItemProps {
  preset: NostubePreset
  isSelected: boolean
  isDefault: boolean
  onSelect: (pubkey: string) => void
}

export function PresetListItem({ preset, isSelected, isDefault, onSelect }: PresetListItemProps) {
  const { t } = useTranslation('settings')

  return (
    <li className="rounded-xl border border-border/70 bg-card/60 p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-medium text-foreground">{preset.name}</h3>
            {isSelected ? <Badge variant="success">{t('presets.usingPreset')}</Badge> : null}
            {isDefault ? <Badge variant="outline">{t('presets.defaultPreset')}</Badge> : null}
          </div>
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {preset.description || t('presets.noDescription')}
          </p>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <PresetPubkeyBadge pubkey={preset.pubkey} />
            <span>{formatPresetDate(preset.createdAt)}</span>
          </div>
        </div>
        <Button onClick={() => onSelect(preset.pubkey)} disabled={isSelected} size="sm">
          {isSelected ? t('presets.usingPreset') : t('presets.usePreset')}
        </Button>
      </div>
    </li>
  )
}
