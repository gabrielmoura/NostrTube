import { useCallback, useEffect, useMemo, useState, type MouseEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity, AlertCircle, RefreshCw, Wifi } from "lucide-react";
import { checkLatency } from "@/helper/checkLatency.ts";
import { Button, Card, CardContent, CardHeader } from "./CommonComponents.tsx";
import useUserStore from "@/store/useUserStore.ts";
import { syncNdkRelayPool } from "@/lib/ndk";

interface DufflePudRelaysResponse {
  relays: string[];
}

export const RelaySettings = () => {
  const storedRelays = useUserStore((state) => state.session?.relays ?? []);
  const setRelays = useUserStore((state) => state.setRelays);
  const defaultRelays = import.meta.env.VITE_NOSTR_RELAYS || [];
  const [selectedRelays, setSelectedRelays] = useState<string[]>(storedRelays.length ? storedRelays : defaultRelays);
  const [latencies, setLatencies] = useState<Record<string, number | null>>({});
  const [isPinging, setIsPinging] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["relay-directory"],
    queryFn: async (): Promise<DufflePudRelaysResponse> => {
      const response = await fetch(import.meta.env.VITE_DUFFLEPUD_URL as string);
      if (!response.ok) {
        throw new Error("Relay directory request failed");
      }
      return response.json();
    },
    networkMode: "online",
    staleTime: 1000 * 60 * 60 * 24,
    enabled: !!import.meta.env.VITE_DUFFLEPUD_URL
  });

  useEffect(() => {
    if (storedRelays.length) {
      setSelectedRelays(storedRelays);
    }
  }, [storedRelays]);

  const validRelays = useMemo(() => {
    const remoteRelays = data?.relays ?? [];
    return Array.from(new Set([...remoteRelays.filter((relay) => relay.startsWith("ws://") || relay.startsWith("wss://")), ...defaultRelays]));
  }, [data?.relays, defaultRelays]);

  const pingAllRelays = useCallback(async () => {
    if (!validRelays.length) return;
    setIsPinging(true);
    const nextLatencies: Record<string, number | null> = {};

    const relayResults = await Promise.all(validRelays.slice(0, 15).map(async (relayUrl) => ({
      relayUrl,
      latency: await checkLatency(relayUrl)
    })));

    relayResults.forEach(({ relayUrl, latency }) => {
      nextLatencies[relayUrl] = latency;
    });

    setLatencies((previous) => ({ ...previous, ...nextLatencies }));
    setIsPinging(false);
  }, [validRelays]);

  useEffect(() => {
    if (validRelays.length && Object.keys(latencies).length === 0) {
      pingAllRelays();
    }
  }, [latencies, pingAllRelays, validRelays.length]);

  const toggleRelay = (url: string) => {
    const nextRelays = selectedRelays.includes(url)
      ? selectedRelays.filter((relayUrl) => relayUrl !== url)
      : [...selectedRelays, url];

    setSelectedRelays(nextRelays);
    setRelays(nextRelays);
    syncNdkRelayPool(nextRelays);
  };

  const getLatencyColor = (ms: number | null | undefined) => {
    if (ms === null) return "text-red-500";
    if (ms === undefined) return "text-zinc-400";
    if (ms > 1000) return "text-red-400";
    if (ms < 200) return "text-emerald-500";
    return "text-amber-500";
  };

  const forcePing = async (url: string) => {
    setIsPinging(true);
    const latency = await checkLatency(url);
    setLatencies((prev) => ({ ...prev, [url]: latency }));
    setIsPinging(false);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader title="Relays de retransmissão" icon={Wifi} />
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
        <CardHeader title="Relays de retransmissão" icon={Wifi} />
        <CardContent className="flex flex-col items-center justify-center h-48 text-red-500">
          <AlertCircle className="w-8 h-8 mb-2" />
          <span className="text-sm">Erro ao carregar relays.</span>
          <Button variant="ghost" size="sm" onClick={() => refetch()} className="mt-2">Tentar novamente</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        title="Relays de retransmissão"
        description="Escolha os relays usados pelo cliente e mantenha a lista de DM alinhada com a sua sessão."
        icon={Wifi}
      />
      <div className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/30 p-2 flex justify-between items-center">
        <span className="text-xs text-zinc-400 ml-2">Selecionados: {selectedRelays.length}</span>
        <Button variant="outline" size="sm" onClick={pingAllRelays} disabled={isPinging} className="text-xs flex gap-2">
          <RefreshCw className={`w-3 h-3 ${isPinging ? "animate-spin" : ""}`} />
          {isPinging ? "Pingando..." : "Testar latência"}
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
                className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors ${isSelected ? "border-indigo-200 bg-indigo-50/30 dark:border-indigo-900/50" : "border-transparent"}`}
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
                    <span className="text-xs text-zinc-400 truncate">{relayUrl}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="p-0 hover:bg-zinc-350 dark:hover:bg-zinc-700 transition-colors"
                    onClick={(e: MouseEvent<HTMLButtonElement>) => {
                      e.preventDefault();
                      e.stopPropagation();
                      forcePing(relayUrl);
                    }}
                  >
                    <Activity className="w-3 h-3 text-zinc-400" />
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
