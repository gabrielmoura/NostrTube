import type { OwnedEvent } from "@welshman/util";
import { LoggerAgent } from "@/lib/debug.ts";

export const logger = LoggerAgent.create("POW");

interface PowRequest {
  taskId: string;
  event: OwnedEvent;
  difficulty: number;
}

interface PowResponse {
  taskId: string;
  event?: OwnedEvent;
  error?: string;
}

class PowManager {
  private static instance: PowManager;
  // Keep a single worker alive for the whole app lifetime so PoW jobs reuse it.
  private worker: Worker;
  private queue: Promise<void> = Promise.resolve();

  private constructor() {
    this.worker = new Worker(new URL("./pow-worker.ts", import.meta.url), { type: "module" });
    this.worker.onerror = (err) => logger.error("Worker Critical Error:", err);
  }

  public static getInstance(): PowManager {
    if (!PowManager.instance) PowManager.instance = new PowManager();
    return PowManager.instance;
  }

  private executeTask(task: PowRequest): Promise<OwnedEvent> {
    return new Promise<OwnedEvent>((resolve, reject) => {
      let settled = false;

      const cleanup = () => {
        clearTimeout(timeoutId);
        this.worker.removeEventListener("message", handleMessage);
        this.worker.removeEventListener("error", handleError);
      };

      const finish = (callback: () => void) => {
        if (settled) return;
        settled = true;
        cleanup();
        callback();
      };

      const handleMessage = (event: MessageEvent<PowResponse>) => {
        if (event.data.taskId !== task.taskId) return;

        finish(() => {
          if (event.data.error) {
            logger.error("Task failed", task.taskId, event.data.error);
            reject(new Error(event.data.error));
            return;
          }

          logger.debug("Worker finished task", task.taskId);
          resolve(event.data.event!);
        });
      };

      const handleError = (event: ErrorEvent) => {
        finish(() => {
          logger.error("Worker Critical Error:", event);
          reject(event.error instanceof Error ? event.error : new Error(event.message || "POW worker failed"));
        });
      };

      const timeoutId = window.setTimeout(() => {
        finish(() => {
          logger.error("Task failed or timed out", task.taskId);
          reject(new Error(`POW task timed out after 120000ms: ${task.taskId}`));
        });
      }, 120_000);

      this.worker.addEventListener("message", handleMessage);
      this.worker.addEventListener("error", handleError);

      logger.debug("Sending task to worker", task.taskId);
      this.worker.postMessage(task);
    });
  }

  public async calculate(event: OwnedEvent, difficulty: number): Promise<OwnedEvent> {
    const taskId = crypto.randomUUID();
    const task = { taskId, event, difficulty };

    const resultPromise = this.queue.catch(() => undefined).then(() => this.executeTask(task));
    this.queue = resultPromise.then(() => undefined, () => undefined);

    return resultPromise;
  }
}

export const powManager = PowManager.getInstance();
