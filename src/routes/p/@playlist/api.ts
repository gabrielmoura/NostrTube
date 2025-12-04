import { type IPlaylistAPI, type PlaylistFetch, type VideoItem } from "./types";
import NDK, { type NDKFilter, NDKKind, NDKSubscriptionCacheUsage } from "@nostr-dev-kit/ndk";
import { notFound } from "@tanstack/react-router";
import { nip19 } from "nostr-tools";
import { makeEvent } from "@/helper/pow/pow.ts";
import { nostrNow } from "@/helper/date.ts";

export const playlistApi: IPlaylistAPI = {
  fetchPlaylist: async (ndk: NDK, id?: string): Promise<PlaylistFetch> => {
    if (!id) throw notFound();

    let filter: NDKFilter = {};

    // 1. Identificar se é Naddr ou ID Hex
    if (id.startsWith("naddr")) {
      try {
        const { data } = nip19.decode(id);
        const addrData = data as nip19.AddressPointer;
        filter = {
          kinds: [addrData.kind],
          authors: [addrData.pubkey],
          "#d": [addrData.identifier]
        };
      } catch (e) {
        console.error("Invalid naddr", e);
        throw notFound();
      }
    } else {
      // Assume que é um ID de evento ou um d-tag.
      // Se for um ID único de evento (Hex):
      if (id.length === 64) {
        filter = { ids: [id] };
      } else {
        // Fallback: tenta buscar como d-tag se não parecer um ID
        filter = { kinds: [NDKKind.VideoCurationSet], "#d": [id] };
      }
    }

    // 2. Buscar o Evento da Playlist
    const metaEvent = await ndk.fetchEvent(filter, {
      cacheUsage: NDKSubscriptionCacheUsage.CACHE_FIRST,
      closeOnEose: true
    });

    if (!metaEvent) throw notFound();

    // 3. Extrair Metadados da Playlist
    const name = metaEvent.tagValue("title") || metaEvent.tagValue("name") || "Playlist sem nome";
    const description = metaEvent.tagValue("description") || "";
    const coverImage = metaEvent.tagValue("image") || "";

    // 4. Preparar Filtros para buscar os Itens (Vídeos) da Playlist
    // Playlists (NIP-51) usam tags 'a' (endereços) ou 'e' (ids)
    const itemFilters: NDKFilter[] = [];

    // Processar tags 'e' (IDs diretos)
    const eTags = metaEvent.getMatchingTags("e");
    const eIds = eTags.map((t) => t[1]);
    if (eIds.length > 0) {
      itemFilters.push({ ids: eIds });
    }

    // Processar tags 'a' (Endereços coordenados: kind:pubkey:d-tag)
    const aTags = metaEvent.getMatchingTags("a");
    aTags.forEach((tag) => {
      const value = tag[1];
      const parts = value.split(":");
      if (parts.length === 3) {
        const [kindStr, pubkey, dTag] = parts;
        itemFilters.push({
          kinds: [parseInt(kindStr)],
          authors: [pubkey],
          "#d": [dTag]
        });
      }
    });

    // Se não houver itens, retorna a playlist vazia
    if (itemFilters.length === 0) {
      return {
        playlist: {
          id: metaEvent.dTag!,
          name,
          description,
          coverImage,
          ownerPubkey: metaEvent.pubkey,
          items: []
        },
        metaEvent
      };
    }

    // 5. Buscar os eventos dos vídeos
    const videoEvents = await ndk.fetchEvents(itemFilters, {
      closeOnEose: true
    });

    // 6. Mapear para VideoItem (Resolvendo Perfis de Autores)
    const items: VideoItem[] = await Promise.all(
      Array.from(videoEvents).map(async (event) => {
        // Tenta buscar o perfil do autor
        const authorUser = ndk.getUser({ pubkey: event.pubkey });
        const authorProfile = await authorUser.fetchProfile().catch(() => null);

        // Extração de dados do vídeo
        const title = event.tagValue("title") || "Sem título";
        const summary = event.tagValue("summary") || event.tagValue("description") || event.content.slice(0, 100);
        const thumb = event.tagValue("thumb") || event.tagValue("image") || "";
        const durationStr = event.tagValue("duration");
        const duration = durationStr ? parseInt(durationStr) : 0;

        return {
          id: event.id, // Ou event.encode() se preferir naddr
          title,
          description: summary,
          thumbnailUrl: thumb,
          duration,
          publishedAt: event.created_at || 0,
          dTag: event.tagId(), // Tag de evento na playlist
          author: {
            pubkey: event.pubkey,
            name: authorProfile?.name || authorProfile?.displayName,
            image: authorProfile?.image || authorProfile?.picture
          }
        };
      })
    );

    return {
      playlist: {
        id: metaEvent.dTag!,
        name,
        description,
        coverImage,
        ownerPubkey: metaEvent.pubkey,
        items
      },
      metaEvent
    };
  },

  savePlaylist: async (pEvent, playlist) => {
    pEvent.tags = [
      ...(playlist.name ? [["title", playlist.name]] : []),
      ...(playlist.description ? [["description", playlist.description]] : []),
      ...(playlist.coverImage ? [["image", playlist.coverImage]] : [])

    ];
    // Remover tags 'a' antigas
    pEvent.tags = pEvent.tags.filter(tag => tag[0] !== "a");
    // Adicionar tags 'a' atualizadas
    playlist.items.forEach(item => {
      pEvent.tags.push(["a", item.dTag || `21:${item.author.pubkey}:${item.id}`]);
    });
    // Remove a Tag Client
    pEvent.tags = pEvent.tags.filter(tag => tag[0] !== "client");

    pEvent.tags.push(["d", playlist.id]);
    // Passa pelo POW
    const nEvent = await makeEvent({
      ndk: pEvent.ndk!,
      difficulty: 10,
      event: {
        ...pEvent.rawEvent(),
        created_at: nostrNow()
      }
    });
    await nEvent.publish();
    return nEvent;

  },

  deleteItemFromPlaylist: async (playlistEvent, itemId) => {
    // Remover tags 'a' que contenha itemId
    playlistEvent.tags = playlistEvent.tags.filter(tag => {
      return !(tag[0] === "a" && tag[2] === itemId);
    });

    // Remove a Tag Client
    playlistEvent.tags = playlistEvent.tags.filter(tag => tag[0] !== "client");

    // Passa pelo POW
    const nEvent = await makeEvent({
      ndk: playlistEvent.ndk!,
      difficulty: 10,
      event: {
        ...playlistEvent.rawEvent(),
        created_at: nostrNow()
      }
    });
    await nEvent.publish();
    return nEvent;
  }
};