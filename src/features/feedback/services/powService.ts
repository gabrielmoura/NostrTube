import { FeedbackFlowError } from "@/features/feedback/types/feedback";
import type { OwnedEvent } from "@/helper/nostrEvents";

interface MineEventWithPowOptions {
  signal?: AbortSignal;
  onProgress?: (attempts: number) => void;
}

type PowWorkerMessage =
  | { type: "progress"; attempts: number }
  | { type: "done"; event: OwnedEvent; attempts: number }
  | { type: "error"; error: string };

export async function mineEventWithPow(event: OwnedEvent, difficulty: number, options: MineEventWithPowOptions = {}): Promise<OwnedEvent> {
  return new Promise<OwnedEvent>((resolve, reject) => {
    const worker = new Worker(new URL("../workers/nip13Pow.worker.ts", import.meta.url), { type: "module" });
    let settled = false;

    const cleanup = () => {
      worker.terminate();
      options.signal?.removeEventListener("abort", handleAbort);
    };

    const finish = (callback: () => void) => {
      if (settled) return;
      settled = true;
      cleanup();
      callback();
    };

    const handleAbort = () => {
      finish(() => {
        reject(new FeedbackFlowError("pow-cancelled", "Proof of Work cancelled by user."));
      });
    };

    worker.addEventListener("message", (message: MessageEvent<PowWorkerMessage>) => {
      const data = message.data;

      if (data.type === "progress") {
        options.onProgress?.(data.attempts);
        return;
      }

      if (data.type === "error") {
        finish(() => reject(new FeedbackFlowError("pow-failed", data.error || "Failed to calculate POW.")));
        return;
      }

      finish(() => resolve(data.event));
    });

    worker.addEventListener("error", (event) => {
      finish(() => reject(new FeedbackFlowError("pow-failed", event.message || "Failed to calculate POW.")));
    });

    if (options.signal?.aborted) {
      handleAbort();
      return;
    }

    options.signal?.addEventListener("abort", handleAbort);
    worker.postMessage({ type: "start", event, difficulty });
  });
}
