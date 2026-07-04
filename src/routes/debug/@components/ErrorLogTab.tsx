import { AlertTriangle, Bug, Clipboard, Copy, Download, FileJson, FileText, Info, Trash2, XCircle } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  clearLogs,
  type ErrorLogEntry,
  exportJSON,
  exportTXT,
  getAllLogs,
  getSessionErrorCount,
} from '@/features/debug/services/error-log.service.ts'
import { Badge, Button, Card, CardContent, CardHeader } from '@/routes/configuration/@components/CommonComponents.tsx'

export function ErrorLogTab() {
  const [logs, setLogs] = useState<ErrorLogEntry[]>([])
  const [levelFilter, setLevelFilter] = useState<string>('all')
  const [textFilter, setTextFilter] = useState('')
  const [showConfirmClear, setShowConfirmClear] = useState(false)

  useEffect(() => {
    getAllLogs().then(setLogs).catch(undefined)
  }, [])

  const refresh = useCallback(async () => {
    const allLogs = await getAllLogs().catch(() => [])
    setLogs(allLogs)
  }, [])

  const filtered = useMemo(
    () =>
      logs
        .filter((l) => levelFilter === 'all' || l.level === levelFilter)
        .filter((l) => !textFilter || l.message.toLowerCase().includes(textFilter.toLowerCase()))
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    [logs, levelFilter, textFilter],
  )

  const lastError = useMemo(() => logs.find((l) => l.level === 'error'), [logs])

  const handleExportJSON = async () => {
    const content = exportJSON(filtered)
    const blob = new Blob([content], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'nostr-error-logs.json'
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Logs exportados como JSON')
  }

  const handleExportTXT = async () => {
    const content = exportTXT(filtered)
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'nostr-error-logs.txt'
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Logs exportados como TXT')
  }

  const handleCopyReport = () => {
    if (!lastError) return
    let contextStr = ''
    try {
      if (lastError.context) {
        const parsed = JSON.parse(lastError.context)
        contextStr = Object.entries(parsed)
          .map(([k, v]) => `${k}: ${typeof v === 'string' ? v : JSON.stringify(v)}`)
          .join('\n')
      }
    } catch {
      contextStr = lastError.context ?? ''
    }
    const text = [
      `Error ID: ${lastError.errorId}`,
      `Timestamp: ${lastError.timestamp}`,
      `Message: ${lastError.message}`,
      `Version: ${lastError.appVersion}`,
      `User Agent: ${lastError.userAgent}`,
      contextStr ? `\nContext:\n${contextStr}` : '',
      lastError.stack ? `\nStack:\n${lastError.stack}` : '',
    ].join('\n')
    navigator.clipboard
      .writeText(text)
      .then(() => {
        toast.success('Relatório de erro copiado')
      })
      .catch(() => toast.error('Falha ao copiar'))
  }

  const handleClear = async () => {
    await clearLogs()
    setLogs([])
    setShowConfirmClear(false)
    toast.success('Logs limpos')
  }

  const levelCounts = useMemo(
    () => ({
      error: logs.filter((l) => l.level === 'error').length,
      warn: logs.filter((l) => l.level === 'warn').length,
      info: logs.filter((l) => l.level === 'info').length,
    }),
    [logs],
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="default">{filtered.length} logs</Badge>
          {levelCounts.error > 0 && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {levelCounts.error} erros
            </Badge>
          )}
          {levelCounts.warn > 0 && (
            <Badge variant="warning" className="flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {levelCounts.warn} avisos
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          {lastError && (
            <Button size="sm" variant="ghost" onClick={handleCopyReport}>
              <Copy className="w-4 h-4 mr-1" />
              Copiar relatório
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
              {(['all', 'error', 'warn', 'info'] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setLevelFilter(l)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    levelFilter === l
                      ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
                      : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                  }`}
                >
                  {l === 'all' ? 'Todos' : l}
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
              {filtered.map((log) => {
                let parsedContext: Record<string, unknown> | null = null
                try {
                  if (log.context?.startsWith('{')) {
                    parsedContext = JSON.parse(log.context)
                  }
                } catch {
                  void 0
                }

                return (
                  <div key={log.timestamp} className="p-3 hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                    <div className="flex items-start gap-2">
                      <div className="mt-0.5">
                        {log.level === 'error' ? (
                          <XCircle className="w-4 h-4 text-red-500" />
                        ) : log.level === 'warn' ? (
                          <AlertTriangle className="w-4 h-4 text-amber-500" />
                        ) : (
                          <Info className="w-4 h-4 text-blue-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-xs text-zinc-400 mb-1">
                          <span className="font-mono text-zinc-500">{log.errorId}</span>
                          <span>•</span>
                          <span>{new Date(log.timestamp).toLocaleString('pt-BR')}</span>
                          <Badge
                            variant={
                              log.level === 'error' ? 'destructive' : log.level === 'warn' ? 'warning' : 'default'
                            }
                            className="uppercase"
                          >
                            {log.level}
                          </Badge>
                        </div>
                        <p className="text-sm font-mono text-zinc-800 dark:text-zinc-200 break-words">{log.message}</p>
                        {log.stack && (
                          <pre className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 whitespace-pre-wrap overflow-x-auto max-h-24">
                            {log.stack}
                          </pre>
                        )}
                        {parsedContext && (
                          <div className="mt-1 space-y-0.5">
                            {parsedContext.componentName ? (
                              <p className="text-xs text-zinc-400">
                                Componente: <span className="font-mono">{String(parsedContext.componentName)}</span>
                              </p>
                            ) : null}
                            {parsedContext.route ? (
                              <p className="text-xs text-zinc-400">
                                Rota: <span className="font-mono">{String(parsedContext.route)}</span>
                              </p>
                            ) : null}
                            {parsedContext.source ? (
                              <p className="text-xs text-zinc-400">
                                Origem: <span className="font-mono">{String(parsedContext.source)}</span>
                              </p>
                            ) : null}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
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
            <Button variant="ghost" onClick={() => setShowConfirmClear(false)}>
              Cancelar
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
