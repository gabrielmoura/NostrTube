import { useContext } from 'react'
import { PresetContext } from '@/features/presets/context/PresetContext'

export function usePreset() {
  const context = useContext(PresetContext)

  if (!context) {
    throw new Error('usePreset must be used within PresetProvider')
  }

  return context
}
