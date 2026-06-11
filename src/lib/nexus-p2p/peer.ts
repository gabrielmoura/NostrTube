import Peer, { type SignalData, type Instance as SimplePeerInstance } from 'simple-peer'
import type { NostrEventLike } from '@/lib/nexus-p2p/types'

interface NexusPeerHandlers {
  onSignal: (peerId: string, signal: SignalData) => void
  onEventRequest: (peerId: string, eventId: string) => void
  onEvent: (peerId: string, event: NostrEventLike) => void
  onClose: (peerId: string) => void
}

export class NexusPeerConnection {
  private readonly peer: SimplePeerInstance
  private readonly pendingRequests = new Set<string>()
  private connected = false

  constructor(
    readonly peerId: string,
    initiator: boolean,
    iceServers: RTCIceServer[],
    private readonly handlers: NexusPeerHandlers,
  ) {
    this.peer = new Peer({
      initiator,
      trickle: true,
      config: { iceServers },
    })

    this.peer.on('signal', (signal) => this.handlers.onSignal(this.peerId, signal))
    this.peer.on('connect', () => {
      this.connected = true
      for (const eventId of this.pendingRequests) {
        this.sendRequest(eventId)
      }
    })
    this.peer.on('data', (buffer) => this.handleData(buffer))
    this.peer.on('error', () => this.handlers.onClose(this.peerId))
    this.peer.on('close', () => this.handlers.onClose(this.peerId))
  }

  requestEvent(eventId: string) {
    this.pendingRequests.add(eventId)
    if (this.connected) this.sendRequest(eventId)
  }

  sendEvent(event: NostrEventLike) {
    if (!this.connected) return
    this.peer.send(JSON.stringify({ type: 'P2P_EVENTS', event }))
  }

  signal(signal: SignalData) {
    this.peer.signal(signal)
  }

  destroy() {
    this.peer.destroy()
  }

  private sendRequest(eventId: string) {
    this.peer.send(JSON.stringify({ type: 'P2P_REQUEST', event_id: eventId }))
  }

  private handleData(buffer: string | Uint8Array) {
    try {
      const message = JSON.parse(buffer.toString()) as { type?: string; event_id?: string; event?: NostrEventLike }
      if (message.type === 'P2P_REQUEST' && message.event_id) {
        this.handlers.onEventRequest(this.peerId, message.event_id)
      }

      if (message.type === 'P2P_EVENTS' && message.event?.id) {
        this.handlers.onEvent(this.peerId, message.event)
      }
    } catch {
      // Ignore malformed peer payloads.
    }
  }
}
