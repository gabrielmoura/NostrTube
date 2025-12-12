import { nip19 } from "nostr-tools";
import type { NDKEvent, NDKFilter } from "@nostr-dev-kit/ndk";
import NDK, { NDKKind, NDKSubscriptionCacheUsage } from "@nostr-dev-kit/ndk";
import { notFound } from "@tanstack/react-router";
import { deduplicateParameterizedEvents } from "@/helper/format.ts";


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
    console.error(error);
    throw new Error(`Falha ao decodificar NIP-19: ${userId}`);
  }
}

/**
 * Busca eventos de vídeo, metadados do perfil e playlists de um usuário específico.
 *
 * Esta função realiza as seguintes operações:
 * 1. Resolve o identificador do usuário (hex ou npub) para uma chave pública.
 * 2. Busca eventos dos tipos: Vídeo (Kind 1063), Vídeo Horizontal, Metadata (Kind 0) e Playlists (Kind 30001).
 * 3. Utiliza a estratégia de cache `PARALLEL` para resposta rápida via cache local + atualização via rede.
 * 4. Aplica deduplicação em eventos de Playlist (NIP-33), retornando apenas a versão mais recente de cada lista.
 *
 * @param {GetVideosFromUserDataParams} params - Objeto contendo as dependências e parâmetros.
 * @param {NDK} params.ndk - Instância do NDK inicializada.
 * @param {string} params.userId - Identificador do usuário (Hex Pubkey ou NIP-19 npub).
 *
 * @returns {Promise<Set<NDKEvent>>} Promise que resolve um Set contendo os eventos únicos encontrados (Vídeos, Perfil e Playlists).
 *
 * @throws {Error} Lança um erro `notFound` (do tanstack router) se nenhum evento for encontrado para o usuário.
 */
export async function getVideosFromUserData({ ndk, userId }: GetVideosFromUserDataParams): Promise<Set<NDKEvent>> {
  // 1. Resolve o Pubkey
  const pubkey = resolvePubkey(userId);

  // 2. Define filtros
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
      kinds: [NDKKind.VideoCurationSet] // Playlists podem vir duplicadas/antigas
    }
  ];

  // 3. Busca os eventos
  const events = await ndk.fetchEvents(filters, {
    groupable: true,
    closeOnEose: true, // Fecha conexão ao terminar
    cacheUsage: NDKSubscriptionCacheUsage.PARALLEL // Cache + Rede
  });

  // 4. Valida se veio algo
  if (!events || events.size === 0) {
    throw notFound();
  }

  // 5. Deduplica apenas as Playlists (Kind 30001)
  // Mantém Vídeos e Metadados intocados
  return deduplicateParameterizedEvents(events, NDKKind.VideoCurationSet);
}