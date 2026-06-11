import { Copy, Download, FileJson, FileSpreadsheet, FileText, Loader2, Search } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import type { CacheEventRow, CacheFilters } from '@/features/debug/services/cache.service.ts'
import {
  estimateExportSize,
  exportCSV,
  exportJSON,
  exportJSONL,
  getDistinctKinds,
  getDistinctRelays,
  getEvents,
} from '@/features/debug/services/cache.service.ts'
import { Badge, Button, Card, CardContent, CardHeader } from '@/routes/configurarion/@components/CommonComponents.tsx'

const EXPORT_TIMEOUT = 30000

export function ExportEventsTab() {
  const [events, setEvents] = useState<CacheEventRow[]>([])
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [filters, setFilters] = useState<CacheFilters>({})
  const [availableKinds, setAvailableKinds] = useState<number[]>([])
  const [availableRelays, setAvailableRelays] = useState<string[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    getDistinctKinds()
      .then(setAvailableKinds)
      .catch(() => void 0)
    getDistinctRelays()
      .then(setAvailableRelays)
      .catch(() => void 0)
  }, [])

  const loadEvents = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setLoading(true)

    try {
      const timeout = setTimeout(() => controller.abort(), EXPORT_TIMEOUT)
      const result = await getEvents(filters)
      clearTimeout(timeout)

      if (!controller.signal.aborted) {
        setEvents(result)
        setTotalCount(result.length)
      }
    } catch (_err) {
      if (!controller.signal.aborted) {
        toast.error('Timeout ao carregar eventos. Tente filtros mais restritivos.')
      }
    } finally {
      if (!controller.signal.aborted) setLoading(false)
    }
  }, [filters])

  const estimatedSize = useMemo(() => {
    if (events.length === 0) return { json: 0, jsonl: 0, csv: 0 }
    const sample = events.slice(0, Math.min(events.length, 100))
    const avgJson = estimateExportSize(sample, 'json') / sample.length
    const avgJsonl = estimateExportSize(sample, 'jsonl') / sample.length
    const avgCsv = estimateExportSize(sample, 'csv') / sample.length
    return {
      json: Math.round((avgJson * events.length) / 1024),
      jsonl: Math.round((avgJsonl * events.length) / 1024),
      csv: Math.round((avgCsv * events.length) / 1024),
    }
  }, [events])

  const previewEvents = useMemo(() => events.slice(0, 10), [events])

  const handleExport = useCallback(
    async (format: 'json' | 'jsonl' | 'csv') => {
      setExporting(true)
      try {
        let content: string
        let mime: string
        let ext: string

        if (format === 'json') {
          content = exportJSON(events)
          mime = 'application/json'
          ext = 'json'
        } else if (format === 'jsonl') {
          content = exportJSONL(events)
          mime = 'application/jsonl'
          ext = 'jsonl'
        } else {
          content = exportCSV(events)
          mime = 'text/csv'
          ext = 'csv'
        }

        const blob = new Blob([content], { type: mime })
        const file = new File([blob], `nostr-cache-export.${ext}`, { type: mime })

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: 'Eventos do Cache Nostr' })
        } else {
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = file.name
          a.click()
          URL.revokeObjectURL(url)
        }
        toast.success(`Exportado como ${format.toUpperCase()}`)
      } catch (_err) {
        toast.error('Falha ao exportar.')
      } finally {
        setExporting(false)
      }
    },
    [events],
  )

  const copyEventIds = useCallback(() => {
    const ids = events.map((e) => e.id).join('\n')
    navigator.clipboard
      .writeText(ids)
      .then(() => {
        toast.success(`${events.length} IDs copiados`)
      })
      .catch(() => toast.error('Falha ao copiar'))
  }, [events])

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader title="Filtros" icon={Search} />
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">Kind</label>
              <select
                className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
                value={filters.kind ?? ''}
                onChange={(e) => setFilters((f) => ({ ...f, kind: e.target.value ? Number(e.target.value) : null }))}
              >
                <option value="">Todos</option>
                {availableKinds.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">Pubkey</label>
              <input
                className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
                placeholder="hex pubkey"
                value={filters.pubkey ?? ''}
                onChange={(e) => setFilters((f) => ({ ...f, pubkey: e.target.value || undefined }))}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">Relay</label>
              <select
                className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
                value={filters.relay ?? ''}
                onChange={(e) => setFilters((f) => ({ ...f, relay: e.target.value || undefined }))}
              >
                <option value="">Todos</option>
                {availableRelays.map((r) => (
                  <option key={r} value={r}>
                    {r.replace('wss://', '').replace('ws://', '')}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-xs font-medium text-zinc-500 mb-1">Desde</label>
                <input
                  type="date"
                  className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
                  value={filters.since ? new Date(filters.since * 1000).toISOString().split('T')[0] : ''}
                  onChange={(e) =>
                    setFilters((f) => ({
                      ...f,
                      since: e.target.value ? Math.floor(new Date(e.target.value).getTime() / 1000) : null,
                    }))
                  }
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-zinc-500 mb-1">Ate</label>
                <input
                  type="date"
                  className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
                  value={filters.until ? new Date(filters.until * 1000).toISOString().split('T')[0] : ''}
                  onChange={(e) =>
                    setFilters((f) => ({
                      ...f,
                      until: e.target.value ? Math.floor(new Date(e.target.value).getTime() / 1000) : null,
                    }))
                  }
                />
              </div>
            </div>
          </div>
          <Button onClick={loadEvents} disabled={loading} className="mt-3">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Search className="w-4 h-4 mr-2" />}
            {loading ? 'Buscando...' : 'Buscar'}
          </Button>
        </CardContent>
      </Card>

      {events.length > 0 && (
        <>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <span className="text-sm text-zinc-500">
                <strong className="text-zinc-900 dark:text-zinc-100">{totalCount}</strong> eventos encontrados
              </span>
              <Badge variant="outline">JSON ~{estimatedSize.json}KB</Badge>
              <Badge variant="outline">JSONL ~{estimatedSize.jsonl}KB</Badge>
              <Badge variant="outline">CSV ~{estimatedSize.csv}KB</Badge>
            </div>
            <Button variant="ghost" size="sm" onClick={copyEventIds}>
              <Copy className="w-4 h-4 mr-1" />
              Copiar IDs
            </Button>
          </div>

          <Card>
            <CardHeader title="Preview (primeiros 10)" icon={FileText} />
            <CardContent className="max-h-80 overflow-auto">
              <pre className="text-xs font-mono text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                {JSON.stringify(
                  previewEvents.map((e) => ({
                    id: e.id.slice(0, 16) + '...',
                    kind: e.kind,
                    pubkey: e.pubkey.slice(0, 16) + '...',
                    created_at: new Date(e.createdAt * 1000).toISOString(),
                    relay: e.relay,
                  })),
                  null,
                  2,
                )}
              </pre>
            </CardContent>
          </Card>

          <div className="flex flex-wrap gap-3">
            <Button onClick={() => handleExport('json')} disabled={exporting}>
              <FileJson className="w-4 h-4 mr-2" />
              Exportar JSON
            </Button>
            <Button onClick={() => handleExport('jsonl')} disabled={exporting} variant="secondary">
              <FileText className="w-4 h-4 mr-2" />
              Exportar JSONL
            </Button>
            <Button onClick={() => handleExport('csv')} disabled={exporting} variant="outline">
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
        </>
      )}

      {events.length === 0 && !loading && (
        <Card>
          <CardContent className="py-8 text-center text-zinc-400">
            Aplique filtros e clique em "Buscar" para listar eventos do cache.
          </CardContent>
        </Card>
      )}
    </div>
  )
}
