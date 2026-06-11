import type { NexusDebugSnapshot } from '@/lib/nexus-p2p'

export type NexusWindowKey = '30s' | '2m' | '10m'

export interface NexusHistoryPoint {
  at: number
  peers: number
  pending: number
  queued: number
  served: number
  received: number
  cached: number
}

const WINDOW_MS: Record<NexusWindowKey, number> = {
  '30s': 30_000,
  '2m': 120_000,
  '10m': 600_000,
}

const MAX_HISTORY_POINTS = 180

let nexusHistory: NexusHistoryPoint[] = []

export function recordNexusSnapshot(snapshot: NexusDebugSnapshot) {
  const nextPoint: NexusHistoryPoint = {
    at: Date.now(),
    peers: snapshot.peerCount,
    pending: snapshot.pendingRequestCount,
    queued: snapshot.queuedAnnouncementCount,
    served: snapshot.cacheStats.served,
    received: snapshot.cacheStats.received,
    cached: snapshot.cacheStats.cached,
  }

  const previous = nexusHistory[nexusHistory.length - 1]
  if (
    previous &&
    previous.peers === nextPoint.peers &&
    previous.pending === nextPoint.pending &&
    previous.queued === nextPoint.queued &&
    previous.served === nextPoint.served &&
    previous.received === nextPoint.received &&
    previous.cached === nextPoint.cached
  ) {
    nexusHistory = [...nexusHistory.slice(0, -1), nextPoint]
    return
  }

  nexusHistory = [...nexusHistory.slice(-(MAX_HISTORY_POINTS - 1)), nextPoint]
}

export function getNexusHistory(windowKey: NexusWindowKey) {
  const cutoff = Date.now() - WINDOW_MS[windowKey]
  return nexusHistory.filter((point) => point.at >= cutoff)
}

export function getNexusWindowMs(windowKey: NexusWindowKey) {
  return WINDOW_MS[windowKey]
}

export function getNexusWindowLabel(windowKey: NexusWindowKey) {
  return windowKey
}
