import { useQuery } from '@tanstack/react-query'
import { getEvents, type CacheEventRow } from '@/features/debug/services/cache.service'
import { getCacheMetrics } from '@/features/debug/services/metrics.service'

export interface RelayMetricRow {
  url: string
  events5m: number | null
  cachedTotal: number | null
}

export function useRelayMetrics(relayUrls: string[]) {
  const query = useQuery({
    queryKey: ['relay-metrics', relayUrls],
    queryFn: async () => {
      const since = Math.floor(Date.now() / 1000) - 60 * 5
      const [recentRows, cacheMetrics] = await Promise.all([getEvents({ since }), getCacheMetrics()])

      const recentByRelay = new Map<string, number>()
      recentRows.forEach((row: CacheEventRow) => {
        if (!row.relay) return
        recentByRelay.set(row.relay, (recentByRelay.get(row.relay) ?? 0) + 1)
      })

      const totalByRelay = new Map(cacheMetrics.eventsByRelay.map((entry) => [entry.relay, entry.count]))

      const rows: RelayMetricRow[] = relayUrls.map((relayUrl) => ({
        url: relayUrl,
        events5m: recentByRelay.get(relayUrl) ?? 0,
        cachedTotal: totalByRelay.get(relayUrl) ?? 0,
      }))

      return {
        rows,
        totalEvents5m: rows.reduce((sum, row) => sum + (row.events5m ?? 0), 0),
      }
    },
    enabled: relayUrls.length > 0,
    staleTime: 30_000,
    retry: false,
  })

  const rowMap = new Map((query.data?.rows ?? []).map((row) => [row.url, row]))

  return {
    ...query,
    rowMap,
    totalEvents5m: query.data?.totalEvents5m ?? null,
  }
}
