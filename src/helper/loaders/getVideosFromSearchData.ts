import NDK__default, { NDKEvent, type NDKFilter } from '@nostr-dev-kit/ndk'
import { notFound } from '@tanstack/react-router'
import { startOfDay, subMonths, subWeeks, subYears } from 'date-fns'
import { nip19 } from 'nostr-tools'
import { z } from 'zod'
import { fetchEventsCached, getSearchRelayUrls } from '@/features/nostr/services/ndk-query.service'
import { filterEventsByAge } from '@/features/video/services/age-filter.service'
import { NORMAL_VIDEO_EVENT_KINDS } from '@/features/video/services/video-kinds'
import { sortEventsByImages } from '@/helper/format.ts'
import useUserStore from '@/store/useUserStore'

// --- Erros Personalizados ---
export class VideoSearchError extends Error {
  constructor(
    message: string,
    public code = 'SEARCH_ERROR',
  ) {
    super(message)
    this.name = 'VideoSearchError'
  }
}

export const eventSearchSchema = z.object({
  search: z.union([z.string(), z.number().transform((value) => String(value))]).optional(),
  tag: z.union([z.string(), z.array(z.string())]).optional(),
  nsfw: z.boolean().optional(),
  lang: z.string().optional(),
  author: z.string().optional(),
  geohash: z.string().optional(),
  timeRange: z.enum(['all', 'today', 'week', 'month', 'year']).optional().default('all'),
})

export type eventSearchType = z.infer<typeof eventSearchSchema>

/**
 * Converte npub ou valida hex para retornar um array de pubkeys
 */
function resolveAuthorPubkey(author?: string): string[] | undefined {
  if (!author) return undefined
  try {
    if (author.startsWith('npub')) {
      const { data } = nip19.decode(author)
      return [data as string]
    }
    if (author.length === 64) return [author]
    return undefined
  } catch (e) {
    console.error('Erro ao decodificar autor:', e)
    return undefined
  }
}

/**
 * Calcula o timestamp 'since' baseado no range
 */
function calculateSince(timeRange: eventSearchType['timeRange']): number | undefined {
  if (!timeRange || timeRange === 'all') return undefined

  const now = new Date()
  let date: Date

  switch (timeRange) {
    case 'today':
      date = startOfDay(now)
      break
    case 'week':
      date = subWeeks(now, 1)
      break
    case 'month':
      date = subMonths(now, 1)
      break
    case 'year':
      date = subYears(now, 1)
      break
    default:
      return undefined
  }
  return Math.floor(date.getTime() / 1000)
}

export async function getVideosFromSearchData({
  ndk,
  search,
  nsfw,
  tag,
  lang,
  author,
  geohash,
  timeRange,
  until,
}: eventSearchType & {
  ndk: NDK__default
  until?: number
}): Promise<NDKEvent[]> {
  const filter: NDKFilter = {
    kinds: NORMAL_VIDEO_EVENT_KINDS,
    limit: 40, // Aumentamos um pouco o limite para compensar as deduplicações
  }

  if (search) {
    filter.search = search
  }
  if (nsfw) filter['#content-warning'] = ['']
  if (tag) filter['#t'] = Array.isArray(tag) ? tag : [tag]
  if (lang && lang !== 'all') filter['#l'] = [lang]
  if (geohash) filter['#g'] = [geohash.toLowerCase()]

  filter.authors = resolveAuthorPubkey(author)
  filter.since = calculateSince(timeRange)
  if (until) filter.until = until

  try {
    const eventsSet = await fetchEventsCached(ndk, filter, {
      mode: until ? 'cache-first' : 'parallel',
      relayUrls: getSearchRelayUrls(),
    })

    const rawEvents = Array.from(eventsSet)

    // 1. Aplicar Deduplicação via função isolada
    const uniqueEvents = deduplicateEvents(rawEvents)

    // 2. Validação de existência
    if (uniqueEvents.length === 0 && !until) {
      throw notFound()
    }

    // 3. Filtro por idade do usuário
    const agePref = useUserStore.getState().session?.age
    const ageFiltered = filterEventsByAge(uniqueEvents, agePref)

    // 4. Processamento Final (Ordenação)
    return ageFiltered.sort(sortEventsByImages)
  } catch (error) {
    if (error instanceof Error && error.name === 'NotFoundError') throw error

    throw new VideoSearchError('Erro ao processar busca de vídeos', 'FETCH_ERROR')
  }
}

/**
 * Remove eventos duplicados baseando-se no ID único do Nostr.
 * Opcionalmente, pode-se usar uma tag específica (como 'd' ou 'title')
 * para evitar conteúdo repetido de diferentes IDs.
 */
export function deduplicateEvents(events: NDKEvent[]): NDKEvent[] {
  const seen = new Set<string>()

  return events.filter((event) => {
    // Chave primária: ID do evento
    // Se quiser ser mais rigoroso com vídeos idênticos (re-posts),
    // poderia usar: const key = getTagValues("d", event.tags)[0] || event.id;
    const key = event.id

    if (seen.has(key)) {
      return false
    }
    seen.add(key)
    return true
  })
}
