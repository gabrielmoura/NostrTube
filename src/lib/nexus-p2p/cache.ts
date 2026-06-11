import { db as ndkDexieDb } from '@nostr-dev-kit/ndk-cache-dexie'
import { type DBSchema, type IDBPDatabase, openDB } from 'idb'
import type { NexusEventSummary, NostrEventLike } from '@/lib/nexus-p2p/types'

interface NexusEventRecord extends NostrEventLike {
  cachedAt: number
}

interface NdkCacheEventRow {
  id: string
  pubkey: string
  kind: number
  createdAt: number
  relay?: string
  event: string
  sig?: string
}

interface NexusCacheDatabase extends DBSchema {
  events: {
    key: string
    value: NexusEventRecord
  }
}

export class NexusEventCache {
  private dbPromise: Promise<IDBPDatabase<NexusCacheDatabase>> | null = null
  private readonly storeName = 'events' as const

  constructor(
    private readonly dbName: string,
    private readonly ttlMs: number,
  ) {}

  getStorageBackend() {
    return ndkDexieDb ? 'ndk-dexie' : 'nexus-idb-fallback'
  }

  isUnifiedWithNdkCache() {
    return Boolean(ndkDexieDb)
  }

  async put(event: NostrEventLike) {
    const ndkTable = this.getNdkTable()
    if (ndkTable) {
      await ndkTable.put(this.toNdkRow(event))
      return
    }

    const db = await this.getDatabase()
    await db.put(this.storeName, { ...event, cachedAt: Date.now() })
  }

  async putMany(events: Iterable<NostrEventLike>) {
    const normalized = [...events]
    const ndkTable = this.getNdkTable()
    if (ndkTable) {
      await ndkTable.bulkPut(normalized.map((event) => this.toNdkRow(event)))
      return
    }

    const db = await this.getDatabase()
    const tx = db.transaction(this.storeName, 'readwrite')

    for (const event of normalized) {
      await tx.store.put({ ...event, cachedAt: Date.now() })
    }

    await tx.done
  }

  async get(eventId: string): Promise<NostrEventLike | null> {
    const ndkTable = this.getNdkTable()
    if (ndkTable) {
      const direct = await ndkTable.get(eventId)
      const directEvent = this.fromNdkRow(direct)
      if (directEvent?.id === eventId) return directEvent
      return this.findRawEventById(eventId)
    }

    const db = await this.getDatabase()
    const record = await db.get(this.storeName, eventId)

    if (!record) return null
    if (Date.now() - record.cachedAt > this.ttlMs) {
      await db.delete(this.storeName, eventId)
      return null
    }

    return this.stripCacheMetadata(record)
  }

  async getMany(eventIds: string[]): Promise<Map<string, NostrEventLike>> {
    const results = new Map<string, NostrEventLike>()
    await Promise.all(
      eventIds.map(async (eventId) => {
        const event = await this.get(eventId)
        if (event) results.set(eventId, event)
      }),
    )
    return results
  }

  async listRecentSummaries(since = 0, limit = 200): Promise<NexusEventSummary[]> {
    const ndkTable = this.getNdkTable()
    if (ndkTable) {
      const rows = await ndkTable.toArray()
      return rows
        .map((row) => this.fromNdkRow(row))
        .filter((event): event is NostrEventLike => Boolean(event && event.created_at > since))
        .sort((left, right) => (right.created_at || 0) - (left.created_at || 0))
        .slice(0, limit)
        .map((event) => ({
          id: event.id,
          pubkey: event.pubkey || '',
          kind: event.kind || 0,
          created_at: event.created_at || 0,
        }))
    }

    const db = await this.getDatabase()
    const all = await db.getAll(this.storeName)

    return all
      .filter((record) => Date.now() - record.cachedAt <= this.ttlMs && record.cachedAt > since)
      .sort((left, right) => (right.created_at || 0) - (left.created_at || 0))
      .slice(0, limit)
      .map((record) => ({
        id: record.id,
        pubkey: record.pubkey || '',
        kind: record.kind || 0,
        created_at: record.created_at || 0,
      }))
  }

  private async getDatabase() {
    this.dbPromise ??= openDB<NexusCacheDatabase>(this.dbName, 1, {
      upgrade: (db) => {
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'id' })
        }
      },
    })

    return this.dbPromise
  }

  private getNdkTable() {
    return ndkDexieDb?.table<NdkCacheEventRow>('events')
  }

  private fromNdkRow(record: NdkCacheEventRow | undefined): NostrEventLike | null {
    if (!record) return null

    try {
      const parsed = JSON.parse(record.event) as Partial<NostrEventLike>
      if (!parsed.id || !parsed.pubkey || typeof parsed.kind !== 'number' || typeof parsed.created_at !== 'number') {
        return null
      }

      return {
        id: parsed.id,
        pubkey: parsed.pubkey,
        kind: parsed.kind,
        created_at: parsed.created_at,
        tags: Array.isArray(parsed.tags) ? parsed.tags : [],
        content: typeof parsed.content === 'string' ? parsed.content : '',
        sig: typeof parsed.sig === 'string' ? parsed.sig : record.sig || '',
      }
    } catch {
      return null
    }
  }

  private async findRawEventById(eventId: string): Promise<NostrEventLike | null> {
    const ndkTable = this.getNdkTable()
    if (!ndkTable) return null

    const rows = await ndkTable.toArray()
    for (const row of rows) {
      const event = this.fromNdkRow(row)
      if (event?.id === eventId) return event
    }

    return null
  }

  private toNdkRow(event: NostrEventLike): NdkCacheEventRow {
    return {
      id: event.id,
      pubkey: event.pubkey,
      kind: event.kind,
      createdAt: event.created_at,
      event: JSON.stringify(event),
      sig: event.sig,
    }
  }

  private stripCacheMetadata(record: NexusEventRecord): NostrEventLike {
    const { cachedAt: _cachedAt, ...event } = record
    return event
  }
}
