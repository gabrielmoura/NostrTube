import { type DBSchema, type IDBPDatabase, openDB } from "idb";
import { ulid } from "ulid";

export interface ErrorLogEntry {
  errorId: string;
  timestamp: string;
  level: "error" | "warn" | "info";
  message: string;
  stack?: string;
  context?: string;
  userAgent: string;
  appVersion: string;
}

interface ErrorLogDB extends DBSchema {
  logs: {
    key: string;
    value: ErrorLogEntry;
    indexes: {
      "by-timestamp": string;
      "by-level": string;
    };
  };
}

let db: IDBPDatabase<ErrorLogDB> | null = null;
let sessionErrorCount = 0;

const DB_NAME = "debug-error-logs";
const DB_VERSION = 1;

async function initDB(): Promise<IDBPDatabase<ErrorLogDB>> {
  if (db) return db;
  db = await openDB<ErrorLogDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      const store = db.createObjectStore("logs", { keyPath: "timestamp" });
      store.createIndex("by-timestamp", "timestamp");
      store.createIndex("by-level", "level");
    },
  });
  return db;
}

function getAppVersion(): string {
  return import.meta.env.VITE_APP_NAME ?? "NostrTube";
}

export async function addLog(entry: Omit<ErrorLogEntry, "errorId" | "userAgent" | "appVersion"> & { errorId?: string }): Promise<string> {
  try {
    const database = await initDB();
    const log: ErrorLogEntry = {
      errorId: entry.errorId ?? ulid(),
      ...entry,
      userAgent: navigator.userAgent,
      appVersion: getAppVersion(),
    };
    await database.add("logs", log);
    if (entry.level === "error") sessionErrorCount++;
    return log.errorId;
  } catch {
    console.warn("Could not save error log to IndexedDB");
    return "";
  }
}

export function logErrorBoundaryError(
  componentName: string,
  error: Error,
  errorInfo?: { componentStack?: string | null },
  extra?: Record<string, unknown>,
): Promise<string> {
  const context: Record<string, unknown> = {
    componentName,
    route: window.location.pathname + window.location.search,
  };
  if (errorInfo?.componentStack) {
    context.componentStack = errorInfo.componentStack;
  }
  if (extra) {
    Object.assign(context, extra);
  }
  return addLog({
    timestamp: new Date().toISOString(),
    level: "error",
    message: error.message,
    stack: error.stack,
    context: JSON.stringify(context),
  });
}

export function getSessionErrorCount(): number {
  return sessionErrorCount;
}

export function resetSessionErrorCount(): void {
  sessionErrorCount = 0;
}

export async function getAllLogs(): Promise<ErrorLogEntry[]> {
  const database = await initDB();
  return database.getAll("logs");
}

export async function getLogsByLevel(level: ErrorLogEntry["level"]): Promise<ErrorLogEntry[]> {
  const database = await initDB();
  return database.getAllFromIndex("logs", "by-level", level);
}

export async function clearLogs(): Promise<void> {
  const database = await initDB();
  await database.clear("logs");
  sessionErrorCount = 0;
}

export function exportJSON(logs: ErrorLogEntry[]): string {
  return JSON.stringify(logs, null, 2);
}

export function exportTXT(logs: ErrorLogEntry[]): string {
  return logs
    .map(
      (l) =>
        `[${l.timestamp}] [${l.level.toUpperCase()}] ${l.message}${l.stack ? `\nStack: ${l.stack}` : ""}${l.context ? `\nContext: ${l.context}` : ""}`,
    )
    .join("\n\n---\n\n");
}

export function initErrorLogging(): () => void {
  const onError = (event: ErrorEvent) => {
    addLog({
      timestamp: new Date().toISOString(),
      level: "error",
      message: event.message,
      stack: event.error?.stack,
      context: JSON.stringify({ source: "window.onerror", filename: event.filename, lineno: event.lineno, colno: event.colno }),
    });
  };

  const onRejection = (event: PromiseRejectionEvent) => {
    const reason = event.reason;
    addLog({
      timestamp: new Date().toISOString(),
      level: "error",
      message: reason?.message ?? String(reason),
      stack: reason?.stack,
      context: JSON.stringify({ source: "unhandledrejection" }),
    });
  };

  window.addEventListener("error", onError);
  window.addEventListener("unhandledrejection", onRejection);

  return () => {
    window.removeEventListener("error", onError);
    window.removeEventListener("unhandledrejection", onRejection);
  };
}

export interface Nip11Info {
  name?: string;
  description?: string;
  software?: string;
  version?: string;
  supported_nips?: number[];
  pubkey?: string;
  contact?: string;
}

export async function fetchNip11(relayUrl: string): Promise<Nip11Info | null> {
  try {
    const httpUrl = relayUrl.replace(/^ws:/, "http:").replace(/^wss:/, "https:");
    const response = await fetch(httpUrl, {
      headers: { Accept: "application/nostr+json" },
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

export async function pingRelay(relayUrl: string): Promise<number | null> {
  return new Promise((resolve) => {
    const start = performance.now();
    let ws: WebSocket | null = null;
    const timeout = setTimeout(() => {
      ws?.close();
      resolve(null);
    }, 5000);

    try {
      ws = new WebSocket(relayUrl);
      ws.onopen = () => {
        const latency = Math.round(performance.now() - start);
        clearTimeout(timeout);
        ws?.close();
        resolve(latency);
      };
      ws.onerror = () => {
        clearTimeout(timeout);
        resolve(null);
      };
    } catch {
      clearTimeout(timeout);
      resolve(null);
    }
  });
}
