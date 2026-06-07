import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Bug, Clipboard, Copy, Download, FileJson, FileText, Info, Trash2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Badge, Button, Card, CardContent, CardHeader } from "@/routes/configurarion/@components/CommonComponents.tsx";
import {
  clearLogs,
  exportJSON,
  exportTXT,
  getAllLogs,
  getSessionErrorCount,
  initErrorLogging,
  type ErrorLogEntry,
} from "@/features/debug/services/error-log.service.ts";

export function ErrorLogTab() {
  const [logs, setLogs] = useState<ErrorLogEntry[]>([]);
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [textFilter, setTextFilter] = useState("");
  const [sessionCount, setSessionCount] = useState(0);
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  useEffect(() => {
    const cleanup = initErrorLogging();
    getAllLogs().then(setLogs).catch(() => {});
    setSessionCount(getSessionErrorCount());
    return cleanup;
  }, []);

  const refresh = useCallback(async () => {
    const allLogs = await getAllLogs().catch(() => []);
    setLogs(allLogs);
    setSessionCount(getSessionErrorCount());
  }, []);

  const filtered = useMemo(() =>
    logs
      .filter((l) => levelFilter === "all" || l.level === levelFilter)
      .filter((l) => !textFilter || l.message.toLowerCase().includes(textFilter.toLowerCase()))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    [logs, levelFilter, textFilter]
  );

  const lastError = useMemo(() => logs.find((l) => l.level === "error"), [logs]);

  const handleExportJSON = async () => {
    const content = exportJSON(filtered);
    const blob = new Blob([content], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "nostr-error-logs.json";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Logs exportados como JSON");
  };

  const handleExportTXT = async () => {
    const content = exportTXT(filtered);
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "nostr-error-logs.txt";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Logs exportados como TXT");
  };

  const handleCopyLastError = () => {
    if (!lastError) return;
    const text = `[${lastError.timestamp}] ${lastError.message}\n\n${lastError.stack ?? "sem stack trace"}`;
    navigator.clipboard.writeText(text).then(() => {
      toast.success("Ultimo erro copiado");
    }).catch(() => toast.error("Falha ao copiar"));
  };

  const handleClear = async () => {
    await clearLogs();
    setLogs([]);
    setShowConfirmClear(false);
    toast.success("Logs limpos");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="default">{filtered.length} logs</Badge>
          {sessionCount > 0 && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {sessionCount} erros nesta sessao
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          {lastError && (
            <Button size="sm" variant="ghost" onClick={handleCopyLastError}>
              <Copy className="w-4 h-4 mr-1" />
              Copiar ultimo erro
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={refresh}>
            <Bug className="w-4 h-4 mr-1" />
            Atualizar
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader title="Filtros" icon={Info} />
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <div className="flex gap-1">
              {(["all", "error", "warn", "info"] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setLevelFilter(l)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    levelFilter === l
                      ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
                      : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                  }`}
                >
                  {l === "all" ? "Todos" : l}
                </button>
              ))}
            </div>
            <input
              className="flex-1 min-w-[200px] rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-1.5 text-sm"
              placeholder="Filtrar por mensagem..."
              value={textFilter}
              onChange={(e) => setTextFilter(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Logs" icon={Bug} />
        <CardContent className="max-h-96 overflow-y-auto p-0">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-zinc-400 text-sm">Nenhum log capturado</div>
          ) : (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {filtered.map((log) => (
                <div key={log.timestamp} className="p-3 hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                  <div className="flex items-start gap-2">
                    <div className="mt-0.5">
                      {log.level === "error" ? (
                        <XCircle className="w-4 h-4 text-red-500" />
                      ) : log.level === "warn" ? (
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                      ) : (
                        <Info className="w-4 h-4 text-blue-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-xs text-zinc-400 mb-1">
                        <span>{new Date(log.timestamp).toLocaleString("pt-BR")}</span>
                        <Badge
                          variant={
                            log.level === "error" ? "destructive" : log.level === "warn" ? "warning" : "default"
                          }
                          className="uppercase"
                        >
                          {log.level}
                        </Badge>
                      </div>
                      <p className="text-sm font-mono text-zinc-800 dark:text-zinc-200 break-words">
                        {log.message}
                      </p>
                      {log.stack && (
                        <pre className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 whitespace-pre-wrap overflow-x-auto max-h-24">
                          {log.stack}
                        </pre>
                      )}
                      {log.context && (
                        <p className="mt-1 text-xs text-zinc-400 italic">Contexto: {log.context}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button onClick={handleExportJSON} variant="secondary">
          <FileJson className="w-4 h-4 mr-2" />
          Exportar JSON
        </Button>
        <Button onClick={handleExportTXT} variant="outline">
          <FileText className="w-4 h-4 mr-2" />
          Exportar TXT
        </Button>
        <Button
          variant="ghost"
          className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
          onClick={() => setShowConfirmClear(true)}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Limpar logs
        </Button>
      </div>

      {showConfirmClear && (
        <Card>
          <CardHeader
            title="Confirmar limpeza"
            icon={Trash2}
            description="Todos os logs de erro serao removidos permanentemente."
          />
          <CardContent className="flex gap-3">
            <Button variant="destructive" onClick={handleClear}>
              <Trash2 className="w-4 h-4 mr-1" />
              Limpar
            </Button>
            <Button variant="ghost" onClick={() => setShowConfirmClear(false)}>Cancelar</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
