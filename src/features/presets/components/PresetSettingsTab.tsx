import { RefreshCw, RotateCcw, SlidersHorizontal } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PresetActiveCard } from '@/features/presets/components/PresetActiveCard'
import { PresetEmptyState } from '@/features/presets/components/PresetEmptyState'
import { PresetErrorState } from '@/features/presets/components/PresetErrorState'
import { PresetList } from '@/features/presets/components/PresetList'
import { PresetSkeleton } from '@/features/presets/components/PresetSkeleton'
import { usePreset } from '@/features/presets/hooks/usePreset'

export function PresetSettingsTab() {
  const { t } = useTranslation('settings')
  const {
    activePreset,
    availablePresets,
    selectedPresetPubkey,
    defaultPresetPubkey,
    status,
    error,
    isUsingCachedPreset,
    selectPreset,
    refreshPresets,
    resetToDefaultPreset,
  } = usePreset()
  const [pendingPubkey, setPendingPubkey] = useState<string | null>(null)
  const isBusy = status === 'loading' || status === 'refreshing'

  const handleSelect = async (pubkey: string) => {
    setPendingPubkey(pubkey)
    try {
      await selectPreset(pubkey)
      toast.success(t('presets.selectSuccess'))
    } catch {
      toast.error(t('presets.selectError'))
    } finally {
      setPendingPubkey(null)
    }
  }

  const handleRefresh = async () => {
    try {
      await refreshPresets()
      toast.success(t('presets.refreshSuccess'))
    } catch {
      toast.error(t('presets.refreshError'))
    }
  }

  const handleReset = async () => {
    try {
      await resetToDefaultPreset()
      toast.success(t('presets.resetSuccess'))
    } catch {
      toast.error(t('presets.selectError'))
    }
  }

  return (
    <section className="space-y-5" aria-live="polite">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <SlidersHorizontal className="size-5 text-primary" />
                <CardTitle>{t('presets.title')}</CardTitle>
                {activePreset ? <Badge variant="success">{t('presets.activePreset')}</Badge> : null}
              </div>
              <CardDescription>{t('presets.description')}</CardDescription>
              <p className="text-sm text-muted-foreground">{t('presets.personalSettingsSafe')}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={handleReset} disabled={isBusy || selectedPresetPubkey === defaultPresetPubkey}>
                <RotateCcw className="size-4" />
                {t('presets.resetDefault')}
              </Button>
              <Button onClick={handleRefresh} isLoading={isBusy}>
                <RefreshCw className="size-4" />
                {t('presets.refresh')}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {isUsingCachedPreset ? (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-muted-foreground">
          {t('presets.cacheNotice')}
        </div>
      ) : null}

      {status === 'loading' && !activePreset ? <PresetSkeleton /> : null}

      {status === 'error' && !activePreset ? <PresetErrorState onRetry={() => void handleRefresh()} /> : null}

      {activePreset ? (
        <PresetActiveCard preset={activePreset} isDefault={activePreset.pubkey === defaultPresetPubkey} />
      ) : null}

      {error && activePreset ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-muted-foreground">
          {t('presets.errorDescription')}
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('presets.availableTitle')}</CardTitle>
          <CardDescription>{t('presets.availableDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          {availablePresets.length === 0 && !isBusy ? (
            <PresetEmptyState />
          ) : (
            <PresetList
              presets={availablePresets}
              selectedPresetPubkey={selectedPresetPubkey}
              defaultPresetPubkey={defaultPresetPubkey}
              onSelect={(pubkey) => {
                if (pendingPubkey) return
                void handleSelect(pubkey)
              }}
            />
          )}
        </CardContent>
      </Card>
    </section>
  )
}
