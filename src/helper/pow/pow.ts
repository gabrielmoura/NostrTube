import type { HashedEvent, OwnedEvent } from "@welshman/util";
import { getTag } from "@welshman/util";
import { NDKEvent } from "@nostr-dev-kit/ndk-hooks";
import NDK from "@nostr-dev-kit/ndk";
import { logger, powManager } from "./pow-manager";


export interface MakeEventParams {
  event: OwnedEvent;
  difficulty?: number;
  ndk: NDK;
}

export async function makeEvent({ ndk, event, difficulty }: MakeEventParams): Promise<NDKEvent> {
  // Injeta tag do cliente
  event.tags.push([
    "client",
    import.meta.env.VITE_APP_NAME || "NostrTube",
    "31990:acbf4bb4141163d7fa034b8d4fdcd5bd002916122739150fa1456511c1b4ff76"
  ]);

  let finalEvent: OwnedEvent = event;

  if (difficulty && difficulty > 0) {
    try {
      logger.debug("Starting POW calculation", { difficulty });
      finalEvent = await powManager.calculate(event, difficulty);
      logger.info("POW generated", { id: finalEvent.id });
    } catch (error) {
      logger.error("POW failed", error);
      throw error;
    }
  }

  const evt = new NDKEvent(ndk, finalEvent);
  await evt.sign();
  return evt;
}

export const getPow = (event: HashedEvent): number => {
  const tag = getTag("nonce", event.tags);
  if (!tag) return 0;

  const targetDifficulty = parseInt(tag[2]);
  if (isNaN(targetDifficulty)) return 0;

  let count = 0;
  for (let i = 0; i < event.id.length; i += 2) {
    const byte = parseInt(event.id.slice(i, i + 2), 16);
    if (byte === 0) count += 8;
    else {
      count += Math.clz32(byte) - 24;
      break;
    }
  }

  return count >= targetDifficulty ? targetDifficulty : 0;
};