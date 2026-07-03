import { useCallback } from 'react'
import type { NDKEvent } from '@nostr-dev-kit/ndk'
import { usePreset } from '@/features/presets/hooks/usePreset'
import { filterEventsByPreset, isEventHiddenByPreset } from '@/features/presets/utils/presetContentFilters'

export function usePresetContentFilter() {
  const { activePreset } = usePreset()

  const isEventHidden = useCallback((event: Pick<NDKEvent, 'id' | 'pubkey'>) => isEventHiddenByPreset(event, activePreset), [activePreset])
  const filterEvents = useCallback(<T extends Pick<NDKEvent, 'id' | 'pubkey'>>(events: T[]) => filterEventsByPreset(events, activePreset), [activePreset])

  return {
    activePreset,
    isEventHidden,
    filterEvents,
  }
}
