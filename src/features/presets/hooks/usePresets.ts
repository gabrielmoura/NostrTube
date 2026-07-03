import { usePreset } from '@/features/presets/hooks/usePreset'

export function usePresets() {
  const { availablePresets, refreshPresets, status, error, isUsingCachedPreset } = usePreset()

  return {
    availablePresets,
    refreshPresets,
    status,
    error,
    isUsingCachedPreset,
  }
}
