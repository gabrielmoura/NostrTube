import NDK, { type NDKEvent, type NDKFilter, NDKKind, type NDKUserProfile } from '@nostr-dev-kit/ndk'
import { notFound } from '@tanstack/react-router'
import { nip19 } from 'nostr-tools'
import { fetchEventCached, fetchEventsCached } from '@/features/nostr/services/ndk-query.service'
import { nostrNow } from '@/helper/date.ts'
import { makeEvent } from '@/helper/pow/pow.ts'
import { LoggerAgent } from '@/lib/debug.ts'
import { type IPlaylistAPI, type PlaylistFetch, type VideoItem } from './types'

const log = LoggerAgent.create('playlistApi')

function buildPlaylistItemTag(item: VideoItem): string[] {
  if (item.address && item.address.split(':').length === 3) {
    return ['a', item.address, '']
  }

  if (item.dTag) {
    return ['a', `${item.kind}:${item.author.pubkey}:${item.dTag}`, '']
  }

  return ['e', item.id]
}

type PlaylistReference =
  | { type: 'event'; value: string }
  | { type: 'address'; value: string; kind: number; pubkey: string; dTag: string }

function parsePlaylistReference(tag: string[]): PlaylistReference | null {
  const [, value] = tag
  if (!value) return null

  if (tag[0] === 'e') {
    const parts = value.split(':')
    const eventId = parts.length === 2 ? parts[1] : value
    return eventId.length === 64 ? { type: 'event', value: eventId } : null
  }

  if (tag[0] !== 'a') return null

  const parts = value.split(':')
  if (parts.length === 3) {
    const [kind, pubkey, dTag] = parts
    if (!kind || !pubkey || !dTag) return null
    return {
      type: 'address',
      value,
      kind: Number(kind),
      pubkey,
      dTag,
    }
  }

  // Legacy fallback: older helpers stored addressable videos as "kind:eventId".
  if (parts.length === 2 && parts[1]?.length === 64) {
    return { type: 'event', value: parts[1] }
  }

  return null
}

function buildEventAddress(event: NDKEvent) {
  const dTag = event.tagValue('d') || event.dTag
  return dTag ? `${event.kind}:${event.pubkey}:${dTag}` : null
}

function newestEvent(events: Iterable<NDKEvent>): NDKEvent | null {
  let newest: NDKEvent | null = null
  for (const event of events) {
    if (!newest || (event.created_at || 0) > (newest.created_at || 0)) {
      newest = event
    }
  }
  return newest
}

function dedupeNewestAddressableEvents(events: Iterable<NDKEvent>) {
  const byAddress = new Map<string, NDKEvent>()
  const byId = new Map<string, NDKEvent>()

  for (const event of events) {
    const address = buildEventAddress(event)
    if (address) {
      const existing = byAddress.get(address)
      if (!existing || (event.created_at || 0) > (existing.created_at || 0)) {
        byAddress.set(address, event)
      }
      continue
    }

    byId.set(event.id, event)
  }

  return [...byAddress.values(), ...byId.values()]
}

export const playlistApi: IPlaylistAPI = {
  fetchPlaylist: async (ndk: NDK, id?: string): Promise<PlaylistFetch> => {
    if (!id) throw notFound()

    let filter: NDKFilter = {}

    // 1. Identificar se é Naddr ou ID Hex
    if (id.startsWith('naddr')) {
      try {
        const { data } = nip19.decode(id)
        const addrData = data as nip19.AddressPointer
        filter = {
          kinds: [addrData.kind],
          authors: [addrData.pubkey],
          '#d': [addrData.identifier],
        }
      } catch (e) {
        console.error('Invalid naddr', e)
        throw notFound()
      }
    } else {
      if (id.length === 64) {
        filter = { ids: [id] }
      } else {
        filter = { kinds: [NDKKind.VideoCurationSet], '#d': [id] }
      }
    }

    // 2. Buscar o Evento da Playlist
    const metaEvents = id.length === 64
      ? await fetchEventsCached(ndk, filter, {
          mode: 'parallel',
        })
      : await fetchEventsCached(ndk, { ...filter, limit: 100 }, {
          mode: 'parallel',
        })
    const metaEvent = newestEvent(metaEvents)

    let directMetaEvent = metaEvent
    if (!directMetaEvent) {
      directMetaEvent = await fetchEventCached(ndk, filter, {
        mode: 'parallel',
      })
    }

    if (!directMetaEvent) throw notFound()

    // 3. Extrair Metadados da Playlist
    const name = directMetaEvent.tagValue('title') || directMetaEvent.tagValue('name') || 'Playlist sem nome'
    const description = directMetaEvent.tagValue('description') || ''
    const coverImage = directMetaEvent.tagValue('image') || ''

    // 4. OTIMIZAÇÃO: Agrupar Filtros de Vídeo
    // Em vez de criar 1 filtro por item, agrupamos por (Kind + Pubkey) para reduzir a carga no relay.
    const playlistReferences = directMetaEvent.tags
      .filter((tag) => tag[0] === 'a' || tag[0] === 'e')
      .map(parsePlaylistReference)
      .filter((ref): ref is PlaylistReference => Boolean(ref))

    const eIds: string[] = []
    // Map: "kind:pubkey" -> Set<dTags>
    const coordinateMap = new Map<string, Set<string>>()

    playlistReferences.forEach((ref) => {
      if (ref.type === 'event') {
        eIds.push(ref.value)
        return
      }

      const key = `${ref.kind}:${ref.pubkey}`
      if (!coordinateMap.has(key)) {
        coordinateMap.set(key, new Set())
      }
      coordinateMap.get(key)!.add(ref.dTag)
    })

    const itemFilters: NDKFilter[] = []

    // Adiciona filtro de IDs diretos (se houver)
    if (eIds.length > 0) {
      itemFilters.push({ ids: eIds })
    }

    // Converte o agrupamento de coordenadas em filtros compactos
    // Ex: Busca todos os videos do autor X com as d-tags [A, B, C] em um único filtro
    coordinateMap.forEach((dTags, key) => {
      const [kindStr, pubkey] = key.split(':')
      itemFilters.push({
        kinds: [parseInt(kindStr)],
        authors: [pubkey],
        '#d': Array.from(dTags),
      })
    })

    if (itemFilters.length === 0) {
      return {
        playlist: {
          id: directMetaEvent.dTag!,
          name,
          description,
          coverImage,
          ownerPubkey: directMetaEvent.pubkey,
          items: [],
        },
        metaEvent: directMetaEvent,
      }
    }

    // 5. Buscar eventos dos vídeos (Paralelo)
    const videoEvents = await fetchEventsCached(ndk, itemFilters, {
      mode: 'parallel',
    })

    // 6. OTIMIZAÇÃO: Buscar Perfis em Massa (Batch Fetch Authors)
    // Coletamos todos os pubkeys únicos para fazer UM único request de perfis
    const uniquePubkeys = new Set<string>()
    const newestVideoEvents = dedupeNewestAddressableEvents(videoEvents)
    newestVideoEvents.forEach((event: NDKEvent) => uniquePubkeys.add(event.pubkey))

    const authorsMap = new Map<string, NDKUserProfile>()

    if (uniquePubkeys.size > 0) {
      const authorEvents = await fetchEventsCached(
        ndk,
        {
          kinds: [0],
          authors: Array.from(uniquePubkeys),
        },
        {
          mode: 'cache-first',
        },
      )

      authorEvents.forEach((evt: NDKEvent) => {
        try {
          const profile = JSON.parse(evt.content)
          authorsMap.set(evt.pubkey, profile)
        } catch (err) {
          log.error('Ignora JSON inválido', err)
        }
      })
    }

    // 7. Mapear para VideoItem (Agora síncrono e rápido)
    const itemByEventId = new Map<string, VideoItem>()
    const itemByAddress = new Map<string, VideoItem>()

    newestVideoEvents.forEach((event: NDKEvent) => {
      const authorProfile = authorsMap.get(event.pubkey)

      const title = event.tagValue('title') || 'Sem título'
      const summary = event.tagValue('summary') || event.tagValue('description') || event.content.slice(0, 100)
      const thumb = event.tagValue('thumb') || event.tagValue('image') || ''
      const durationStr = event.tagValue('duration')
      const duration = durationStr ? parseInt(durationStr) : 0

      const item: VideoItem = {
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
          image: authorProfile?.image || authorProfile?.picture,
        },
      }

      itemByEventId.set(event.id, item)
      const address = buildEventAddress(event)
      if (address) itemByAddress.set(address, item)
    })

    const items = playlistReferences
      .map((ref) => (ref.type === 'address' ? itemByAddress.get(ref.value) : itemByEventId.get(ref.value)))
      .filter((item): item is VideoItem => Boolean(item))

    return {
      playlist: {
        id: metaEvent.dTag!,
        name,
        description,
        coverImage,
        ownerPubkey: directMetaEvent.pubkey,
        items,
      },
      metaEvent: directMetaEvent,
    }
  },

  savePlaylist: async (pEvent, playlist) => {
    pEvent.tags = [
      ...(playlist.name ? [['title', playlist.name]] : []),
      ...(playlist.description ? [['description', playlist.description]] : []),
      ...(playlist.coverImage ? [['image', playlist.coverImage]] : []),
    ]

    pEvent.tags = pEvent.tags.filter((tag) => tag[0] !== 'a' && tag[0] !== 'e')

    playlist.items.forEach((item) => {
      pEvent.tags.push(buildPlaylistItemTag(item))
    })

    // Remove a Tag Client
    pEvent.tags = pEvent.tags.filter((tag) => tag[0] !== 'client')

    // Garante o ID da playlist
    // Verifica se já existe para não duplicar
    if (!pEvent.tags.find((t) => t[0] === 'd')) {
      pEvent.tags.push(['d', playlist.id])
    } else {
      // Atualiza a d-tag existente se necessário (raro)
      pEvent.tags = pEvent.tags.map((t) => (t[0] === 'd' ? ['d', playlist.id] : t))
    }

    const nEvent = await makeEvent({
      ndk: pEvent.ndk!,
      difficulty: Number(import.meta.env.VITE_MIN_PLAYLIST_POW ?? 10),
      event: {
        ...pEvent.rawEvent(),
        created_at: nostrNow(),
      },
    })

    await nEvent.publishReplaceable()
    return nEvent
  },

  deleteItemFromPlaylist: async (playlistEvent, itemId) => {
    playlistEvent.tags = playlistEvent.tags.filter((tag) => {
      if (tag[0] === 'a') {
        return !tag[1].includes(itemId)
      }
      if (tag[0] === 'e') {
        return tag[1] !== itemId
      }
      return true
    })

    playlistEvent.tags = playlistEvent.tags.filter((tag) => tag[0] !== 'client')

    const nEvent = await makeEvent({
      ndk: playlistEvent.ndk!,
      difficulty: Number(import.meta.env.VITE_MIN_PLAYLIST_POW ?? 10),
      event: {
        ...playlistEvent.rawEvent(),
        created_at: nostrNow(),
      },
    })

    await nEvent.publishReplaceable()
    return nEvent
  },

  deletePlaylist: async (playlistEvent: NDKEvent, reason?: string) => {
    const dEvent = await makeEvent({
      ndk: playlistEvent.ndk!,
      difficulty: Number(import.meta.env.VITE_MIN_PLAYLIST_POW ?? 10),
      event: {
        kind: NDKKind.EventDeletion,
        created_at: nostrNow(),
        pubkey: playlistEvent.pubkey,
        content: reason || '',
        tags: [['e', playlistEvent.id]],
      },
    })
    await dEvent.publish()
    log.debug('Deletion Event', dEvent)
  },
}
