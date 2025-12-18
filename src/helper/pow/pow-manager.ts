import type { OwnedEvent } from "@welshman/util";

interface PowTask {
  id: string;
  event: OwnedEvent;
  difficulty: number;
  resolve: (event: OwnedEvent) => void;
  reject: (error: any) => void;
}

class PowManager {
  private static instance: PowManager;
  private worker: Worker | null = null;
  private queue: PowTask[] = [];
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  private pendingTasks = new Map<string, { resolve: Function; reject: Function; timeout: number }>();
  private isProcessing = false;

  private constructor() {}

  public static getInstance(): PowManager {
    if (!PowManager.instance) {
      PowManager.instance = new PowManager();
    }
    return PowManager.instance;
  }

  private initWorker() {
    if (this.worker) return;

    // Inicializa o worker usando a URL relativa
    this.worker = new Worker(new URL("./pow-worker.ts", import.meta.url), { type: "module" });

    this.worker.onmessage = (event: MessageEvent<{ taskId: string; event: OwnedEvent; error?: string }>) => {
      const { taskId, event: resultEvent, error } = event.data;
      const task = this.pendingTasks.get(taskId);

      if (task) {
        clearTimeout(task.timeout);
        if (error) task.reject(new Error(error));
        else task.resolve(resultEvent);

        this.pendingTasks.delete(taskId);
      }

      this.isProcessing = false;
      this.processQueue();
    };

    this.worker.onerror = (err) => {
      console.error("POW Worker Error:", err);
      this.handleGlobalError(err);
    };
  }

  private handleGlobalError(error: any) {
    for (const [taskId, task] of this.pendingTasks) {
      clearTimeout(task.timeout);
      task.reject(error);
      this.pendingTasks.delete(taskId);
    }
    this.isProcessing = false;
    this.processQueue();
  }

  public calculate(event: OwnedEvent, difficulty: number): Promise<OwnedEvent> {
    this.initWorker();

    return new Promise((resolve, reject) => {
      const taskId = crypto.randomUUID();

      const timeout = window.setTimeout(() => {
        if (this.pendingTasks.has(taskId)) {
          this.pendingTasks.delete(taskId);
          reject(new Error("POW Timeout: Task took too long to complete"));
          this.isProcessing = false;
          this.processQueue();
        }
      }, 120_000); // 2 minutos de timeout

      this.queue.push({ id: taskId, event, difficulty, resolve, reject });
      this.processQueue();
    });
  }

  private processQueue() {
    if (this.isProcessing || this.queue.length === 0 || !this.worker) return;

    this.isProcessing = true;
    const task = this.queue.shift()!;

    this.pendingTasks.set(task.id, {
      resolve: task.resolve,
      reject: task.reject,
      timeout: (task as any).timeout // Passando o timeout para controle
    });

    this.worker.postMessage({
      taskId: task.id,
      event: task.event,
      difficulty: task.difficulty
    });
  }
}

export const powManager = PowManager.getInstance();