import { useCallback, useMemo, useState } from "react";
import { CheckCircle, Clock, Copy, Globe, Server, Shield, User, Wifi, XCircle } from "lucide-react";
import { NDKRelayStatus } from "@nostr-dev-kit/ndk";
import { useNDK, useNDKCurrentUser } from "@nostr-dev-kit/ndk-hooks";
import { toast } from "sonner";
import { Badge, Button, Card, CardContent, CardHeader } from "@/routes/configurarion/@components/CommonComponents.tsx";

interface RelayStatusEntry {
  url: string;
  status: string;
  statusColor: "success" | "destructive" | "warning" | "default";
  attempts: number;
  successCount: number;
}

export function BuildInfoTab() {
  const { ndk } = useNDK();
  const currentUser = useNDKCurrentUser();

  const relaysStatus = useMemo<RelayStatusEntry[]>(() => {
    if (!ndk) return [];
    const entries: RelayStatusEntry[] = [];
    ndk.pool.relays.forEach((relay) => {
      const status = relay.status;
      let label: string;
      let color: RelayStatusEntry["statusColor"];

      if (status >= NDKRelayStatus.AUTHENTICATED) {
        label = "Autenticado";
        color = "success";
      } else if (status >= NDKRelayStatus.CONNECTED) {
        label = "Conectado";
        color = "success";
      } else if (status >= NDKRelayStatus.CONNECTING) {
        label = "Conectando";
        color = "warning";
      } else if (status >= NDKRelayStatus.RECONNECTING) {
        label = "Reconectando";
        color = "warning";
      } else if (status === NDKRelayStatus.FLAPPING) {
        label = "Instavel";
        color = "destructive";
      } else {
        label = "Desconectado";
        color = "default";
      }

      const stats = relay.connectionStats;
      entries.push({
        url: relay.url,
        status: label,
        statusColor: color,
        attempts: stats?.attempts ?? 0,
        successCount: stats?.success ?? 0,
      });
    });
    return entries.sort((a, b) => a.url.localeCompare(b.url));
  }, [ndk]);

  const buildInfo = useMemo(() => {
    return {
      appName: import.meta.env.VITE_APP_NAME ?? "NostrTube",
      environment: import.meta.env.DEV ? "development" : import.meta.env.PROD ? "production" : "unknown",
      nodeEnv: import.meta.env.MODE,
      viteVersion: import.meta.env.VITE_APP_VERSION ?? "0.0.0",
      supportedNips: [1, 2, 4, 11, 20, 22, 23, 25, 26, 28, 33, 40, 56, 71, 92, 94, 98],
    };
  }, []);

  const featureFlags = useMemo(() => {
    const flags: Record<string, boolean> = {};
    const keys = Object.keys(import.meta.env);
    for (const key of keys) {
      if (key.startsWith("VITE_FEATURE_") || key.startsWith("VITE_ENABLE_")) {
        flags[key.replace("VITE_FEATURE_", "").replace("VITE_ENABLE_", "").toLowerCase()] =
          import.meta.env[key] === "true" || import.meta.env[key] === "1";
      }
    }
    return flags;
  }, []);

  const truncatedPubkey = useMemo(() => {
    if (!currentUser?.pubkey) return null;
    return `${currentUser.pubkey.slice(0, 8)}...${currentUser.pubkey.slice(-8)}`;
  }, [currentUser]);

  const copyFullDiagnostic = useCallback(() => {
    const diagnostic = {
      app: buildInfo,
      date: new Date().toISOString(),
      relays: relaysStatus.map((r) => ({ url: r.url, status: r.status })),
      pubkey: currentUser?.pubkey ?? null,
      featureFlags,
      userAgent: navigator.userAgent,
    };
    navigator.clipboard.writeText(JSON.stringify(diagnostic, null, 2)).then(() => {
      toast.success("Diagnostico completo copiado");
    }).catch(() => toast.error("Falha ao copiar"));
  }, [buildInfo, relaysStatus, currentUser, featureFlags]);

  const copyPubkey = useCallback(() => {
    if (!currentUser?.pubkey) return;
    navigator.clipboard.writeText(currentUser.pubkey).then(() => {
      toast.success("Pubkey copiada");
    }).catch(() => toast.error("Falha ao copiar"));
  }, [currentUser]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader title="Build & Ambiente" icon={Server} />
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
              <p className="text-xs text-zinc-500 mb-1">Aplicativo</p>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{buildInfo.appName}</p>
            </div>
            <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
              <p className="text-xs text-zinc-500 mb-1">Versao</p>
              <p className="text-sm font-semibold font-mono text-zinc-900 dark:text-zinc-100">{buildInfo.viteVersion}</p>
            </div>
            <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
              <p className="text-xs text-zinc-500 mb-1">Ambiente</p>
              <Badge variant={buildInfo.environment === "production" ? "success" : "warning"}>
                {buildInfo.environment}
              </Badge>
              <span className="text-xs text-zinc-400 ml-2">({buildInfo.nodeEnv})</span>
            </div>
            <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
              <p className="text-xs text-zinc-500 mb-1">Protocolo</p>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Nostr</p>
            </div>
            <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
              <p className="text-xs text-zinc-500 mb-1">NIPs suportados</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {buildInfo.supportedNips.map((nip) => (
                  <Badge key={nip} variant="outline" className="text-xs">
                    NIP-{nip.toString().padStart(2, "0")}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
              <p className="text-xs text-zinc-500 mb-1">User Agent</p>
              <p className="text-xs font-mono text-zinc-600 dark:text-zinc-400 break-all">{navigator.userAgent.slice(0, 80)}...</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Usuario" icon={User} />
        <CardContent>
          {currentUser ? (
            <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                  <User className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {currentUser.profile?.displayName ?? currentUser.profile?.name ?? "Usuario"}
                  </p>
                  <p className="text-xs font-mono text-zinc-500">{truncatedPubkey}</p>
                </div>
              </div>
              <Button size="sm" variant="ghost" onClick={copyPubkey}>
                <Copy className="w-4 h-4 mr-1" />
                Copiar pubkey
              </Button>
            </div>
          ) : (
            <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg text-sm text-zinc-400">
              Nenhum usuario logado
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Conexoes WebSocket" icon={Wifi} />
        <CardContent>
          {relaysStatus.length === 0 ? (
            <p className="text-sm text-zinc-400">Nenhum relay na pool</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800">
                    <th className="text-left py-2 px-2 font-medium text-zinc-500">Relay</th>
                    <th className="text-center py-2 px-2 font-medium text-zinc-500">Status</th>
                    <th className="text-right py-2 px-2 font-medium text-zinc-500">Tentativas</th>
                    <th className="text-right py-2 px-2 font-medium text-zinc-500">Sucessos</th>
                  </tr>
                </thead>
                <tbody>
                  {relaysStatus.map((r) => (
                    <tr key={r.url} className="border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                      <td className="py-1.5 px-2 font-mono text-zinc-700 dark:text-zinc-300 max-w-[200px] truncate">
                        {r.url.replace("wss://", "").replace("ws://", "")}
                      </td>
                      <td className="py-1.5 px-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {r.statusColor === "success" ? (
                            <CheckCircle className="w-3 h-3 text-emerald-500" />
                          ) : r.statusColor === "destructive" ? (
                            <XCircle className="w-3 h-3 text-red-500" />
                          ) : (
                            <Clock className="w-3 h-3 text-amber-500" />
                          )}
                          <Badge variant={r.statusColor}>{r.status}</Badge>
                        </div>
                      </td>
                      <td className="py-1.5 px-2 text-right font-mono text-zinc-600 dark:text-zinc-400">{r.attempts}</td>
                      <td className="py-1.5 px-2 text-right font-mono text-zinc-600 dark:text-zinc-400">{r.successCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {Object.keys(featureFlags).length > 0 && (
        <Card>
          <CardHeader title="Feature Flags" icon={Shield} />
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.entries(featureFlags).map(([key, value]) => (
                <Badge key={key} variant={value ? "success" : "outline"}>
                  {key}: {value ? "on" : "off"}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-center">
        <Button onClick={copyFullDiagnostic}>
          <Globe className="w-4 h-4 mr-2" />
          Copiar diagnostico completo
        </Button>
      </div>
    </div>
  );
}
