import { createFileRoute } from "@tanstack/react-router";
import { DevWrap } from "@/components/DevWrap.tsx";
import React, { useCallback, useEffect, useState } from "react";
import { Activity, Bell, Check, Info, MapPin, RefreshCw, Server, Shield, Wifi } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { checkLatency } from "@/helper/checkLatency.ts";

export const Route = createFileRoute("/configurarion/")({
  component: RouteComponent
});

interface DufflePudRelaysResponse {
  relays: string[];
}

function RouteComponent() {
// definir servidores blossom principal e espelhos
  // definir lista de retransmissão
  // configurações de notificação
  // confighurações de comportamento
  return (
    <DevWrap>

      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm">Gerencie sua conexão Nostr e preferências de
          privacidade.</p>
      </div>
      <div className="space-y-6">
        <BlossomSettings />
        <PermissionSettings />
        <RelaySettings />
      </div>
      <div
        className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 dark:bg-black/80 backdrop-blur border-t border-zinc-200 dark:border-zinc-800 flex justify-center sm:static sm:bg-transparent sm:border-0 sm:p-0">
        <Button className="w-full max-w-md shadow-lg sm:shadow-none" size="md">
          Salvar Alterações
        </Button>
      </div>

    </DevWrap>
  );
}

// --- MOCK DATA & TYPES ---

interface BlossomServer {
  url: string;
  name: string;
  region: string;
}


const MOCK_BLOSSOM_SERVERS: BlossomServer[] = [
  { url: "https://cdn.nostr.build", name: "Nostr.Build CDN", region: "Global" },
  { url: "https://cdn.satellite.earth", name: "Satellite CDN", region: "US" },
  { url: "https://blossom.primal.net", name: "Primal Storage", region: "EU" },
  { url: "https://media.nostr.band", name: "Nostr Band", region: "US" },
  { url: "https://cdn.void.cat", name: "Void Cat", region: "Global" },
  { url: "https://files.nostr.ch", name: "Nostr CH", region: "EU" }
];

// --- UI COMPONENTS (Simulating Shadcn) ---

const Card = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <div
    className={`bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden ${className}`}>
    {children}
  </div>
);

const CardHeader = ({ title, description, icon: Icon }: {
  title: string,
  description?: string,
  icon?: React.ElementType
}) => (
  <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
    <div className="flex items-center gap-2 mb-1">
      {Icon && <Icon className="w-5 h-5 text-indigo-500" />}
      <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">{title}</h3>
    </div>
    {description && <p className="text-sm text-zinc-500 dark:text-zinc-400 ml-7">{description}</p>}
  </div>
);

const CardContent = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <div className={`p-4 ${className}`}>
    {children}
  </div>
);

const Badge = ({ children, variant = "default", className = "" }: {
  children: React.ReactNode,
  variant?: "default" | "outline" | "success" | "warning" | "destructive",
  className?: string
}) => {
  const variants = {
    default: "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100",
    outline: "border border-zinc-200 text-zinc-600 dark:border-zinc-700 dark:text-zinc-400",
    success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    warning: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    destructive: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};

const Button = ({ children, onClick, variant = "primary", size = "md", disabled = false, className = "" }: any) => {
  const base = "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-50 disabled:pointer-events-none";
  const variants = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm",
    secondary: "bg-zinc-100 text-zinc-900 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700",
    ghost: "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400",
    outline: "border border-zinc-200 bg-transparent hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800"
  };
  const sizes = {
    sm: "h-8 px-3 text-xs",
    md: "h-10 px-4 py-2 text-sm",
    icon: "h-9 w-9"
  };

  return (
    <button onClick={onClick} disabled={disabled}
            className={`${base} ${variants[variant as keyof typeof variants]} ${sizes[size as keyof typeof sizes]} ${className}`}>
      {children}
    </button>
  );
};

const Switch = ({ checked, onCheckedChange }: { checked: boolean, onCheckedChange: (c: boolean) => void }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onCheckedChange(!checked)}
    className={`
      relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2
      ${checked ? "bg-indigo-600" : "bg-zinc-200 dark:bg-zinc-700"}
    `}
  >
    <span
      className={`
        pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform
        ${checked ? "translate-x-5" : "translate-x-0"}
      `}
    />
  </button>
);

// --- FEATURE COMPONENTS ---

// 1. Blossom Server Settings
const BlossomSettings = () => {
  const [primary, setPrimary] = useState<string>(MOCK_BLOSSOM_SERVERS[0].url);
  const [secondaries, setSecondaries] = useState<string[]>([MOCK_BLOSSOM_SERVERS[1].url]);
  const [servers, setServers] = useState<BlossomServer[]>([]);
  const [loading, setLoading] = useState(true);

  // Simulate API fetch
  useEffect(() => {
    setTimeout(() => {
      setServers(MOCK_BLOSSOM_SERVERS);
      setLoading(false);
    }, 800);
  }, []);

  const toggleSecondary = (url: string) => {
    if (url === primary) return; // Can't toggle primary
    setSecondaries(prev =>
      prev.includes(url) ? prev.filter(s => s !== url) : [...prev, url]
    );
  };

  const handleSetPrimary = (url: string) => {
    setPrimary(url);
    // If it was secondary, remove it from secondary list
    setSecondaries(prev => prev.filter(s => s !== url));
  };

  return (
    <Card>
      <CardHeader
        title="Servidores de Mídia Blossom"
        description="Gerencie onde seus vídeos e imagens são armazenados."
        icon={Server}
      />
      <CardContent>
        {loading ? (
          <div className="flex justify-center p-8 text-zinc-400 animate-pulse">Carregando servidores...</div>
        ) : (
          <div className="space-y-4">
            <div
              className="flex justify-between items-center text-xs text-zinc-500 uppercase font-bold tracking-wider px-2">
              <span>Servidor</span>
              <span>Função</span>
            </div>

            {/* Scrollable Area - 3 visible items approx (h-48) */}
            <div
              className="h-56 overflow-y-auto pr-2 space-y-2 scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-700">
              {servers.map((server) => {
                const isPrimary = server.url === primary;
                const isSecondary = secondaries.includes(server.url);

                return (
                  <div
                    key={server.url}
                    className={`
                      relative flex items-center justify-between p-3 rounded-lg border transition-all
                      ${isPrimary
                      ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20"
                      : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"}
                    `}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium text-sm text-zinc-900 dark:text-zinc-100">{server.name}</span>
                      <span className="text-xs text-zinc-500">{server.region}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isPrimary ? (
                        <Badge variant="success" className="flex items-center gap-1">
                          <Check className="w-3 h-3" /> Primário
                        </Badge>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-xs h-7"
                            onClick={() => handleSetPrimary(server.url)}
                          >
                            Definir Primário
                          </Button>
                          <div className="flex items-center gap-2 pl-2 border-l border-zinc-200 dark:border-zinc-700">
                            <label className="text-xs cursor-pointer select-none"
                                   htmlFor={`sec-${server.url}`}>Sec.</label>
                            <input
                              id={`sec-${server.url}`}
                              type="checkbox"
                              checked={isSecondary}
                              onChange={() => toggleSecondary(server.url)}
                              className="w-4 h-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="text-xs text-zinc-400 pt-2 flex items-center gap-1">
              <Info className="w-3 h-3" />
              O servidor primário recebe uploads novos. Secundários servem como backup.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// 2. Permission Settings (Push & Location)
const PermissionSettings = () => {
  const [pushEnabled, setPushEnabled] = useState(false);
  const [locationEnabled, setLocationEnabled] = useState(false);

  return (
    <Card>
      <CardHeader
        title="Privacidade e Notificações"
        icon={Shield}
      />
      <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">Notificações Push</p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Receba alertas sobre novos vídeos e lives.</p>
            </div>
          </div>
          <Switch checked={pushEnabled} onCheckedChange={setPushEnabled} />
        </div>

        <div className="flex items-center justify-between p-4">
          <div className="flex items-start gap-3">
            <div
              className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">Geohash Local</p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Melhore a descoberta de conteúdo regional.</p>
            </div>
          </div>
          <Switch checked={locationEnabled} onCheckedChange={setLocationEnabled} />
        </div>
      </div>
    </Card>
  );
};

// 3. Relay Settings with Latency
const RelaySettings = () => {
  const [selectedRelays, setSelectedRelays] = useState<string[]>(["wss://relay.damus.io"]);
  const [latencies, setLatencies] = useState<Record<string, number | null>>({});
  const [isPinging, setIsPinging] = useState(false);

  // USANDO O CÓDIGO FORNECIDO PELO USUÁRIO PARA BUSCAR DADOS
  const { data, isLoading, error } = useQuery({
    queryKey: ["relays"],
    queryFn: async (): Promise<DufflePudRelaysResponse> => {
      return fetch("https://dufflepud.onrender.com/relay").then(res => res.json());
    },
    networkMode: "online"
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
  };

  const getLatencyColor = (ms: number | null) => {
    if (ms === null) return "text-red-500";
    if (ms > 1000) return "text-red-400";
    if (ms < 200) return "text-emerald-500";
    return "text-amber-500";
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
    ? Array.from(new Set(data.relays.filter(r => r.startsWith("ws"))))
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
                  <Activity className="w-3 h-3 text-zinc-400" />
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
