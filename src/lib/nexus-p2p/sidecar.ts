import type { SignalData } from 'simple-peer'
import { NexusEventCache } from '@/lib/nexus-p2p/cache'
import { NexusPeerConnection } from '@/lib/nexus-p2p/peer'
import { NexusSignalingClient } from '@/lib/nexus-p2p/signaling'
import type {
  NexusDebugSnapshot,
  NexusEventRequestOptions,
  NexusEventSummary,
  NexusSidecarOptions,
  NostrEventLike,
} from '@/lib/nexus-p2p/types'

interface PendingEventRequest {
  subscriptionId: string
  timer: ReturnType<typeof setTimeout>
  resolve: (event: NostrEventLike | null) => void
  promise: Promise<NostrEventLike | null>
}

const DEFAULT_ICE_SERVERS: RTCIceServer[] = [{ urls: 'stun:stun.l.google.com:19302' }]

export class NexusP2PSidecar {
  private readonly cache: NexusEventCache
  private readonly signaling: NexusSignalingClient
  private readonly peers = new Map<string, NexusPeerConnection>()
  private readonly pendingRequests = new Map<string, PendingEventRequest>()
  private readonly queuedAnnouncements: NexusEventSummary[] = []
  private readonly eventListeners = new Set<(event: NostrEventLike) => void>()
  private announceTimer: ReturnType<typeof setTimeout> | null = null
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null
  private statsTimer: ReturnType<typeof setInterval> | null = null
  private started = false
  private turnServers: RTCIceServer[] | null = null
  private stats = {
    served: 0,
    received: 0,
    cached: 0,
  }

  constructor(private readonly options: NexusSidecarOptions) {
    this.cache = new NexusEventCache(options.dbName, options.cacheTtlMs)
    this.signaling = new NexusSignalingClient(options.relayUrl, options.reconnectDelayMs)
    this.signaling.subscribe(this.handleWireMessage)
    this.signaling.onOpen(() => {
      this.signaling.send(['PEER_REGISTER', { bandwidth: 10, storage: 500 }])
      this.issuePendingRequests()
    })
  }

  start() {
    if (this.started || !this.isEnabled()) return
    this.started = true
    this.signaling.start()
    this.startTimers()
  }

  stop() {
    this.started = false
    this.signaling.stop()
    this.stopTimers()

    for (const peer of this.peers.values()) {
      peer.destroy()
    }

    this.peers.clear()
    this.pendingRequests.forEach((request) => clearTimeout(request.timer))
    this.pendingRequests.clear()
  }

  onEvent(listener: (event: NostrEventLike) => void) {
    this.eventListeners.add(listener)
    return () => this.eventListeners.delete(listener)
  }

  async ingestEvent(event: NostrEventLike) {
    await this.cache.put(event)
    this.stats.cached += 1
    this.queueAnnouncement(event)
    this.eventListeners.forEach((listener) => listener(event))
  }

  async ingestEvents(events: Iterable<NostrEventLike>) {
    const normalized = [...events]
    if (normalized.length === 0) return
    await this.cache.putMany(normalized)
    this.stats.cached += normalized.length

    for (const event of normalized) {
      this.queueAnnouncement(event)
      this.eventListeners.forEach((listener) => listener(event))
    }
  }

  getLocalEvent(eventId: string) {
    return this.cache.get(eventId)
  }

  getLocalEvents(eventIds: string[]) {
    return this.cache.getMany(eventIds)
  }

  async requestEvent(eventId: string, requestOptions: NexusEventRequestOptions = {}): Promise<NostrEventLike | null> {
    if (!this.isEnabled()) return null

    const cached = await this.cache.get(eventId)
    if (cached) return cached

    this.start()

    const existing = this.pendingRequests.get(eventId)
    if (existing) return existing.promise

    const timeoutMs = requestOptions.timeoutMs ?? this.options.p2pRequestTimeoutMs
    const subscriptionId = `nexus-p2p:${eventId}:${Date.now()}`

    let resolvePending!: (event: NostrEventLike | null) => void
    const promise = new Promise<NostrEventLike | null>((resolve) => {
      resolvePending = resolve
    })

    const timer = setTimeout(() => {
      this.signaling.send(['CLOSE', subscriptionId])
      this.pendingRequests.delete(eventId)
      resolvePending(null)
    }, timeoutMs)

    this.pendingRequests.set(eventId, {
      subscriptionId,
      timer,
      resolve: resolvePending,
      promise,
    })

    this.issuePendingRequest(eventId, subscriptionId)
    this.peers.forEach((peer) => peer.requestEvent(eventId))

    return promise
  }

  async requestEvents(eventIds: string[], requestOptions: NexusEventRequestOptions = {}) {
    const results = await Promise.all(
      eventIds.map(async (eventId) => {
        const event = await this.requestEvent(eventId, requestOptions)
        return event ? ([eventId, event] as const) : null
      }),
    )

    return new Map(results.filter((entry): entry is readonly [string, NostrEventLike] => entry !== null))
  }

  setEnabled(enabled: boolean) {
    if (typeof window === 'undefined') return
    localStorage.setItem(this.options.storageKey, String(enabled))

    if (enabled) {
      this.start()
      return
    }

    this.stop()
  }

  getDebugSnapshot(): NexusDebugSnapshot {
    return {
      enabled: this.isEnabled(),
      configuredEnabled: this.options.enabled,
      relayUrl: this.options.relayUrl,
      storageBackend: this.cache.getStorageBackend(),
      unifiedWithNdkCache: this.cache.isUnifiedWithNdkCache(),
      started: this.started,
      signalingOpen: this.signaling.isOpen(),
      peerCount: this.peers.size,
      pendingRequestCount: this.pendingRequests.size,
      queuedAnnouncementCount: this.queuedAnnouncements.length,
      cacheStats: {
        served: this.stats.served,
        received: this.stats.received,
        cached: this.stats.cached,
      },
    }
  }

  private isEnabled() {
    if (!this.options.enabled || typeof window === 'undefined') return false
    return localStorage.getItem(this.options.storageKey) !== 'false'
  }

  private startTimers() {
    if (!this.heartbeatTimer) {
      this.heartbeatTimer = setInterval(() => this.signaling.send(['PEER_HEARTBEAT']), this.options.heartbeatMs)
    }

    if (!this.statsTimer) {
      this.statsTimer = setInterval(() => {
        this.signaling.send([
          'PEER_STATS',
          {
            events_served: this.stats.served,
            bytes_transferred: 0,
            peers_connected: this.peers.size,
          },
        ])
      }, this.options.statsMs)
    }
  }

  private stopTimers() {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer)
    if (this.statsTimer) clearInterval(this.statsTimer)
    if (this.announceTimer) clearTimeout(this.announceTimer)
    this.heartbeatTimer = null
    this.statsTimer = null
    this.announceTimer = null
  }

  private queueAnnouncement(event: NostrEventLike) {
    this.queuedAnnouncements.push({
      id: event.id,
      pubkey: event.pubkey || '',
      kind: event.kind || 0,
      created_at: event.created_at || 0,
    })

    if (this.announceTimer) return
    this.announceTimer = setTimeout(() => {
      this.announceTimer = null
      this.flushAnnouncements()
    }, this.options.offerBatchDebounceMs)
  }

  private async flushAnnouncements(forceFullSync = false) {
    if (!this.signaling.isOpen()) return

    const payload = forceFullSync ? await this.cache.listRecentSummaries(0) : this.queuedAnnouncements.splice(0, 200)

    if (payload.length > 0) {
      this.signaling.send(['PEER_CACHE_HAVE', { events: payload }])
    }
  }

  private issuePendingRequests() {
    this.pendingRequests.forEach((request, eventId) => {
      this.issuePendingRequest(eventId, request.subscriptionId)
    })
  }

  private issuePendingRequest(eventId: string, subscriptionId: string) {
    this.signaling.send(['REQ', subscriptionId, { ids: [eventId], limit: 1 }])
  }

  private readonly handleWireMessage = async (message: unknown[]) => {
    const [type, payload, maybeEvent] = message

    if (type === 'PEER_REGISTERED' && this.isRecord(payload)) {
      await this.flushAnnouncements(true)
      this.issuePendingRequests()
      return
    }

    if (type === 'PEER_OFFER' && this.isRecord(payload)) {
      const offers = this.isRecord(payload.offers) ? payload.offers : {}

      for (const [eventId, peerIds] of Object.entries(offers)) {
        if (!this.pendingRequests.has(eventId) || !Array.isArray(peerIds)) continue

        for (const peerId of peerIds.slice(0, this.options.maxPeers)) {
          if (typeof peerId !== 'string') continue
          const peer = await this.getOrCreatePeer(peerId, true)
          peer.requestEvent(eventId)
        }
      }
      return
    }

    if (type === 'PEER_SIGNAL' && this.isRecord(payload) && typeof payload.from_peer === 'string') {
      const peer = await this.getOrCreatePeer(payload.from_peer, false)
      peer.signal(payload.signal_data as SignalData)
      return
    }

    if (type === 'PEER_EVENT_NEW' && this.isRecord(payload) && this.isNostrEventLike(payload.event)) {
      await this.ingestEvent(payload.event)
      return
    }

    if (type === 'EVENT' && this.isRecord(maybeEvent) && this.isNostrEventLike(maybeEvent)) {
      await this.resolveRequest(maybeEvent.id, maybeEvent)
      if (typeof payload === 'string') {
        this.signaling.send(['CLOSE', payload])
      }
    }
  }

  private async getOrCreatePeer(peerId: string, initiator: boolean) {
    const existing = this.peers.get(peerId)
    if (existing) return existing

    const iceServers = await this.getIceServers()
    const peer = new NexusPeerConnection(peerId, initiator, iceServers, {
      onSignal: (targetPeerId, signal) => {
        this.signaling.send(['PEER_SIGNAL', { target_peer: targetPeerId, signal_data: signal }])
      },
      onEventRequest: async (_targetPeerId, eventId) => {
        const event = await this.cache.get(eventId)
        if (!event) return
        const currentPeer = this.peers.get(peerId)
        currentPeer?.sendEvent(event)
        this.stats.served += 1
      },
      onEvent: async (_targetPeerId, event) => {
        this.stats.received += 1
        await this.resolveRequest(event.id, event)
      },
      onClose: (closedPeerId) => {
        this.peers.delete(closedPeerId)
      },
    })

    this.peers.set(peerId, peer)
    return peer
  }

  private async resolveRequest(eventId: string, event: NostrEventLike) {
    await this.ingestEvent(event)

    const pending = this.pendingRequests.get(eventId)
    if (!pending) return

    clearTimeout(pending.timer)
    this.pendingRequests.delete(eventId)
    pending.resolve(event)
  }

  private async getIceServers() {
    if (this.turnServers) return this.turnServers

    try {
      const endpoint = this.options.relayUrl.replace(/^wss:/, 'https:').replace(/^ws:/, 'http:')
      const response = await fetch(`${endpoint}/turn-credentials`)
      const payload = (await response.json()) as { iceServers?: RTCIceServer[] }
      this.turnServers = payload.iceServers?.length ? payload.iceServers : DEFAULT_ICE_SERVERS
    } catch {
      this.turnServers = DEFAULT_ICE_SERVERS
    }

    return this.turnServers
  }

  private isRecord(value: unknown): value is Record<string, any> {
    return typeof value === 'object' && value !== null
  }

  private isNostrEventLike(value: unknown): value is NostrEventLike {
    return (
      this.isRecord(value) &&
      typeof value.id === 'string' &&
      typeof value.pubkey === 'string' &&
      typeof value.kind === 'number' &&
      typeof value.created_at === 'number' &&
      Array.isArray(value.tags) &&
      typeof value.content === 'string' &&
      typeof value.sig === 'string'
    )
  }
}
