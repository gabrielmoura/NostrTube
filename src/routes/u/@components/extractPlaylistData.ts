import { NDKEvent } from '@nostr-dev-kit/ndk'

export interface PlaylistData {
  title: string
  description?: string
  image?: string
  videoCount: number
}

function isResolvablePlaylistVideoTag(tag: string[]) {
  const [, value] = tag
  if (!value) return false

  if (tag[0] === 'e') {
    const parts = value.split(':')
    const eventId = parts.length === 2 ? parts[1] : value
    return eventId.length === 64
  }

  if (tag[0] === 'a') {
    const parts = value.split(':')
    return (
      (parts.length === 3 && Boolean(parts[0] && parts[1] && parts[2])) ||
      (parts.length === 2 && parts[1]?.length === 64)
    )
  }

  return false
}

export function extractPlaylistData(event: NDKEvent): PlaylistData {
  const getTag = (key: string) => event.tags.find((t) => t[0] === key)?.[1]

  // Conta quantas referências a eventos ('a' ou 'e') existem na lista
  const videoCount = event.tags.filter(isResolvablePlaylistVideoTag).length

  return {
    // Tenta pegar a tag 'title', se não houver, usa o identificador 'd', ou um fallback
    title: getTag('title') || getTag('name') || getTag('d') || 'Playlist sem título',
    description: getTag('description') || getTag('summary'),
    image: getTag('image') || getTag('thumb'), // Suporte para thumb ou image
    videoCount,
  }
}
