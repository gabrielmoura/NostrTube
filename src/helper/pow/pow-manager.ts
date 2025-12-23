import {
  catchError,
  concatMap,
  filter,
  firstValueFrom,
  fromEvent,
  map,
  share,
  Subject,
  throwError,
  timeout
} from "rxjs";
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
  private worker: Worker;
  private taskSubject = new Subject<PowRequest>();

  // Stream de mensagens vindo do Worker
  private workerMessages$;

  private constructor() {
    this.worker = new Worker(new URL("./pow-worker.ts", import.meta.url), { type: "module" });

    // Transformamos o evento de mensagem em um Observable compartilhado
    this.workerMessages$ = fromEvent<MessageEvent<PowResponse>>(this.worker, "message").pipe(
      map(ev => ev.data),
      share()
    );

    this.initPipeline();

    this.worker.onerror = (err) => logger.error("Worker Critical Error:", err);
  }

  public static getInstance(): PowManager {
    if (!PowManager.instance) PowManager.instance = new PowManager();
    return PowManager.instance;
  }

  private initPipeline() {
    // O concatMap garante que as tarefas sejam enviadas ao worker uma por uma
    this.taskSubject.pipe(
      concatMap((task) => {
        logger.debug("Sending task to worker", task.taskId);
        this.worker.postMessage(task);

        // Espera o worker responder com o ID específico antes de prosseguir para a próxima tarefa da fila
        return this.workerMessages$.pipe(
          filter(res => res.taskId === task.taskId),
          timeout(120_000), // 2 minutos
          catchError(err => {
            logger.error("Task failed or timed out", task.taskId, err);
            return throwError(() => err);
          })
        );
      })
    ).subscribe({
      next: (res) => logger.debug("Worker finished task", res.taskId),
      error: (err) => logger.error("Pipeline error (restarting...)", err)
    });
  }

  public async calculate(event: OwnedEvent, difficulty: number): Promise<OwnedEvent> {
    const taskId = crypto.randomUUID();

    // Criamos uma promessa que observa o stream de respostas especificamente para este taskId
    const resultPromise = firstValueFrom(
      this.workerMessages$.pipe(
        filter(res => res.taskId === taskId),
        map(res => {
          if (res.error) throw new Error(res.error);
          return res.event!;
        })
      )
    );

    this.taskSubject.next({ taskId, event, difficulty });

    return resultPromise;
  }
}

export const powManager = PowManager.getInstance();