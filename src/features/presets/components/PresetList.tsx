import { PresetListItem } from '@/features/presets/components/PresetListItem'
import type { NostubePreset } from '@/features/presets/types/preset'

interface PresetListProps {
  presets: NostubePreset[]
  selectedPresetPubkey: string
  defaultPresetPubkey: string
  onSelect: (pubkey: string) => void
}

export function PresetList({ presets, selectedPresetPubkey, defaultPresetPubkey, onSelect }: PresetListProps) {
  return (
    <ul className="space-y-3">
      {presets.map((preset) => (
        <PresetListItem
          key={preset.pubkey}
          preset={preset}
          isSelected={preset.pubkey === selectedPresetPubkey}
          isDefault={preset.pubkey === defaultPresetPubkey}
          onSelect={onSelect}
        />
      ))}
    </ul>
  )
}
