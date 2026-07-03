import type { NDKEvent } from '@nostr-dev-kit/ndk'
import { useCallback } from 'react'
import { useMuteList } from '@/features/nostr/hooks/useMuteList'
import { usePreset } from '@/features/presets/hooks/usePreset'
import { isEventHiddenByPreset } from '@/features/presets/utils/presetContentFilters'
import { getTagValues } from '@/helper/nostrTags'

function getEventText(event: Pick<NDKEvent, 'content' | 'tags'>) {
  const title = event.tags.find((tag) => tag[0] === 'title')?.[1] ?? ''
  const summary = event.tags.find((tag) => tag[0] === 'summary')?.[1] ?? ''
  return `${title} ${summary} ${event.content ?? ''}`.toLowerCase()
}

export function useContentVisibilityFilter() {
  const { activePreset } = usePreset()
  const muteList = useMuteList()

  const isEventHidden = useCallback(
    (event: Pick<NDKEvent, 'id' | 'pubkey' | 'tags' | 'content'>) => {
      if (isEventHiddenByPreset(event, activePreset)) return true
      if (muteList.events.has(event.id) || muteList.pubkeys.has(event.pubkey)) return true

      const eventTags = getTagValues('t', event.tags).map((tag) => tag.toLowerCase())
      if (eventTags.some((tag) => muteList.hashtags.has(tag))) return true

      if (muteList.words.length > 0) {
        const eventText = getEventText(event)
        if (muteList.words.some((word) => eventText.includes(word))) return true
      }

      return false
    },
    [activePreset, muteList],
  )

  const filterEvents = useCallback(
    <T extends Pick<NDKEvent, 'id' | 'pubkey' | 'tags' | 'content'>>(events: T[]) =>
      events.filter((event) => !isEventHidden(event)),
    [isEventHidden],
  )

  return {
    activePreset,
    muteList,
    isEventHidden,
    filterEvents,
  }
}
