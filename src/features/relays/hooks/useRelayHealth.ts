import { NDKRelayStatus } from '@nostr-dev-kit/ndk'
import { useNDK } from '@nostr-dev-kit/ndk-hooks'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { checkLatency } from '@/helper/checkLatency'

export type RelayHealthState = 'connected' | 'connecting' | 'unstable' | 'offline'

export interface RelayHealthRow {
  url: string
  state: RelayHealthState
  label: string
  tone: 'healthy' | 'warning' | 'danger' | 'partial'
  attempts: number | null
  successCount: number | null
  latency: number | null | undefined
}

function mapRelayStatus(status: number): Omit<RelayHealthRow, 'url' | 'attempts' | 'successCount' | 'latency'> {
  if (status >= NDKRelayStatus.AUTHENTICATED || status >= NDKRelayStatus.CONNECTED) {
    return { state: 'connected', label: 'Conectado', tone: 'healthy' }
  }

  if (status >= NDKRelayStatus.CONNECTING || status >= NDKRelayStatus.RECONNECTING) {
    return { state: 'connecting', label: 'Conectando', tone: 'warning' }
  }

  if (status === NDKRelayStatus.FLAPPING) {
    return { state: 'unstable', label: 'Instável', tone: 'partial' }
  }

  return { state: 'offline', label: 'Offline', tone: 'danger' }
}

export function useRelayHealth(relayUrls: string[]) {
  const { ndk } = useNDK()
  const [version, setVersion] = useState(0)
  const [latencies, setLatencies] = useState<Record<string, number | null | undefined>>({})
  const [isTestingAll, setIsTestingAll] = useState(false)

  useEffect(() => {
    const interval = window.setInterval(() => setVersion((current) => current + 1), 1500)
    return () => window.clearInterval(interval)
  }, [])

  const testRelay = useCallback(async (relayUrl: string) => {
    setLatencies((previous) => ({ ...previous, [relayUrl]: undefined }))
    const latency = await checkLatency(relayUrl)
    setLatencies((previous) => ({ ...previous, [relayUrl]: latency }))
    return latency
  }, [])

  const testAllRelays = useCallback(async () => {
    if (!relayUrls.length) return
    setIsTestingAll(true)
    const entries = await Promise.all(relayUrls.map(async (relayUrl) => [relayUrl, await checkLatency(relayUrl)] as const))
    setLatencies((previous) => ({
      ...previous,
      ...Object.fromEntries(entries),
    }))
    setIsTestingAll(false)
  }, [relayUrls])

  useEffect(() => {
    const missingLatencies = relayUrls.filter((relayUrl) => !(relayUrl in latencies))
    if (missingLatencies.length === 0) return
    void Promise.all(missingLatencies.map((relayUrl) => testRelay(relayUrl)))
  }, [latencies, relayUrls, testRelay])

  const rows = useMemo<RelayHealthRow[]>(() => {
    void version
    return relayUrls.map((relayUrl) => {
      const relay = ndk?.pool.relays.get(relayUrl)
      const mapped = mapRelayStatus(relay?.status ?? 0)
      return {
        url: relayUrl,
        ...mapped,
        attempts: relay?.connectionStats?.attempts ?? null,
        successCount: relay?.connectionStats?.success ?? null,
        latency: latencies[relayUrl],
      }
    })
  }, [latencies, ndk?.pool.relays, relayUrls, version])

  const connectedCount = rows.filter((row) => row.state === 'connected').length

  const avgLatency = useMemo(() => {
    const validLatencies = rows.map((row) => row.latency).filter((value): value is number => typeof value === 'number')
    if (!validLatencies.length) return null
    return Math.round(validLatencies.reduce((sum, value) => sum + value, 0) / validLatencies.length)
  }, [rows])

  const successRate = useMemo(() => {
    const attempts = rows.reduce((sum, row) => sum + (row.attempts ?? 0), 0)
    const successes = rows.reduce((sum, row) => sum + (row.successCount ?? 0), 0)
    if (attempts <= 0) return null
    return Math.round((successes / attempts) * 100)
  }, [rows])

  return {
    rows,
    latencies,
    connectedCount,
    avgLatency,
    successRate,
    isTestingAll,
    testRelay,
    testAllRelays,
  }
}
