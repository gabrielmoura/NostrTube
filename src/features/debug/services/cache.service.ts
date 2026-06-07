import { db } from "@nostr-dev-kit/ndk-cache-dexie";

export interface CacheEventRow {
  id: string;
  pubkey: string;
  kind: number;
  createdAt: number;
  relay?: string;
  event: string;
  sig?: string;
}

export interface CacheFilters {
  kind?: number | null;
  pubkey?: string;
  relay?: string;
  since?: number | null;
  until?: number | null;
}

function getDb() {
  if (!db) throw new Error("NDK Dexie cache not initialized");
  return db;
}

export async function getEvents(filters: CacheFilters): Promise<CacheEventRow[]> {
  const database = getDb();
  const table = database.table<CacheEventRow>("events");
  let rows: CacheEventRow[];

  if (filters.kind !== undefined && filters.kind !== null) {
    rows = await table.where("kind").equals(filters.kind).toArray();
  } else {
    rows = await table.toArray();
  }

  return rows.filter((r) => {
    if (filters.pubkey && r.pubkey !== filters.pubkey) return false;
    if (filters.relay && r.relay !== filters.relay) return false;
    if (filters.since !== undefined && filters.since !== null && r.createdAt < filters.since) return false;
    if (filters.until !== undefined && filters.until !== null && r.createdAt > filters.until) return false;
    return true;
  });
}

export async function getEventCount(): Promise<number> {
  return getDb().table("events").count();
}

export async function getDistinctKinds(): Promise<number[]> {
  const rows = await getDb().table<CacheEventRow>("events").toArray();
  return Array.from(new Set(rows.map((r) => r.kind))).sort((a, b) => a - b);
}

export async function getDistinctPubkeys(): Promise<string[]> {
  const rows = await getDb().table<CacheEventRow>("events").toArray();
  return Array.from(new Set(rows.map((r) => r.pubkey)));
}

export async function getDistinctRelays(): Promise<string[]> {
  const rows = await getDb().table<CacheEventRow>("events").toArray();
  const relays = new Set<string>();
  rows.forEach((r) => {
    if (r.relay) relays.add(r.relay);
  });
  return Array.from(relays).sort();
}

function parseEvent(eventRow: CacheEventRow): Record<string, unknown> | null {
  try {
    return JSON.parse(eventRow.event);
  } catch {
    return null;
  }
}

export function eventToExport(eventRow: CacheEventRow): Record<string, unknown> {
  const parsed = parseEvent(eventRow);
  return {
    id: eventRow.id,
    pubkey: eventRow.pubkey,
    created_at: eventRow.createdAt,
    kind: eventRow.kind,
    tags: parsed?.tags ?? [],
    content: parsed?.content ?? "",
    sig: eventRow.sig ?? parsed?.sig ?? "",
  };
}

export function exportJSON(events: CacheEventRow[]): string {
  return JSON.stringify(events.map(eventToExport), null, 2);
}

export function exportJSONL(events: CacheEventRow[]): string {
  return events.map((e) => JSON.stringify(eventToExport(e))).join("\n");
}

export function exportCSV(events: CacheEventRow[]): string {
  const header = "id,kind,pubkey,created_at,relay,size_bytes";
  const rows = events.map((e) => {
    const size = new Blob([e.event]).size;
    return `${e.id},${e.kind},${e.pubkey},${e.createdAt},${e.relay ?? ""},${size}`;
  });
  return [header, ...rows].join("\n");
}

export function estimateExportSize(events: CacheEventRow[], format: "json" | "jsonl" | "csv"): number {
  let str: string;
  if (format === "json") str = exportJSON(events);
  else if (format === "jsonl") str = exportJSONL(events);
  else str = exportCSV(events);
  return new Blob([str]).size;
}

export async function deleteEventsByKind(kind: number): Promise<number> {
  const database = getDb();
  const rows = await database.table<CacheEventRow>("events").where("kind").equals(kind).toArray();
  const ids = rows.map((r) => r.id);
  await database.table("events").bulkDelete(ids);
  return ids.length;
}

export async function deleteAllEvents(): Promise<number> {
  const database = getDb();
  const count = await database.table("events").count();
  await database.table("events").clear();
  return count;
}

export async function clearProfiles(): Promise<number> {
  const database = getDb();
  const count = await database.table("profiles").count();
  await database.table("profiles").clear();
  return count;
}

export async function clearNip05Cache(): Promise<number> {
  const database = getDb();
  const count = await database.table("nip05").count();
  await database.table("nip05").clear();
  return count;
}

export async function clearEventTags(): Promise<number> {
  const database = getDb();
  const count = await database.table("eventTags").count();
  await database.table("eventTags").clear();
  return count;
}

export async function clearAllIndexedDB(): Promise<{
  events: number;
  profiles: number;
  eventTags: number;
  nip05: number;
  lnurl: number;
}> {
  const database = getDb();
  const [events, profiles, eventTags, nip05, lnurl] = await Promise.all([
    database.table("events").count(),
    database.table("profiles").count(),
    database.table("eventTags").count(),
    database.table("nip05").count(),
    database.table("lnurl").count(),
  ]);
  await Promise.all([
    database.table("events").clear(),
    database.table("profiles").clear(),
    database.table("eventTags").clear(),
    database.table("nip05").clear(),
    database.table("lnurl").clear(),
    database.table("relayStatus").clear(),
    database.table("unpublishedEvents").clear(),
  ]);
  return { events, profiles, eventTags, nip05, lnurl };
}

export async function clearServiceWorkerCache(): Promise<number> {
  const keys = await caches.keys();
  let total = 0;
  for (const key of keys) {
    if (key.startsWith("ndk") || key.startsWith("nostrtube") || key.includes("workbox")) {
      await caches.delete(key);
      total++;
    }
  }
  return total;
}

export async function clearMediaCache(): Promise<number> {
  const keys = await caches.keys();
  let cleared = 0;
  for (const key of keys) {
    if (key.includes("blob") || key.includes("media") || key.includes("image") || key.includes("thumbnail")) {
      await caches.delete(key);
      cleared++;
    }
  }
  return cleared;
}
