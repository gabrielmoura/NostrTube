import { CheckCircle2, Cloud, ImageIcon, Settings2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PresetPubkeyBadge } from '@/features/presets/components/PresetPubkeyBadge'
import { PresetStats } from '@/features/presets/components/PresetStats'
import type { NostubePreset } from '@/features/presets/types/preset'
import { formatPresetDate } from '@/features/presets/utils/presetFormatters'

interface PresetActiveCardProps {
  preset: NostubePreset | null
  isDefault: boolean
}

export function PresetActiveCard({ preset, isDefault }: PresetActiveCardProps) {
  const { t } = useTranslation('settings')

  if (!preset) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('presets.activePreset')}</CardTitle>
          <CardDescription>{t('presets.fallbackDescription')}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <CheckCircle2 className="size-5 text-primary" />
              <CardTitle className="text-base">{preset.name}</CardTitle>
              {isDefault ? <Badge variant="success">{t('presets.defaultPreset')}</Badge> : null}
            </div>
            <CardDescription>{preset.description || t('presets.noDescription')}</CardDescription>
          </div>
          <PresetPubkeyBadge pubkey={preset.pubkey} />
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 text-sm md:grid-cols-2">
          <div className="rounded-xl border border-border/60 bg-card/60 p-3">
            <p className="text-xs text-muted-foreground">{t('presets.publishedAt')}</p>
            <p className="mt-1 font-medium">{formatPresetDate(preset.createdAt)}</p>
          </div>
          <div className="rounded-xl border border-border/60 bg-card/60 p-3">
            <p className="text-xs text-muted-foreground">{t('presets.pubkey')}</p>
            <p className="mt-1 break-all font-mono text-xs">{preset.pubkey}</p>
          </div>
        </div>

        <PresetStats content={preset.content} />

        <div className="grid gap-3 md:grid-cols-2">
          {preset.content.defaultThumbResizeServer ? (
            <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-secondary/35 p-3 text-sm">
              <ImageIcon className="mt-0.5 size-4 text-primary" />
              <div className="min-w-0">
                <p className="font-medium">{t('presets.thumbServer')}</p>
                <p className="break-all text-xs text-muted-foreground">{preset.content.defaultThumbResizeServer}</p>
              </div>
            </div>
          ) : null}
          {preset.content.defaultBlossomProxy ? (
            <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-secondary/35 p-3 text-sm">
              <Cloud className="mt-0.5 size-4 text-primary" />
              <div className="min-w-0">
                <p className="font-medium">{t('presets.blossomProxy')}</p>
                <p className="break-all text-xs text-muted-foreground">{preset.content.defaultBlossomProxy}</p>
              </div>
            </div>
          ) : null}
          {preset.warnings?.length ? (
            <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm md:col-span-2">
              <Settings2 className="mt-0.5 size-4 text-amber-500" />
              <p className="text-muted-foreground">{t('presets.partialWarning')}</p>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
