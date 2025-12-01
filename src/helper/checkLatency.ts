import { LoggerAgent } from "@/debug.ts";

export const checkLatency = async (url: string, timeoutMs: number = 2000): Promise<number | null> => {
  const log = LoggerAgent.create("checkLatency");
  return new Promise((resolve) => {
    const start = performance.now();
    let socket: WebSocket = null;
    let hasResolved = false;

    // Timeout de segurança
    const timeoutId = setTimeout(() => {
      if (!hasResolved) {
        hasResolved = true;
        if (socket) {
          socket.close();
        }
        resolve(null); // Timeout
      }
    }, timeoutMs);

    try {
      socket = new WebSocket(url);

      socket.onopen = () => {
        if (!hasResolved) {
          const end = performance.now();
          hasResolved = true;
          clearTimeout(timeoutId);
          socket?.close();
          resolve(Math.round(end - start));
        }
      };

      socket.onerror = () => {
        if (!hasResolved) {
          hasResolved = true;
          clearTimeout(timeoutId);
          resolve(null); // Erro de conexão
        }
      };
    } catch (e) {
      if (!hasResolved) {
        hasResolved = true;
        clearTimeout(timeoutId);
        resolve(null);
      }
      log.debug(`WebSocket error: ${e}`);
    }
  });
};