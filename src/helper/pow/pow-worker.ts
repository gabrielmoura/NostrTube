import { createSHA256 } from "hash-wasm";
import { bytesToHex } from "@welshman/util/dist/lib/src";
import type { HashedEvent } from "@welshman/util";

interface PowRequest {
  taskId: string;
  event: Partial<HashedEvent>;
  difficulty: number;
}

function getPow(id: Uint8Array): number {
  let count = 0;
  for (let i = 0; i < 32; i++) {
    const byte = id[i];
    if (byte === 0) count += 8;
    else {
      count += Math.clz32(byte) - 24;
      break;
    }
  }
  return count;
}

self.addEventListener("message", async (ev: MessageEvent<PowRequest>) => {
  const { taskId, event, difficulty } = ev.data;

  try {
    let count = 0;
    const tag = ["nonce", "0", String(difficulty)];

    if (!event.tags) event.tags = [];
    event.tags.push(tag);

    const hasher = await createSHA256();
    const serializedBase = [0, event.pubkey, event.created_at, event.kind, event.tags, event.content];

    while (true) {
      tag[1] = count.toString();

      hasher.init();
      hasher.update(JSON.stringify(serializedBase));

      const id = hasher.digest("binary");
      if (getPow(id) >= difficulty) {
        event.id = bytesToHex(id);
        break;
      }
      count++;
    }

    self.postMessage({ taskId, event });
  } catch (error: any) {
    self.postMessage({ taskId, error: error.message });
  }
});