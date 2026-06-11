type NexusWireMessage = unknown[]

type NexusMessageListener = (message: NexusWireMessage) => void
type NexusOpenListener = () => void

export class NexusSignalingClient {
  private socket: WebSocket | null = null
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private intentionallyClosed = false
  private readonly listeners = new Set<NexusMessageListener>()
  private readonly openListeners = new Set<NexusOpenListener>()

  constructor(
    private readonly relayUrl: string,
    private readonly reconnectDelayMs: number,
  ) {}

  start() {
    if (typeof WebSocket === 'undefined' || this.socket) return

    this.intentionallyClosed = false
    this.socket = new WebSocket(this.relayUrl)
    this.socket.addEventListener('open', this.handleOpen)
    this.socket.addEventListener('message', this.handleMessage)
    this.socket.addEventListener('close', this.handleClose)
    this.socket.addEventListener('error', this.handleError)
  }

  stop() {
    this.intentionallyClosed = true
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }

    if (!this.socket) return
    this.socket.removeEventListener('open', this.handleOpen)
    this.socket.removeEventListener('message', this.handleMessage)
    this.socket.removeEventListener('close', this.handleClose)
    this.socket.removeEventListener('error', this.handleError)
    this.socket.close()
    this.socket = null
  }

  send(message: NexusWireMessage) {
    if (this.socket?.readyState !== WebSocket.OPEN) return false
    this.socket.send(JSON.stringify(message))
    return true
  }

  subscribe(listener: NexusMessageListener) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  onOpen(listener: NexusOpenListener) {
    this.openListeners.add(listener)
    return () => this.openListeners.delete(listener)
  }

  isOpen() {
    return this.socket?.readyState === WebSocket.OPEN
  }

  private readonly handleMessage = (event: MessageEvent) => {
    try {
      const payload = JSON.parse(String(event.data))
      if (!Array.isArray(payload)) return
      this.listeners.forEach((listener) => listener(payload))
    } catch {
      // Ignore malformed signaling frames.
    }
  }

  private readonly handleOpen = () => {
    this.openListeners.forEach((listener) => listener())
  }

  private readonly handleClose = () => {
    this.socket = null
    if (this.intentionallyClosed || this.reconnectTimer) return
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      this.start()
    }, this.reconnectDelayMs)
  }

  private readonly handleError = () => {
    this.socket?.close()
  }
}
