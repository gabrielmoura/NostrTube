import NDK, { giftWrap, type NDKEvent, NDKKind, NDKRelaySet, NDKUser } from "@nostr-dev-kit/ndk";
import { CacheModuleStorage, type NDKMessage, NDKMessenger } from "@nostr-dev-kit/messages";
import { FEEDBACK_DEV_RELAYS } from "@/config/feedback.const.ts";

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

export async function resolveMessageRecipient(ndk: NDK, lookup: string, pubkeyFallback?: string): Promise<NDKUser> {
  const fetchedUser = await ndk.fetchUser(lookup).catch(() => undefined);
  if (fetchedUser) return fetchedUser;

  if (pubkeyFallback) {
    return ndk.getUser({ pubkey: pubkeyFallback }) || new NDKUser({ pubkey: pubkeyFallback });
  }

  throw new Error("Could not resolve Nostr recipient for private message.");
}

export async function sendPrivateMessage(
  ndk: NDK,
  recipientLookup: string,
  content: string,
  pubkeyFallback?: string
): Promise<NDKMessage> {
  const messenger = await getNdkMessenger(ndk);
  if (!messenger) {
    throw new Error("Messenger is not ready for the current user session");
  }

  const recipient = await resolveMessageRecipient(ndk, recipientLookup, pubkeyFallback);
  return messenger.sendMessage(recipient, content);
}

async function getPreferredDmRelays(ndk: NDK, pubkey: string): Promise<string[]> {
  try {
    const dmRelayList = await ndk.fetchEvent({
      kinds: [NDKKind.DirectMessageReceiveRelayList],
      authors: [pubkey]
    });

    if (dmRelayList) {
      const relays = dmRelayList.getMatchingTags("relay").map((tag) => tag[1]).filter(Boolean);
      if (relays.length > 0) return relays;
    }

    const relayList = await ndk.fetchEvent({
      kinds: [10002],
      authors: [pubkey]
    });

    if (relayList) {
      const relays = relayList.getMatchingTags("r").map((tag) => tag[1]).filter(Boolean);
      if (relays.length > 0) return relays.slice(0, 3);
    }

    return [];
  } catch {
    return [];
  }
}

export async function sendPrivateMessageEvent(
  ndk: NDK,
  recipientLookup: string,
  event: NDKEvent,
  pubkeyFallback?: string
): Promise<{
  wrappedEvent: NDKEvent;
  rumorEvent: NDKEvent;
  recipient: NDKUser;
  publishedRelays: Set<import("@nostr-dev-kit/ndk").NDKRelay>
}> {
  if (!ndk.signer) {
    throw new Error("No signer available for private message delivery.");
  }

  const recipient = await resolveMessageRecipient(ndk, recipientLookup, pubkeyFallback);
  const wrappedEvent = await giftWrap(event, recipient, ndk.signer);
  const sender = await ndk.signer.user();

  const recipientRelays = await getPreferredDmRelays(ndk, recipient.pubkey);
  const senderRelays = await getPreferredDmRelays(ndk, sender.pubkey);
  const baseRelays = [...recipientRelays, ...senderRelays];

  if (import.meta.env.DEV) {
    baseRelays.push(...FEEDBACK_DEV_RELAYS);
  }

  const allRelays = [...new Set(baseRelays)];

  let publishedRelays: Set<import("@nostr-dev-kit/ndk").NDKRelay>;

  if (allRelays.length > 0) {
    const relaySet = NDKRelaySet.fromRelayUrls(allRelays, ndk);
    publishedRelays = await wrappedEvent.publish(relaySet);
  } else {
    publishedRelays = await wrappedEvent.publish();
  }

  return {
    wrappedEvent,
    rumorEvent: event,
    recipient,
    publishedRelays
  };
}

export async function sendTechnicalIssueMessage(ndk: NDK, authorPubkey: string, content: string) {
  return sendPrivateMessage(ndk, authorPubkey, content, authorPubkey);
}
