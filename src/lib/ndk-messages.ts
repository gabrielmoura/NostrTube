import NDK, { NDKUser } from "@nostr-dev-kit/ndk";
import { CacheModuleStorage, NDKMessenger } from "@nostr-dev-kit/messages";

const messengers = new Map<string, NDKMessenger>();

export async function getNdkMessenger(ndk: NDK): Promise<NDKMessenger | null> {
  const myPubkey = ndk.activeUser?.pubkey;
  const signer = ndk.signer;
  const cacheAdapter = ndk.cacheAdapter;

  if (!myPubkey || !signer || !cacheAdapter) {
    return null;
  }

  const cacheKey = `${myPubkey}:${ndk.clientName || "ndk"}`;
  const existing = messengers.get(cacheKey);
  if (existing) {
    return existing;
  }

  const storage = new CacheModuleStorage(cacheAdapter, myPubkey);
  const messenger = new NDKMessenger(ndk, {
    storage,
    autoStart: false
  });

  messengers.set(cacheKey, messenger);
  return messenger;
}

export async function startNdkMessenger(ndk: NDK): Promise<void> {
  const messenger = await getNdkMessenger(ndk);
  if (!messenger) return;
  await messenger.start();
}

export async function publishDmRelayList(ndk: NDK, relays: string[]): Promise<void> {
  const messenger = await getNdkMessenger(ndk);
  if (!messenger) {
    throw new Error("Messenger is not ready for the current user session");
  }

  await messenger.publishDMRelays(relays);
}

export async function sendTechnicalIssueMessage(ndk: NDK, authorPubkey: string, content: string) {
  const messenger = await getNdkMessenger(ndk);
  if (!messenger) {
    throw new Error("Messenger is not ready for the current user session");
  }

  const recipient = ndk.getUser({ pubkey: authorPubkey }) || new NDKUser({ pubkey: authorPubkey });
  return messenger.sendMessage(recipient, content);
}
