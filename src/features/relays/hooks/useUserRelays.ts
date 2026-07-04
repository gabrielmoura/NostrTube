import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { RelayDirectoryError } from '@/errors'
import { normalizeRelayUrls, syncNdkRelayPool } from '@/lib/ndk'
import useUserStore from '@/store/useUserStore'

interface DufflePudRelaysResponse {
  relays: string[]
}

function normalizePublicRelayList(relays: string[]) {
  return Array.from(new Set(relays.filter((relay) => relay.startsWith('ws://') || relay.startsWith('wss://')))).sort()
}

export function useUserRelays() {
  const storedRelays = useUserStore((state) => state.session?.relays)
  const setRelays = useUserStore((state) => state.setRelays)
  const defaultRelays = import.meta.env.VITE_NOSTR_RELAYS ?? []

  const relayDirectoryQuery = useQuery({
    queryKey: ['relay-directory'],
    queryFn: async (): Promise<DufflePudRelaysResponse> => {
      const response = await fetch(import.meta.env.VITE_DUFFLEPUD_URL as string)
      if (!response.ok) {
        throw new RelayDirectoryError(undefined, {
          relayDirectoryUrl: import.meta.env.VITE_DUFFLEPUD_URL,
          status: response.status,
        })
      }
      return response.json()
    },
    networkMode: 'online' as const,
    staleTime: 1000 * 60 * 60 * 24,
    enabled: Boolean(import.meta.env.VITE_DUFFLEPUD_URL),
  })

  const selectedRelays = useMemo(
    () => normalizeRelayUrls(storedRelays?.length ? storedRelays : defaultRelays),
    [storedRelays],
  )

  const publicRelays = useMemo(
    () => normalizePublicRelayList(relayDirectoryQuery.data?.relays ?? []),
    [relayDirectoryQuery.data?.relays],
  )

  const allKnownRelays = useMemo(
    () => Array.from(new Set([...selectedRelays, ...publicRelays, ...normalizeRelayUrls(defaultRelays)])).sort(),
    [publicRelays, selectedRelays],
  )

  const applyRelaySelection = (nextRelays: string[]) => {
    const normalized = normalizeRelayUrls(nextRelays)
    setRelays(normalized)
    syncNdkRelayPool(normalized)
  }

  const addRelay = (relayUrl: string) => {
    const normalized = relayUrl.trim()
    if (!normalized || selectedRelays.includes(normalized)) return
    applyRelaySelection([...selectedRelays, normalized])
  }

  const removeRelay = (relayUrl: string) => {
    applyRelaySelection(selectedRelays.filter((relay) => relay !== relayUrl))
  }

  const reorderRelay = (relayUrl: string, direction: 'up' | 'down') => {
    const currentIndex = selectedRelays.indexOf(relayUrl)
    if (currentIndex === -1) return
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (targetIndex < 0 || targetIndex >= selectedRelays.length) return

    const nextRelays = [...selectedRelays]
    const [item] = nextRelays.splice(currentIndex, 1)
    nextRelays.splice(targetIndex, 0, item)
    applyRelaySelection(nextRelays)
  }

  return {
    selectedRelays,
    publicRelays,
    allKnownRelays,
    relayDirectoryQuery,
    addRelay,
    removeRelay,
    reorderRelay,
    applyRelaySelection,
  }
}
