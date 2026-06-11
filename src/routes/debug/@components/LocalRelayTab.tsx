import { useCallback, useEffect, useRef, useState } from "react";
import { Activity, CheckCircle, History, Plus, RefreshCw, ServerOff, Wifi, XCircle } from "lucide-react";
import { toast } from "sonner";
import { NDKRelay, NDKRelayStatus } from "@nostr-dev-kit/ndk";
import { useNDK } from "@nostr-dev-kit/ndk-hooks";
import { Badge, Button, Card, CardContent, CardHeader } from "@/routes/configuration/@components/CommonComponents.tsx";
import { fetchNip11, pingRelay, type Nip11Info } from "@/features/debug/services/error-log.service.ts";

const HISTORY_KEY = "nostrtube:debug:localRelays";
const MAX_HISTORY = 5;

function loadHistory(): string[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveHistory(urls: string[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(urls.slice(0, MAX_HISTORY)));
}

export function LocalRelayTab() {
  const { ndk } = useNDK();
  const ndkRef = useRef(ndk);
  ndkRef.current = ndk;
  const [inputUrl, setInputUrl] = useState("");
  const [pinging, setPinging] = useState(false);
  const [latency, setLatency] = useState<number | null>(null);
  const [pingStatus, setPingStatus] = useState<"idle" | "ok" | "fail">("idle");
  const [nip11, setNip11] = useState<Nip11Info | null>(null);
  const [history, setHistory] = useState<string[]>(loadHistory);
  const [prioritizeLocal, setPrioritizeLocal] = useState(false);
  const [offlineMode, setOfflineMode] = useState(false);

  const isValidWs = inputUrl.startsWith("ws://") || inputUrl.startsWith("wss://");

  const handleTest = useCallback(async () => {
    if (!isValidWs) return;
    setPinging(true);
    setLatency(null);
    setPingStatus("idle");
    setNip11(null);

    const [lat, info] = await Promise.all([pingRelay(inputUrl), fetchNip11(inputUrl)]);
    setLatency(lat);
    setPingStatus(lat !== null ? "ok" : "fail");
    setNip11(info);
    setPinging(false);
  }, [inputUrl, isValidWs]);

  const handleAddToPool = useCallback(() => {
    const ndkInstance = ndkRef.current;
    if (!ndkInstance || !isValidWs) return;
    try {
      const relay = new NDKRelay(inputUrl, undefined, ndkInstance);
      ndkInstance.pool.addRelay(relay, true);
      const nextHistory = [inputUrl, ...history.filter((u) => u !== inputUrl)].slice(0, MAX_HISTORY);
      setHistory(nextHistory);
      saveHistory(nextHistory);
      toast.success(`Relay ${inputUrl} adicionado a pool`);
    } catch {
      toast.error("Falha ao adicionar relay");
    }
  }, [inputUrl, isValidWs, history]);

  const handleHistoryClick = (url: string) => {
    setInputUrl(url);
    setLatency(null);
    setPingStatus("idle");
    setNip11(null);
  };

  const handlePrioritizeToggle = useCallback(() => {
    if (!ndkRef.current) return;
    setPrioritizeLocal((p) => !p);
    toast.info("Priorizacao local alternada");
  }, []);

  const handleOfflineModeToggle = useCallback(() => {
    const ndkInstance = ndkRef.current;
    if (!ndkInstance) return;
    const next = !offlineMode;
    setOfflineMode(next);

    if (next) {
      ndkInstance.pool.relays.forEach((relay) => {
        if (relay.url !== inputUrl) {
          relay.disconnect();
        }
      });
    } else {
      ndkInstance.pool.relays.forEach((relay) => {
        relay.connect();
      });
    }

    toast.info(next ? "Modo offline ativado" : "Modo offline desativado");
  }, [offlineMode, inputUrl]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader title="Relay Local" icon={Wifi} description="Conecte a um relay Nostr local para desenvolvimento e testes." />
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <input
              className="flex-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm font-mono"
              placeholder="ws://localhost:7777"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleTest()}
            />
            <Button onClick={handleTest} disabled={!isValidWs || pinging} variant="secondary">
              <Activity className="w-4 h-4 mr-1" />
              {pinging ? "Testando..." : "Testar"}
            </Button>
          </div>

          {!isValidWs && inputUrl.length > 0 && (
            <p className="text-xs text-red-500">URL deve comecar com ws:// ou wss://</p>
          )}

          {pingStatus !== "idle" && (
            <div
              className={`p-3 rounded-lg border ${pingStatus === "ok" ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800" : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {pingStatus === "ok" ? (
                    <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  )}
                  <span
                    className={`text-sm font-medium ${pingStatus === "ok" ? "text-emerald-800 dark:text-emerald-200" : "text-red-800 dark:text-red-200"}`}
                  >
                    {pingStatus === "ok" ? "Conectado" : "Falhou / Timeout"}
                  </span>
                </div>
                {latency !== null && (
                  <Badge variant={latency < 200 ? "success" : latency < 1000 ? "warning" : "destructive"}>
                    {latency}ms
                  </Badge>
                )}
              </div>

              {nip11 && (
                <div className="text-xs text-zinc-600 dark:text-zinc-400 space-y-1 mt-2 pt-2 border-t border-zinc-200 dark:border-zinc-700">
                  {nip11.name && <p><strong>Nome:</strong> {nip11.name}</p>}
                  {nip11.description && <p><strong>Descricao:</strong> {nip11.description}</p>}
                  {nip11.software && <p><strong>Software:</strong> {nip11.software} {nip11.version ?? ""}</p>}
                  {nip11.supported_nips && (
                    <p><strong>NIPs suportados:</strong> {nip11.supported_nips.sort((a, b) => a - b).join(", ")}</p>
                  )}
                </div>
              )}

              <div className="mt-3 flex gap-2">
                <Button size="sm" onClick={handleAddToPool}>
                  <Plus className="w-3 h-3 mr-1" />
                  Adicionar a pool
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Modos" icon={Activity} />
        <CardContent className="space-y-3">
          <label className="flex items-center justify-between p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
            <div>
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Priorizar relay local</p>
              <p className="text-xs text-zinc-500">Envia todas as subscriptions para o relay local primeiro</p>
            </div>
            <input
              type="checkbox"
              checked={prioritizeLocal}
              onChange={handlePrioritizeToggle}
              className="w-4 h-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
            <div>
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Modo offline simulado</p>
              <p className="text-xs text-zinc-500">Desconecta todos os relays exceto o local</p>
            </div>
            <input
              type="checkbox"
              checked={offlineMode}
              onChange={handleOfflineModeToggle}
              className="w-4 h-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
            />
          </label>
        </CardContent>
      </Card>

      {history.length > 0 && (
        <Card>
          <CardHeader title="Historico" icon={History} />
          <CardContent>
            <div className="space-y-1">
              {history.map((url) => (
                <button
                  key={url}
                  onClick={() => handleHistoryClick(url)}
                  className="w-full text-left p-2 text-xs font-mono text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded"
                >
                  {url}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
