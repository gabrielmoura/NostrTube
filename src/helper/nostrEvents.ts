/**
 * Minimal Nostr event shape before it is hashed and signed.
 *
 * It is intentionally local to this codebase so event construction and POW
 * workers do not need structural types from a broad utility package.
 */
export interface OwnedEvent {
  kind: number
  content: string
  tags: string[][]
  created_at: number
  pubkey?: string
}

/**
 * Nostr event shape after its canonical event id has been calculated.
 */
export interface HashedEvent extends OwnedEvent {
  id: string
}

/**
 * Nostr event shape after a signature has been attached.
 */
export interface SignedEvent extends HashedEvent {
  sig: string
  pubkey: string
}
