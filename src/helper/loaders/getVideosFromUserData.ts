import { nip19 } from "nostr-tools";
import type { NDKEvent, NDKFilter } from "@nostr-dev-kit/ndk";
import NDK, { NDKKind } from "@nostr-dev-kit/ndk";
import { NDKSubscriptionCacheUsage } from "@nostr-dev-kit/ndk-hooks";
import { notFound } from "@tanstack/react-router";

export type GetVideosFromUserDataParams = {
  ndk: NDK;
  userId: string;
};

/**
 * Helper para validar e extrair o hex pubkey de uma string (hex, npub ou nprofile)
 */
function resolvePubkey(userId: string): string {
  if (!userId || userId.length <= 5) {
    throw new Error("ID inválido ou muito curto");
  }

  // Se já for hex (assumindo que não começa com 'n' ou tem o tamanho correto de 64 chars)
  if (!userId.startsWith("n")) {
    return userId;
  }

  try {
    const { type, data } = nip19.decode(userId);

    switch (type) {
      case "npub":
        return data as string;
      case "nprofile":
        // nprofile retorna um objeto, precisamos extrair a pubkey dele
        return (data as nip19.ProfilePointer).pubkey;
      default:
        throw new Error(`Tipo de ID não suportado: ${type}`);
    }
  } catch (error) {
    throw new Error(`Falha ao decodificar NIP-19: ${userId}`);
  }
}

/**
 * Busca Eventos e Metadados de um usuário
 */
export async function getVideosFromUserData({ ndk, userId }: GetVideosFromUserDataParams): Promise<Set<NDKEvent>> {
  // 1. Resolve o Pubkey (Hex)
  const pubkey = resolvePubkey(userId);

  // 2. Define os filtros
  const filters: NDKFilter[] = [
    {
      authors: [pubkey],
      kinds: [NDKKind.Video, NDKKind.HorizontalVideo],
      limit: 100
    },
    {
      authors: [pubkey],
      kinds: [NDKKind.Metadata],
      limit: 1
    },
    {
      authors: [pubkey],
      kinds: [NDKKind.VideoCurationSet]
      // limit: 10
    }
  ];

  // 3. Busca os eventos
  const events = await ndk.fetchEvents(filters, {
    closeOnEose: true,
    cacheUsage: NDKSubscriptionCacheUsage.PARALLEL
  });

  // 4. Valida o retorno
  if (!events || events.size === 0) {
    throw notFound();
  }

  // so deve haver um evento do kind NDKKind.VideoCurationSet com tag 'd' sendo usada como identificador, escolher o evento mais recente.

  Array.from(events);

  // const hasMetadata = [...events].some(e => e.kind === NDKKind.Metadata);
  // if (!hasMetadata) {
  //   throw notFound();
  // }

  return events;
}