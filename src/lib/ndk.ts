import NDK, { NDKPool, NDKRelay } from "@nostr-dev-kit/ndk";
import NDKCacheAdapterDexie from "@nostr-dev-kit/ndk-cache-dexie";
import { NDKSessionLocalStorage } from "@nostr-dev-kit/ndk-hooks";

// 1. Worker Initialization
const sigWorker = new Worker(
  new URL("@nostr-dev-kit/ndk/workers/sig-verification?worker", import.meta.url),
  { type: "module" }
);

// 2. Cache Adapter
let cacheAdapter: NDKCacheAdapterDexie | undefined;
if (typeof window !== "undefined") {
  cacheAdapter = new NDKCacheAdapterDexie({ dbName: import.meta.env.VITE_APP_NAME });
}

// 3. Relays Configuration
const relays = import.meta.env.PROD
  ? import.meta.env.VITE_NOSTR_RELAYS
  : import.meta.env.VITE_NOSTR_DEV_RELAYS;

export function normalizeRelayUrls(relayUrls: string[] = []): string[] {
  return Array.from(new Set(relayUrls.filter((relay) => relay.startsWith("ws://") || relay.startsWith("wss://"))));
}

// 4. NDK Instance
export const ndkInstance = new NDK({
  clientName: import.meta.env.VITE_APP_NAME,
  cacheAdapter: cacheAdapter,
  signatureVerificationWorker: sigWorker,
  autoConnectUserRelays: import.meta.env.PROD,
  clientNip89: import.meta.env.VITE_APP_NAME
});

// 5. Pool Setup
const pool = new NDKPool(normalizeRelayUrls(relays), [], ndkInstance);
ndkInstance.pool = pool;

// 6. Connect (Client-side only)
if (typeof window !== "undefined") {
  ndkInstance.connect();
}

// 7. Session Storage
export const sessionStorage = new NDKSessionLocalStorage();

export function syncNdkRelayPool(relayUrls: string[]) {
  const normalized = normalizeRelayUrls(relayUrls);
  const existingRelayUrls = new Set(Array.from(ndkInstance.pool.relays.keys()));

  for (const relayUrl of existingRelayUrls) {
    if (!normalized.includes(relayUrl)) {
      ndkInstance.pool.removeRelay(relayUrl);
    }
  }

  normalized.forEach((relayUrl) => {
    if (!existingRelayUrls.has(relayUrl)) {
      ndkInstance.pool.addRelay(new NDKRelay(relayUrl, undefined, ndkInstance), true);
    }
  });
}
