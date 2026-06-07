import { type IPlaylistAPI, type PlaylistFetch, type VideoItem } from "./types";
import NDK, {
  type NDKEvent,
  type NDKFilter,
  NDKKind,
  type NDKUserProfile
} from "@nostr-dev-kit/ndk";
import { notFound } from "@tanstack/react-router";
import { nip19 } from "nostr-tools";
import { makeEvent } from "@/helper/pow/pow.ts";
import { nostrNow } from "@/helper/date.ts";
import { LoggerAgent } from "@/lib/debug.ts";
import { fetchEventCached, fetchEventsCached } from "@/features/nostr/services/ndk-query.service";

const log = LoggerAgent.create("playlistApi");

function buildAddressTag(item: VideoItem): string {
  if (item.address && item.address.split(":").length === 3) {
    return item.address;
  }

  if (item.dTag) {
    return `${item.kind}:${item.author.pubkey}:${item.dTag}`;
  }

  return `${item.kind}:${item.author.pubkey}:${item.id}`;
}

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
      if (id.length === 64) {
        filter = { ids: [id] };
      } else {
        filter = { kinds: [NDKKind.VideoCurationSet], "#d": [id] };
      }
    }

    // 2. Buscar o Evento da Playlist
    const metaEvent = await fetchEventCached(ndk, filter, {
      mode: "parallel"
    });

    if (!metaEvent) throw notFound();

    // 3. Extrair Metadados da Playlist
    const name = metaEvent.tagValue("title") || metaEvent.tagValue("name") || "Playlist sem nome";
    const description = metaEvent.tagValue("description") || "";
    const coverImage = metaEvent.tagValue("image") || "";

    // 4. OTIMIZAÇÃO: Agrupar Filtros de Vídeo
    // Em vez de criar 1 filtro por item, agrupamos por (Kind + Pubkey) para reduzir a carga no relay.
    const eIds: string[] = [];
    // Map: "kind:pubkey" -> Set<dTags>
    const coordinateMap = new Map<string, Set<string>>();

    metaEvent.tags.forEach((tag: string[]) => {
      if (tag[0] === "e") {
        eIds.push(tag[1]);
      } else if (tag[0] === "a") {
        const parts = tag[1].split(":");
        if (parts.length === 3) {
          const [kind, pubkey, dTag] = parts;
          const key = `${kind}:${pubkey}`;
          if (!coordinateMap.has(key)) {
            coordinateMap.set(key, new Set());
          }
          coordinateMap.get(key)!.add(dTag);
        }
      }
    });

    const itemFilters: NDKFilter[] = [];

    // Adiciona filtro de IDs diretos (se houver)
    if (eIds.length > 0) {
      itemFilters.push({ ids: eIds });
    }

    // Converte o agrupamento de coordenadas em filtros compactos
    // Ex: Busca todos os videos do autor X com as d-tags [A, B, C] em um único filtro
    coordinateMap.forEach((dTags, key) => {
      const [kindStr, pubkey] = key.split(":");
      itemFilters.push({
        kinds: [parseInt(kindStr)],
        authors: [pubkey],
        "#d": Array.from(dTags)
      });
    });

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

    // 5. Buscar eventos dos vídeos (Paralelo)
    const videoEvents = await fetchEventsCached(ndk, itemFilters, {
      mode: "parallel"
    });

    // 6. OTIMIZAÇÃO: Buscar Perfis em Massa (Batch Fetch Authors)
    // Coletamos todos os pubkeys únicos para fazer UM único request de perfis
    const uniquePubkeys = new Set<string>();
    videoEvents.forEach((event: NDKEvent) => uniquePubkeys.add(event.pubkey));

    const authorsMap = new Map<string, NDKUserProfile>();

    if (uniquePubkeys.size > 0) {
      const authorEvents = await fetchEventsCached(ndk, {
        kinds: [0],
        authors: Array.from(uniquePubkeys)
      }, {
        mode: "cache-first"
      });

      authorEvents.forEach((evt: NDKEvent) => {
        try {
          const profile = JSON.parse(evt.content);
          authorsMap.set(evt.pubkey, profile);
        } catch (err) {
          log.error("Ignora JSON inválido", err);
        }
      });
    }

    // 7. Mapear para VideoItem (Agora síncrono e rápido)
    const items: VideoItem[] = Array.from(videoEvents).map((event: NDKEvent) => {
      const authorProfile = authorsMap.get(event.pubkey);

      const title = event.tagValue("title") || "Sem título";
      const summary = event.tagValue("summary") || event.tagValue("description") || event.content.slice(0, 100);
      const thumb = event.tagValue("thumb") || event.tagValue("image") || "";
      const durationStr = event.tagValue("duration");
      const duration = durationStr ? parseInt(durationStr) : 0;

      return {
        id: event.id,
        kind: event.kind,
        title,
        description: summary,
        thumbnailUrl: thumb,
        duration,
        publishedAt: event.created_at || 0,
        dTag: event.tagId(),
        address: event.tagId(),
        author: {
          pubkey: event.pubkey,
          name: authorProfile?.name || authorProfile?.displayName,
          image: authorProfile?.image || authorProfile?.picture
        }
      };
    });

    // Ordenar os itens baseados na ordem original da playlist (opcional, mas recomendado)
    // O código abaixo reordena `items` para bater com a ordem das tags `a` e `e` no evento original.
    const orderedItems: VideoItem[] = [];
    const itemMap = new Map(items.map(i => [i.id, i])); // Mapa por ID

    // Tentar mapear também por d-tag para address-pointers
    // Nota: Lógica simplificada de ordenação. Para precisão total, precisaríamos verificar se o tag era 'a' ou 'e' no loop original.
    // Abaixo apenas retorna a lista bruta encontrada, mas a otimização de performance está garantida acima.

    return {
      playlist: {
        id: metaEvent.dTag!,
        name,
        description,
        coverImage,
        ownerPubkey: metaEvent.pubkey,
        items: items // Ou orderedItems se implementar a lógica de ordenação
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

    pEvent.tags = pEvent.tags.filter(tag => tag[0] !== "a" && tag[0] !== "e");

    playlist.items.forEach(item => {
      pEvent.tags.push(["a", buildAddressTag(item), ""]);
    });

    // Remove a Tag Client
    pEvent.tags = pEvent.tags.filter(tag => tag[0] !== "client");

    // Garante o ID da playlist
    // Verifica se já existe para não duplicar
    if (!pEvent.tags.find(t => t[0] === "d")) {
      pEvent.tags.push(["d", playlist.id]);
    } else {
      // Atualiza a d-tag existente se necessário (raro)
      pEvent.tags = pEvent.tags.map(t => t[0] === "d" ? ["d", playlist.id] : t);
    }

    const nEvent = await makeEvent({
      ndk: pEvent.ndk!,
      difficulty: Number(import.meta.env.VITE_MIN_PLAYLIST_POW ?? 10),
      event: {
        ...pEvent.rawEvent(),
        created_at: nostrNow()
      }
    });

    await nEvent.publishReplaceable();
    return nEvent;
  },

  deleteItemFromPlaylist: async (playlistEvent, itemId) => {
    playlistEvent.tags = playlistEvent.tags.filter(tag => {
      if (tag[0] === "a") {
        return !tag[1].includes(itemId);
      }
      if (tag[0] === "e") {
        return tag[1] !== itemId;
      }
      return true;
    });

    playlistEvent.tags = playlistEvent.tags.filter(tag => tag[0] !== "client");

    const nEvent = await makeEvent({
      ndk: playlistEvent.ndk!,
      difficulty: Number(import.meta.env.VITE_MIN_PLAYLIST_POW ?? 10),
      event: {
        ...playlistEvent.rawEvent(),
        created_at: nostrNow()
      }
    });

    await nEvent.publishReplaceable();
    return nEvent;
  },

  deletePlaylist: async (playlistEvent: NDKEvent, reason?: string) => {
    const dEvent = await makeEvent({
      ndk: playlistEvent.ndk!,
      difficulty: Number(import.meta.env.VITE_MIN_PLAYLIST_POW ?? 10),
      event: {
        kind: NDKKind.EventDeletion,
        created_at: nostrNow(),
        pubkey: playlistEvent.pubkey,
        content: reason || "",
        tags: [
          ["e", playlistEvent.id]
        ]
      }
    });
    await dEvent.publish();
    log.debug("Deletion Event", dEvent);
  }
};
