import { NDKEvent, NDKRelay, NDKRelaySet } from '@nostr-dev-kit/ndk'
import { useCallback } from 'react'

/**
 * Hook para retransmitir eventos Nostr existentes sem recriá-los.
 */
export function useNostrRetransmission() {
  /**
   * Tenta conectar a uma lista de relays e retorna apenas os que tiveram sucesso.
   * @private
   */
  const getOnlineRelays = useCallback(async (relayUrls: string[], event: NDKEvent): Promise<Set<NDKRelay>> => {
    const onlineRelays = new Set<NDKRelay>()

    // Criamos instâncias individuais para testar a conexão
    const connectionPromises = relayUrls.map(async (url) => {
      try {
        const relay = new NDKRelay(url, undefined, event.ndk!)
        await relay.connect()

        // Só entra no conjunto se estiver realmente conectado.
        if (relay.connected) {
          onlineRelays.add(relay)
        }
      } catch (e) {
        console.warn(`Relay ${url} is unreachable. Skipping.`, e)
      }
    })

    await Promise.allSettled(connectionPromises)
    return onlineRelays
  }, [])

  /**
   * Retransmite um evento existente apenas para relays que responderem ao handshake.
   * * @param event - O evento NDK original.
   * @param relayUrls - URLs dos relays alvo.
   * @throws Error se nenhum relay estiver online.
   */
  const retransmitEvent = useCallback(
    async (event: NDKEvent, relayUrls: string[]): Promise<void> => {
      if (!event.ndk) {
        throw new Error('NDK instance is required on the event for retransmission.')
      }

      try {
        // 1. Filtra apenas os relays que conseguem conectar agora
        const onlineRelays = await getOnlineRelays(relayUrls, event)

        if (onlineRelays.size === 0) {
          throw new Error('All targeted relays are offline. Retransmission aborted.')
        }

        // 2. Cria um RelaySet apenas com os saudáveis
        const activeRelaySet = new NDKRelaySet(onlineRelays, event.ndk)

        // 3. Publica apenas no conjunto filtrado
        const publishedToRelays = await activeRelaySet.publish(event)
        if (publishedToRelays.size > 0) {
          console.info(`Event successfully sent to ${onlineRelays.size} online relay(s).`)
        } else {
          throw new Error('Failed to retransmit event to any online relays.')
        }
      } catch (error) {
        console.error('Failed to retransmit event:', error)
        // throw error;
      }
    },
    [getOnlineRelays],
  )

  return { retransmitEvent }
}
