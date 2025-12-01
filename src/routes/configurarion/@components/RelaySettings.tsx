import React, { useCallback, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { checkLatency } from "@/helper/checkLatency.ts";
import { Activity, AlertCircle, RefreshCw, Wifi } from "lucide-react";

import { Button, Card, CardContent, CardHeader } from "./CommonComponents.tsx";
import useUserStore from "@/store/useUserStore.ts";

interface DufflePudRelaysResponse {
  relays: string[];
}

export const RelaySettings = () => {
  const setRelays = useUserStore((state) => state.setRelays);
  const defaultRelays = import.meta.env.VITE_NOSTR_RELAYS?.split(",");
  const [selectedRelays, setSelectedRelays] = useState<string[]>(defaultRelays || []);
  const [latencies, setLatencies] = useState<Record<string, number | null>>({});
  const [isPinging, setIsPinging] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["relays"],
    queryFn: async (): Promise<DufflePudRelaysResponse> => {
      return fetch("https://dufflepud.onrender.com/relay").then(res => res.json());
    },
    networkMode: "online",
    staleTime: 1000 * 60 * 60 * 24 // 24 horas
  });

  // Real Ping Logic
  const pingAllRelays = useCallback(async () => {
    if (!data?.relays) return;

    setIsPinging(true);
    const newLatencies: Record<string, number | null> = { ...latencies };

    // Testamos apenas os primeiros 15 relays para não sobrecarregar o browser/rede
    // na demonstração, mas na prática testaria os visíveis ou paginados.
    const relaysToTest = data.relays.slice(0, 15);

    // Processamento em lotes para não travar a UI
    const promises = relaysToTest.map(async (url) => {
      // Limpar formatação se necessário (API retorna strings limpas geralmente)
      const latency = await checkLatency(url);
      return { url, latency };
    });

    const results = await Promise.all(promises);

    results.forEach(res => {
      newLatencies[res.url] = res.latency;
    });

    setLatencies(newLatencies);
    setIsPinging(false);
  }, [data]);

  // Ping automático quando os dados carregam
  useEffect(() => {
    if (data?.relays && !isPinging && Object.keys(latencies).length === 0) {
      pingAllRelays();
    }
  }, [data, pingAllRelays]);

  const toggleRelay = (url: string) => {
    setSelectedRelays(prev =>
      prev.includes(url) ? prev.filter(r => r !== url) : [...prev, url]
    );
    setRelays(selectedRelays);
  };

  const getLatencyColor = (ms: number | null) => {
    if (ms === null) return "text-red-500";
    if (ms > 1000) return "text-red-400";
    if (ms < 200) return "text-emerald-500";
    return "text-amber-500";
  };

  const forcePing = async (url: string) => {
    setIsPinging(true);
    const latency = await checkLatency(url);
    setLatencies(prev => ({ ...prev, [url]: latency }));
    setIsPinging(false);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader title="Relays de Retransmissão" icon={Wifi} />
        <CardContent className="flex items-center justify-center h-48">
          <RefreshCw className="w-6 h-6 animate-spin text-zinc-400" />
          <span className="ml-2 text-zinc-500">Carregando lista de relays...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader title="Relays de Retransmissão" icon={Wifi} />
        <CardContent className="flex flex-col items-center justify-center h-48 text-red-500">
          <AlertCircle className="w-8 h-8 mb-2" />
          <span className="text-sm">Erro ao carregar relays.</span>
          <Button variant="ghost" size="sm" onClick={() => window.location.reload()} className="mt-2">Tentar
            novamente</Button>
        </CardContent>
      </Card>
    );
  }

  // Filtrar para mostrar apenas relays válidos (começam com wss:// ou ws://) e remover duplicatas
  // A API às vezes retorna a mesma URL mais de uma vez, causando erro de chave duplicada no React.
  const validRelays = data?.relays
    ? Array.from(new Set([...data.relays.filter(r => r.startsWith("ws")), ...defaultRelays]))
    : [];

  return (
    <Card>
      <CardHeader
        title="Relays de Retransmissão"
        description="Selecione múltiplos relays para sincronização."
        icon={Wifi}
      />
      <div
        className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/30 p-2 flex justify-between items-center">
        <span className="text-xs text-zinc-400 ml-2">Total: {validRelays.length}</span>
        <Button
          variant="outline"
          size="sm"
          onClick={pingAllRelays}
          disabled={isPinging}
          className="text-xs flex gap-2"
        >
          <RefreshCw className={`w-3 h-3 ${isPinging ? "animate-spin" : ""}`} />
          {isPinging ? "Pingando..." : "Testar Latência (Top 15)"}
        </Button>
      </div>
      <CardContent>
        <div className="h-64 overflow-y-auto space-y-1 pr-1">
          {validRelays.map((relayUrl) => {
            const isSelected = selectedRelays.includes(relayUrl);
            const latency = latencies[relayUrl];

            return (
              <label
                key={relayUrl}
                className={`
                  flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors
                  ${isSelected ? "border-indigo-200 bg-indigo-50/30 dark:border-indigo-900/50" : "border-transparent"}
                `}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleRelay(relayUrl)}
                    className="w-4 h-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 flex-shrink-0"
                  />
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200 truncate w-full">
                      {relayUrl.replace("wss://", "").replace("ws://", "")}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0 ml-2">

                  {/*// Quando hover, bg-zinc-350 e icone branco, quando não hover, bg transparente e icone cinza */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="p-0 hover:bg-zinc-350 dark:hover:bg-zinc-700 transition-colors"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      forcePing(relayUrl);
                    }}
                  >
                    <Activity className="w-3 h-3 text-zinc-400 " />
                  </Button>
                  <span className={`text-xs font-mono font-bold w-12 text-right ${getLatencyColor(latency)}`}>
                    {latency !== undefined && latency !== null ? `${latency}ms` : latency === null && isPinging ? "..." : "--"}
                  </span>
                </div>
              </label>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};