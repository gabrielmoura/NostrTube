import { nip19 } from 'nostr-tools'

const HEX_EVENT_ID_REGEX = /^[0-9a-f]{64}$/i

export type VideoRouteResolution =
  | { type: 'event-id'; id: string }
  | { type: 'd-tag'; dTag: string }
  | { type: 'nevent'; id: string; relays?: string[] }
  | { type: 'note'; id: string }
  | { type: 'naddr'; pubkey: string; kind: number; identifier: string; relays?: string[] }
  | { type: 'invalid'; reason: string }

export function resolveVideoRouteParam(param: string): VideoRouteResolution {
  const reference = param.trim()

  if (!reference) {
    return { type: 'invalid', reason: 'Empty video reference' }
  }

  if (HEX_EVENT_ID_REGEX.test(reference)) {
    return { type: 'event-id', id: reference.toLowerCase() }
  }

  if (reference.startsWith('n')) {
    try {
      const { type, data } = nip19.decode(reference)

      if (type === 'nevent') {
        const eventPointer = data as nip19.EventPointer
        return { type: 'nevent', id: eventPointer.id, relays: eventPointer.relays }
      }

      if (type === 'note') {
        return { type: 'note', id: data as string }
      }

      if (type === 'naddr') {
        const addressPointer = data as nip19.AddressPointer
        return {
          type: 'naddr',
          pubkey: addressPointer.pubkey,
          kind: addressPointer.kind,
          identifier: addressPointer.identifier,
          relays: addressPointer.relays,
        }
      }
    } catch {
      return { type: 'd-tag', dTag: reference }
    }

    return { type: 'invalid', reason: 'Unsupported NIP-19 video reference' }
  }

  return { type: 'd-tag', dTag: reference }
}
