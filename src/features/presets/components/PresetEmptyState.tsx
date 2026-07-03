import { useTranslation } from 'react-i18next'
import { EmptyState } from '@/components/EmptyState'

export function PresetEmptyState() {
  const { t } = useTranslation('settings')
  return <EmptyState title={t('presets.noPresets')} description={t('presets.noPresetsDescription')} />
}
