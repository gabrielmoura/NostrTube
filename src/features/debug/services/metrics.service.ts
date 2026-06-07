import { db } from "@nostr-dev-kit/ndk-cache-dexie";
import type { CacheEventRow } from "./cache.service.ts";

export interface CacheMetrics {
  totalEvents: number;
  eventsByKind: { kind: number; count: number }[];
  eventsByRelay: { relay: string; count: number }[];
  oldestEvent: { id: string; createdAt: number; kind: number } | null;
  newestEvent: { id: string; createdAt: number; kind: number } | null;
  duplicateCount: number;
  profileCount: number;
  eventTagCount: number;
  nip05Count: number;
  lnurlCount: number;
}

export interface StoreSize {
  store: string;
  count: number;
}

export interface StorageQuota {
  usage: number;
  quota: number;
  usagePercent: number;
}

function getDb() {
  if (!db) throw new Error("NDK Dexie cache not initialized");
  return db;
}

let readsInWindow = 0;
let writesInWindow = 0;
let readWindowStart = Date.now();
let writeWindowStart = Date.now();

export function trackRead(): void {
  const now = Date.now();
  if (now - readWindowStart > 60000) {
    readsInWindow = 0;
    readWindowStart = now;
  }
  readsInWindow++;
}

export function trackWrite(): void {
  const now = Date.now();
  if (now - writeWindowStart > 60000) {
    writesInWindow = 0;
    writeWindowStart = now;
  }
  writesInWindow++;
}

export function getReadRate(): number {
  const elapsed = Math.max((Date.now() - readWindowStart) / 1000, 1);
  return readsInWindow / elapsed;
}

export function getWriteRate(): number {
  const elapsed = Math.max((Date.now() - writeWindowStart) / 1000, 1);
  return writesInWindow / elapsed;
}

export async function getCacheMetrics(): Promise<CacheMetrics> {
  const database = getDb();
  const events = await database.table<CacheEventRow>("events").toArray();
  trackRead();

  const eventsByKindMap = new Map<number, number>();
  const eventsByRelayMap = new Map<string, number>();
  let oldest: CacheEventRow | null = null;
  let newest: CacheEventRow | null = null;
  const idSet = new Set<string>();
  let duplicates = 0;

  for (const e of events) {
    eventsByKindMap.set(e.kind, (eventsByKindMap.get(e.kind) ?? 0) + 1);

    if (e.relay) {
      eventsByRelayMap.set(e.relay, (eventsByRelayMap.get(e.relay) ?? 0) + 1);
    }

    if (!oldest || e.createdAt < oldest.createdAt) oldest = e;
    if (!newest || e.createdAt > newest.createdAt) newest = e;

    if (idSet.has(e.id)) duplicates++;
    else idSet.add(e.id);
  }

  const eventsByKind = Array.from(eventsByKindMap.entries())
    .map(([kind, count]) => ({ kind, count }))
    .sort((a, b) => b.count - a.count);

  const eventsByRelay = Array.from(eventsByRelayMap.entries())
    .map(([relay, count]) => ({ relay, count }))
    .sort((a, b) => b.count - a.count);

  const [profileCount, eventTagCount, nip05Count, lnurlCount] = await Promise.all([
    database.table("profiles").count(),
    database.table("eventTags").count(),
    database.table("nip05").count(),
    database.table("lnurl").count(),
  ]);
  trackRead();

  return {
    totalEvents: events.length,
    eventsByKind,
    eventsByRelay,
    oldestEvent: oldest ? { id: oldest.id, createdAt: oldest.createdAt, kind: oldest.kind } : null,
    newestEvent: newest ? { id: newest.id, createdAt: newest.createdAt, kind: newest.kind } : null,
    duplicateCount: duplicates,
    profileCount,
    eventTagCount,
    nip05Count,
    lnurlCount,
  };
}

export async function getStorageQuota(): Promise<StorageQuota | null> {
  if (!navigator.storage?.estimate) return null;
  trackRead();
  const estimate = await navigator.storage.estimate();
  const usage = estimate.usage ?? 0;
  const quota = estimate.quota ?? 1;
  return {
    usage,
    quota,
    usagePercent: Math.round((usage / quota) * 100),
  };
}

export async function getAllStoreSizes(): Promise<StoreSize[]> {
  const database = getDb();
  const stores = ["events", "profiles", "eventTags", "nip05", "lnurl", "relayStatus", "unpublishedEvents"];
  const sizes = await Promise.all(
    stores.map(async (store) => {
      const count = await database.table(store).count();
      return { store, count };
    }),
  );
  trackRead();
  return sizes;
}
