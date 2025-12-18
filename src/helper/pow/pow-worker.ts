import { createSHA256 } from "hash-wasm";
import { bytesToHex } from "@welshman/util/dist/lib/src";
import type { HashedEvent } from "@welshman/util";

interface PowRequest {
    taskId: string;
    event: Partial<HashedEvent>;
    difficulty: number;
    start?: number;
    step?: number;
}

function getPow(id: Uint8Array): number {
    let count = 0;
    for (let i = 0; i < 32; i++) {
        const nibble = id[i];
        if (nibble === 0) count += 8;
        else {
            count += Math.clz32(nibble) - 24;
            break;
        }
    }
    return count;
}

self.addEventListener('message', async function (ev: MessageEvent<PowRequest>) {
    const { taskId, event, difficulty, start = 0, step = 1 } = ev.data;

    try {
        let count = start;
        const tag = ["nonce", count.toString(), String(difficulty)];

        if (!event.tags) event.tags = [];
        event.tags.push(tag);

        const hasher = await createSHA256();

        while (true) {
            count += step;
            tag[1] = count.toString();

            hasher.init();
            hasher.update(
              JSON.stringify([0, event.pubkey, event.created_at, event.kind, event.tags, event.content]),
            );

            const id = hasher.digest("binary");
            const pow = getPow(id);

            if (pow >= difficulty) {
                event.id = bytesToHex(id);
                break;
            }
        }

        self.postMessage({ taskId, event });
    } catch (error: any) {
        self.postMessage({ taskId, error: error.message });
    }
});

export {};