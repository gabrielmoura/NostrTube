import type NDK from '@nostr-dev-kit/ndk'
import { NDKKind, type NDKEvent, type NDKFilter } from '@nostr-dev-kit/ndk'
import { nip19 } from 'nostr-tools'
import { fetchEventsCached, getSearchRelayUrls } from '@/features/nostr/services/ndk-query.service'
import { VIDEO_EVENT_KINDS } from '@/features/video/services/video-kinds'

const ZAP_RECEIPT_KIND = 9735 as never
const DAYS = {
  seven: 7,
  thirty: 30,
  ninety: 90,
} as const

type TimeRangeKey = keyof typeof DAYS

export interface ZapActivityItem {
  id: string
  direction: 'received' | 'sent'
  targetType: 'video' | 'playlist' | 'profile' | 'event'
  targetRef: string | null
  targetLabel: string
  amountSats: number | null
  message: string | null
  senderPubkey: string | null
  recipientPubkey: string | null
  createdAt: number
  status: 'confirmed'
}

export interface ZapSupporterSummary {
  pubkey: string
  amountSats: number
  zapCount: number
}

export interface ZapStatsData {
  received30d: number | null
  sent30d: number | null
  supportedCreatorsCount: number | null
  averageZapSats: number | null
  bestVideo: { targetRef: string; amountSats: number } | null
  topSupporters: ZapSupporterSummary[]
  timeSeries: Record<TimeRangeKey, { label: string; received: number; sent: number }[]>
  activity: ZapActivityItem[]
}

interface ParsedZapReceipt {
  event: NDKEvent
  amountSats: number | null
  senderPubkey: string | null
  recipientPubkey: string | null
  message: string | null
  targetType: ZapActivityItem['targetType']
  targetRef: string | null
  createdAt: number
}

function parseAmountSats(event: NDKEvent) {
  const directAmount = event.tagValue('amount')
  const parsedDirectAmount = directAmount ? Number.parseInt(directAmount, 10) : Number.NaN
  if (!Number.isNaN(parsedDirectAmount) && parsedDirectAmount > 0) {
    return Math.floor(parsedDirectAmount / 1000)
  }

  const description = event.tagValue('description')
  if (!description) return null

  try {
    const parsedDescription = JSON.parse(description) as { tags?: string[][] }
    const amountTag = parsedDescription.tags?.find((tag) => tag[0] === 'amount')?.[1]
    const parsedAmount = amountTag ? Number.parseInt(amountTag, 10) : Number.NaN
    return !Number.isNaN(parsedAmount) && parsedAmount > 0 ? Math.floor(parsedAmount / 1000) : null
  } catch {
    return null
  }
}

function parseDescriptionPayload(event: NDKEvent) {
  const description = event.tagValue('description')
  if (!description) return null

  try {
    return JSON.parse(description) as {
      pubkey?: string
      content?: string
      tags?: string[][]
    }
  } catch {
    return null
  }
}

function normalizeTargetReference(reference: string) {
  if (reference.startsWith('n')) return reference
  if (reference.length === 64) {
    return nip19.noteEncode(reference)
  }
  return reference
}

function classifyATag(aTag: string) {
  const [kindString, pubkey, identifier] = aTag.split(':')
  const kind = Number.parseInt(kindString, 10)
  if (VIDEO_EVENT_KINDS.includes(kind)) {
    return {
      targetType: 'video' as const,
      targetRef: aTag,
      targetLabel: identifier ? `Vídeo ${identifier}` : `Vídeo de ${pubkey?.slice(0, 8) ?? 'autor'}`,
    }
  }

  if (kind === NDKKind.VideoCurationSet) {
    return {
      targetType: 'playlist' as const,
      targetRef: aTag,
      targetLabel: identifier ? `Playlist ${identifier}` : 'Playlist',
    }
  }

  return {
    targetType: 'event' as const,
    targetRef: aTag,
    targetLabel: identifier ? `Evento ${identifier}` : 'Evento endereçável',
  }
}

function inferTarget(event: NDKEvent, payload: ReturnType<typeof parseDescriptionPayload>) {
  const payloadTags = payload?.tags ?? []
  const allTags = [...event.tags, ...payloadTags]

  const aTag = allTags.find((tag) => tag[0] === 'a')?.[1]
  if (aTag) {
    return classifyATag(aTag)
  }

  const eTag = allTags.find((tag) => tag[0] === 'e')?.[1]
  if (eTag) {
    return {
      targetType: 'video' as const,
      targetRef: eTag,
      targetLabel: `Evento ${eTag.slice(0, 8)}…`,
    }
  }

  const pTag = event.tagValue('p') || payloadTags.find((tag) => tag[0] === 'p')?.[1]
  if (pTag) {
    return {
      targetType: 'profile' as const,
      targetRef: pTag,
      targetLabel: `Perfil ${pTag.slice(0, 8)}…`,
    }
  }

  return {
    targetType: 'event' as const,
    targetRef: null,
    targetLabel: 'Conteúdo Nostr',
  }
}

function parseZapReceipt(event: NDKEvent): ParsedZapReceipt {
  const payload = parseDescriptionPayload(event)
  const target = inferTarget(event, payload)

  return {
    event,
    amountSats: parseAmountSats(event),
    senderPubkey: payload?.pubkey ?? null,
    recipientPubkey: event.tagValue('p') || payload?.tags?.find((tag) => tag[0] === 'p')?.[1] || null,
    message: payload?.content?.trim() || null,
    targetType: target.targetType,
    targetRef: target.targetRef ? normalizeTargetReference(target.targetRef) : null,
    createdAt: event.created_at ?? 0,
  }
}

function startOfDayUnix(date: Date) {
  const day = new Date(date)
  day.setHours(0, 0, 0, 0)
  return Math.floor(day.getTime() / 1000)
}

function buildSeries(activity: ZapActivityItem[], range: TimeRangeKey) {
  const days = DAYS[range]
  const entries = Array.from({ length: days }).map((_, index) => {
    const day = new Date()
    day.setDate(day.getDate() - (days - index - 1))
    day.setHours(0, 0, 0, 0)
    return {
      key: Math.floor(day.getTime() / 1000),
      label: day.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      received: 0,
      sent: 0,
    }
  })

  const byDay = new Map(entries.map((entry) => [entry.key, entry]))

  activity.forEach((item) => {
    const dayKey = startOfDayUnix(new Date(item.createdAt * 1000))
    const bucket = byDay.get(dayKey)
    if (!bucket) return
    const amount = item.amountSats ?? 0
    if (item.direction === 'received') bucket.received += amount
    else bucket.sent += amount
  })

  return entries.map(({ key: _key, ...entry }) => entry)
}

function filterWithinDays<T extends { createdAt: number }>(items: T[], days: number) {
  const cutoff = Math.floor(Date.now() / 1000) - days * 24 * 60 * 60
  return items.filter((item) => item.createdAt >= cutoff)
}

async function fetchZapReceipts(ndk: NDK, filters: NDKFilter | NDKFilter[]) {
  return Array.from(
    await fetchEventsCached(ndk, filters, {
      mode: 'parallel',
      closeOnEose: true,
      relayUrls: getSearchRelayUrls(),
    }),
  )
}

export async function loadZapDashboard(ndk: NDK, currentPubkey: string): Promise<ZapStatsData> {
  const since90d = Math.floor(Date.now() / 1000) - DAYS.ninety * 24 * 60 * 60

  const receivedFilters: NDKFilter = {
    kinds: [ZAP_RECEIPT_KIND],
    '#p': [currentPubkey],
    since: since90d,
    limit: 300,
  }

  const sentDetectionFilters: NDKFilter = {
    kinds: [ZAP_RECEIPT_KIND],
    since: since90d,
    limit: 500,
  }

  const [receivedEvents, broadReceiptEvents] = await Promise.all([
    fetchZapReceipts(ndk, receivedFilters),
    fetchZapReceipts(ndk, sentDetectionFilters),
  ])

  const receivedParsed = receivedEvents.map(parseZapReceipt)
  const sentParsed = broadReceiptEvents.map(parseZapReceipt).filter((receipt) => receipt.senderPubkey === currentPubkey)

  const receivedActivity: ZapActivityItem[] = receivedParsed.map((receipt) => ({
    id: receipt.event.id,
    direction: 'received',
    targetType: receipt.targetType,
    targetRef: receipt.targetRef,
    targetLabel: inferTarget(receipt.event, parseDescriptionPayload(receipt.event)).targetLabel,
    amountSats: receipt.amountSats,
    message: receipt.message,
    senderPubkey: receipt.senderPubkey,
    recipientPubkey: receipt.recipientPubkey,
    createdAt: receipt.createdAt,
    status: 'confirmed',
  }))

  const sentActivity: ZapActivityItem[] = sentParsed.map((receipt) => ({
    id: `sent-${receipt.event.id}`,
    direction: 'sent',
    targetType: receipt.targetType,
    targetRef: receipt.targetRef,
    targetLabel: inferTarget(receipt.event, parseDescriptionPayload(receipt.event)).targetLabel,
    amountSats: receipt.amountSats,
    message: receipt.message,
    senderPubkey: receipt.senderPubkey,
    recipientPubkey: receipt.recipientPubkey,
    createdAt: receipt.createdAt,
    status: 'confirmed',
  }))

  const activity = [...receivedActivity, ...sentActivity].sort((left, right) => right.createdAt - left.createdAt)

  const received30dItems = filterWithinDays(receivedActivity, DAYS.thirty)
  const sent30dItems = filterWithinDays(sentActivity, DAYS.thirty)
  const combined30d = [...received30dItems, ...sent30dItems]

  const bestVideoMap = new Map<string, number>()
  receivedActivity.forEach((item) => {
    if (item.targetType !== 'video' || !item.targetRef || !item.amountSats) return
    bestVideoMap.set(item.targetRef, (bestVideoMap.get(item.targetRef) ?? 0) + item.amountSats)
  })

  const bestVideoEntry = Array.from(bestVideoMap.entries()).sort((left, right) => right[1] - left[1])[0]

  const supporterMap = new Map<string, ZapSupporterSummary>()
  receivedActivity.forEach((item) => {
    if (!item.senderPubkey || !item.amountSats) return
    const current = supporterMap.get(item.senderPubkey) ?? { pubkey: item.senderPubkey, amountSats: 0, zapCount: 0 }
    current.amountSats += item.amountSats
    current.zapCount += 1
    supporterMap.set(item.senderPubkey, current)
  })

  const supportedCreators = new Set(sentActivity.map((item) => item.recipientPubkey).filter((value): value is string => Boolean(value)))

  return {
    received30d: received30dItems.length > 0 ? received30dItems.reduce((sum, item) => sum + (item.amountSats ?? 0), 0) : null,
    sent30d: sent30dItems.length > 0 ? sent30dItems.reduce((sum, item) => sum + (item.amountSats ?? 0), 0) : null,
    supportedCreatorsCount: supportedCreators.size > 0 ? supportedCreators.size : null,
    averageZapSats: combined30d.length > 0 ? Math.round(combined30d.reduce((sum, item) => sum + (item.amountSats ?? 0), 0) / combined30d.length) : null,
    bestVideo: bestVideoEntry ? { targetRef: bestVideoEntry[0], amountSats: bestVideoEntry[1] } : null,
    topSupporters: Array.from(supporterMap.values()).sort((left, right) => right.amountSats - left.amountSats).slice(0, 5),
    timeSeries: {
      seven: buildSeries(activity, 'seven'),
      thirty: buildSeries(activity, 'thirty'),
      ninety: buildSeries(activity, 'ninety'),
    },
    activity: activity.slice(0, 50),
  }
}
