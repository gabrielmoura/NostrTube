import type { HashedEvent, OwnedEvent } from "@welshman/util";
import { getTag } from "@welshman/util";
import { NDKEvent } from "@nostr-dev-kit/ndk-hooks";
import NDK__default from "@nostr-dev-kit/ndk";
import { LoggerAgent } from "@/lib/debug.ts";
import { powManager } from "./pow-manager";

const log = LoggerAgent.create("POW");

export interface makeEventParams {
  event: OwnedEvent;
  difficulty?: number;
  ndk: NDK__default;
}

export async function makeEvent({ ndk, event, difficulty }: makeEventParams): Promise<NDKEvent> {
  let preEvent: OwnedEvent;

  event.tags.push([
    "client",
    import.meta.env.VITE_APP_NAME || "NostrTube",
    "31990:acbf4bb4141163d7fa034b8d4fdcd5bd002916122739150fa1456511c1b4ff76"
  ]);

  if (difficulty && difficulty > 0) {
    try {
      preEvent = await powManager.calculate(event, difficulty);
      log.debug("POW generated successfully", { difficulty, id: preEvent.id });
    } catch (error) {
      log.error("Failed to generate POW", error);
      throw error;
    }
  } else {
    preEvent = event;
  }

  const evt = new NDKEvent(ndk, { ...preEvent });
  await evt.sign();
  return evt;
}

export const getPow = (event: HashedEvent): number => {
  const tag = getTag("nonce", event.tags)!;
  const difficulty = parseInt(tag[2]);

  if (isNaN(difficulty)) return 0;

  let count = 0;

  // Convert hex string to array of bytes
  for (let i = 0; i < event.id.length; i += 2) {
    const byte = parseInt(event.id.slice(i, i + 2), 16);
    if (byte === 0) {
      count += 8;
    } else {
      count += Math.clz32(byte) - 24;
      break;
    }
  }

  return count >= difficulty ? difficulty : 0;
};