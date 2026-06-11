import NDK, {
  NDKEvent,
  type NDKEvent as NDKEventType,
  type NDKFilter,
  NDKSubscriptionCacheUsage,
} from '@nostr-dev-kit/ndk'
import { extractCandidateEventIds, extractSingleEventId, isExactIdLookup } from '@/lib/nexus-p2p/filter-utils'
import { DEFAULT_NEXUS_POLICIES, resolveNexusOperation, resolveNexusPolicy } from '@/lib/nexus-p2p/policies'
import { NexusP2PSidecar } from '@/lib/nexus-p2p/sidecar'
import type {
  NexusDebugSnapshot,
  NexusFetchOptions,
  NexusPolicyMap,
  NexusSidecarOptions,
  NostrEventLike,
} from '@/lib/nexus-p2p/types'

type FetchMode = 'cache-first' | 'parallel'

interface RelayFetchOptions {
  mode?: FetchMode
  relayUrls?: string[]
  closeOnEose?: boolean
  groupable?: boolean
}

const DEFAULT_SIDECAR_OPTIONS: NexusSidecarOptions = {
  relayUrl: import.meta.env.VITE_NEXUS_P2P_RELAY_URL || 'wss://nexus.libernet.app',
  enabled: import.meta.env.MODE !== 'test' && import.meta.env.VITE_NEXUS_P2P_ENABLED !== 'false',
  storageKey: 'nexus_p2p_enabled',
  dbName: 'nexus-p2p-cache',
  cacheTtlMs: 24 * 60 * 60 * 1000,
  heartbeatMs: 30_000,
  statsMs: 60_000,
  offerBatchDebounceMs: 3_000,
  maxPeers: 3,
  p2pRequestTimeoutMs: 800,
  reconnectDelayMs: 2_000,
}

export class NdkNexusBridge {
  private readonly sidecar: NexusP2PSidecar
  private policyOverrides: Partial<NexusPolicyMap> = {}

  constructor(sidecarOptions: Partial<NexusSidecarOptions> = {}) {
    this.sidecar = new NexusP2PSidecar({ ...DEFAULT_SIDECAR_OPTIONS, ...sidecarOptions })
  }

  start() {
    this.sidecar.start()
  }

  stop() {
    this.sidecar.stop()
  }

  configurePolicies(overrides: Partial<NexusPolicyMap>) {
    this.policyOverrides = { ...this.policyOverrides, ...overrides }
  }

  setEnabled(enabled: boolean) {
    this.sidecar.setEnabled(enabled)
  }

  getDebugSnapshot(): NexusDebugSnapshot {
    return this.sidecar.getDebugSnapshot()
  }

  async ingestNdkEvent(event: NDKEventType | NostrEventLike | null | undefined) {
    if (!event) return
    const rawEvent = this.toRawEvent(event)
    await this.sidecar.ingestEvent(rawEvent)
  }

  async ingestNdkEvents(events: Iterable<NDKEventType | NostrEventLike>) {
    const normalized = [...events].map((event) => this.toRawEvent(event))
    await this.sidecar.ingestEvents(normalized)
  }

  async fetchEvent(
    ndk: NDK,
    filters: NDKFilter | NDKFilter[],
    relayOptions: RelayFetchOptions,
    nexusOptions: NexusFetchOptions = {},
  ): Promise<NDKEvent | null> {
    const operation = resolveNexusOperation(filters, nexusOptions.operation)
    const policy = resolveNexusPolicy(operation, nexusOptions.policy, this.policyOverrides)
    const eventId = extractSingleEventId(filters)

    if (!eventId || policy === 'relay-first') {
      return this.fetchRelayEvent(ndk, filters, relayOptions)
    }

    const local = await this.sidecar.getLocalEvent(eventId)
    if (local) return new NDKEvent(ndk, local)

    const p2pPromise = this.sidecar
      .requestEvent(eventId, {
        timeoutMs: nexusOptions.p2pWindowMs ?? DEFAULT_SIDECAR_OPTIONS.p2pRequestTimeoutMs,
      })
      .then((event) => (event ? new NDKEvent(ndk, event) : null))

    if (policy === 'p2p-only') {
      return p2pPromise
    }

    if (policy === 'p2p-first') {
      const p2pResult = await p2pPromise
      return p2pResult ?? this.fetchRelayEvent(ndk, filters, relayOptions)
    }

    return this.raceRelayAndP2P(
      p2pPromise,
      () => this.fetchRelayEvent(ndk, filters, relayOptions),
      nexusOptions.p2pWindowMs ?? DEFAULT_SIDECAR_OPTIONS.p2pRequestTimeoutMs,
    )
  }

  async fetchEvents(
    ndk: NDK,
    filters: NDKFilter | NDKFilter[],
    relayOptions: RelayFetchOptions,
    nexusOptions: NexusFetchOptions = {},
  ): Promise<Set<NDKEvent>> {
    const operation = resolveNexusOperation(filters, nexusOptions.operation)
    const policy = resolveNexusPolicy(operation, nexusOptions.policy, this.policyOverrides)
    const eventIds = extractCandidateEventIds(filters)

    if (eventIds.length === 0 || policy === 'relay-first') {
      return this.fetchRelayEvents(ndk, filters, relayOptions)
    }

    const localEvents = await this.sidecar.getLocalEvents(eventIds)
    const missingIds = eventIds.filter((eventId) => !localEvents.has(eventId))

    if (policy === 'p2p-only') {
      const p2pEvents = await this.sidecar.requestEvents(missingIds, {
        timeoutMs: nexusOptions.p2pWindowMs ?? DEFAULT_SIDECAR_OPTIONS.p2pRequestTimeoutMs,
      })

      return this.wrapEventSet(ndk, [...localEvents.values(), ...p2pEvents.values()])
    }

    if (!isExactIdLookup(filters) && operation === 'thread') {
      return this.fetchRelayEvents(ndk, filters, relayOptions)
    }

    const p2pPromise = this.sidecar
      .requestEvents(missingIds, {
        timeoutMs: nexusOptions.p2pWindowMs ?? DEFAULT_SIDECAR_OPTIONS.p2pRequestTimeoutMs,
      })
      .then((events) => this.wrapEventSet(ndk, [...localEvents.values(), ...events.values()]))

    if (policy === 'p2p-first') {
      const p2pResult = await p2pPromise
      if (p2pResult.size > 0) return p2pResult
      return this.fetchRelayEvents(ndk, filters, relayOptions)
    }

    if (localEvents.size > 0 && missingIds.length === 0) {
      return this.wrapEventSet(ndk, [...localEvents.values()])
    }

    return this.raceRelayAndP2P(
      p2pPromise,
      () => this.fetchRelayEvents(ndk, filters, relayOptions),
      nexusOptions.p2pWindowMs ?? DEFAULT_SIDECAR_OPTIONS.p2pRequestTimeoutMs,
    )
  }

  private async fetchRelayEvent(ndk: NDK, filters: NDKFilter | NDKFilter[], relayOptions: RelayFetchOptions) {
    const event = await ndk.fetchEvent(filters, {
      cacheUsage: this.toCacheUsage(relayOptions.mode),
      closeOnEose: relayOptions.closeOnEose ?? true,
      groupable: relayOptions.groupable ?? true,
      relayUrls: relayOptions.relayUrls,
    })

    await this.ingestNdkEvent(event)
    return event
  }

  private async fetchRelayEvents(ndk: NDK, filters: NDKFilter | NDKFilter[], relayOptions: RelayFetchOptions) {
    const events = await ndk.fetchEvents(filters, {
      cacheUsage: this.toCacheUsage(relayOptions.mode),
      closeOnEose: relayOptions.closeOnEose ?? true,
      groupable: relayOptions.groupable ?? true,
      relayUrls: relayOptions.relayUrls,
    })

    await this.ingestNdkEvents(events)
    return events
  }

  private wrapEventSet(ndk: NDK, events: Iterable<NostrEventLike>) {
    return new Set([...events].map((event) => new NDKEvent(ndk, event)))
  }

  private async raceRelayAndP2P<T>(
    p2pPromise: Promise<T>,
    relayFactory: () => Promise<T>,
    delayMs: number,
  ): Promise<T> {
    const relayPromise =
      delayMs > 0
        ? new Promise<T>((resolve, reject) => {
            setTimeout(() => {
              relayFactory().then(resolve).catch(reject)
            }, delayMs)
          })
        : relayFactory()

    const first = await Promise.race([
      p2pPromise.then((value) => ({ source: 'p2p' as const, value })),
      relayPromise.then((value) => ({ source: 'relay' as const, value })),
    ])

    if (this.hasUsefulResult(first.value)) {
      return first.value
    }

    return first.source === 'p2p' ? relayPromise : p2pPromise
  }

  private hasUsefulResult(value: unknown) {
    if (value instanceof Set) return value.size > 0
    return value !== null && value !== undefined
  }

  private toCacheUsage(mode: FetchMode = 'cache-first') {
    return mode === 'parallel' ? NDKSubscriptionCacheUsage.PARALLEL : NDKSubscriptionCacheUsage.CACHE_FIRST
  }

  private toRawEvent(event: NDKEventType | NostrEventLike): NostrEventLike {
    if (event instanceof NDKEvent) {
      return event.rawEvent() as NostrEventLike
    }

    return event
  }
}

export const ndkNexusBridge = new NdkNexusBridge()
export const nexusDefaultPolicies = DEFAULT_NEXUS_POLICIES
