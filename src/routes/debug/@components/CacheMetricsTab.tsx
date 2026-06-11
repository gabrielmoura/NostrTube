import { Activity, Database, HardDrive, RefreshCw } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Progress } from '@/components/ui/progress.tsx'
import type { CacheMetrics, StorageQuota, StoreSize } from '@/features/debug/services/metrics.service.ts'
import {
  getAllStoreSizes,
  getCacheMetrics,
  getReadRate,
  getStorageQuota,
  getWriteRate,
} from '@/features/debug/services/metrics.service.ts'
import { Badge, Card, CardContent, CardHeader } from '@/routes/configurarion/@components/CommonComponents.tsx'

interface MetricsDisplay {
  label: string
  value: string
  badge?: { text: string; variant: 'success' | 'warning' | 'destructive' | 'default' }
}

export function CacheMetricsTab() {
  const [metrics, setMetrics] = useState<CacheMetrics | null>(null)
  const [quota, setQuota] = useState<StorageQuota | null>(null)
  const [storeSizes, setStoreSizes] = useState<StoreSize[]>([])
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [readRate, setReadRate] = useState(0)
  const [writeRate, setWriteRate] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const [m, q, sizes] = await Promise.all([getCacheMetrics(), getStorageQuota(), getAllStoreSizes()])
      setMetrics(m)
      setQuota(q)
      setStoreSizes(sizes)
      setReadRate(getReadRate())
      setWriteRate(getWriteRate())
    } catch {
      // DB not ready yet
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(fetchData, 5000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [autoRefresh, fetchData])

  const metricsList: MetricsDisplay[] = metrics
    ? [
        { label: 'Total de eventos', value: metrics.totalEvents.toLocaleString() },
        { label: 'Perfis em cache', value: metrics.profileCount.toLocaleString() },
        { label: 'Tags de eventos', value: metrics.eventTagCount.toLocaleString() },
        { label: 'Entradas NIP-05', value: metrics.nip05Count.toLocaleString() },
        { label: 'Entradas LNURL', value: metrics.lnurlCount.toLocaleString() },
        {
          label: 'Eventos duplicados',
          value: metrics.duplicateCount.toLocaleString(),
          badge:
            metrics.duplicateCount > 0
              ? { text: `${metrics.duplicateCount} duplicatas`, variant: 'warning' as const }
              : { text: '0 duplicatas', variant: 'success' as const },
        },
        {
          label: 'Evento mais antigo',
          value: metrics.oldestEvent
            ? new Date(metrics.oldestEvent.createdAt * 1000).toLocaleDateString('pt-BR')
            : 'N/A',
        },
        {
          label: 'Evento mais recente',
          value: metrics.newestEvent
            ? new Date(metrics.newestEvent.createdAt * 1000).toLocaleDateString('pt-BR')
            : 'N/A',
        },
      ]
    : []

  const totalByKind = metrics ? metrics.eventsByKind.reduce((s, e) => s + e.count, 0) : 0
  const topKinds =
    metrics?.eventsByKind.slice(0, 8).map((entry) => ({
      name: `kind ${entry.kind}`,
      count: entry.count,
    })) ?? []

  const [relaySortKey, setRelaySortKey] = useState<'relay' | 'count'>('count')
  const [relaySortDir, setRelaySortDir] = useState<'asc' | 'desc'>('desc')
  const sortedRelays = metrics
    ? [...metrics.eventsByRelay].sort((a, b) => {
        const mul = relaySortDir === 'desc' ? -1 : 1
        if (relaySortKey === 'count') return (a.count - b.count) * mul
        return a.relay.localeCompare(b.relay) * mul
      })
    : []

  function toggleRelaySort(key: 'relay' | 'count') {
    if (relaySortKey === key) {
      setRelaySortDir((d) => (d === 'desc' ? 'asc' : 'desc'))
    } else {
      setRelaySortKey(key)
      setRelaySortDir('desc')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant={autoRefresh ? 'success' : 'outline'}>Auto-refresh: {autoRefresh ? '5s' : 'off'}</Badge>
          <Badge variant="outline">Reads/s: {readRate.toFixed(1)}</Badge>
          <Badge variant="outline">Writes/s: {writeRate.toFixed(1)}</Badge>
        </div>
        <button
          onClick={() => setAutoRefresh((p) => !p)}
          className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-colors ${
            autoRefresh
              ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
              : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
          }`}
        >
          <RefreshCw className={`w-3 h-3 ${autoRefresh ? 'animate-spin' : ''}`} />
          {autoRefresh ? 'Auto' : 'Manual'}
        </button>
      </div>

      {quota && (
        <Card>
          <CardHeader title="Armazenamento" icon={HardDrive} />
          <CardContent className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-zinc-500">Quota utilizada</span>
                <span className="font-mono text-zinc-900 dark:text-zinc-100">
                  {quota.usagePercent}% ({Math.round(quota.usage / 1024 / 1024)}MB /{' '}
                  {Math.round(quota.quota / 1024 / 1024)}MB)
                </span>
              </div>
              <Progress value={quota.usagePercent} className="h-2.5" />
            </div>
          </CardContent>
        </Card>
      )}

      {metrics && (
        <Card>
          <CardHeader title="Métricas gerais" icon={Activity} />
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {metricsList.map((m) => (
                <div key={m.label} className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
                  <p className="text-xs text-zinc-500 mb-1">{m.label}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{m.value}</span>
                    {m.badge && <Badge variant={m.badge.variant}>{m.badge.text}</Badge>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader title="Distribuição por kind" icon={Database} />
          <CardContent>
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topKinds} layout="vertical" margin={{ left: 8, right: 16 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" opacity={0.2} />
                    <XAxis type="number" allowDecimals={false} />
                    <YAxis type="category" dataKey="name" width={72} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#6366f1" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 max-h-64 overflow-y-auto space-y-1">
                {metrics?.eventsByKind.slice(0, 15).map((k, i) => {
                  const colors = [
                    '#6366f1',
                    '#8b5cf6',
                    '#a855f7',
                    '#d946ef',
                    '#ec4899',
                    '#f43f5e',
                    '#f97316',
                    '#eab308',
                    '#22c55e',
                    '#14b8a6',
                    '#06b6d4',
                    '#3b82f6',
                  ]
                  const pct = Math.round((k.count / totalByKind) * 100)
                  return (
                    <div key={k.kind} className="flex items-center gap-2 text-xs">
                      <span className="w-3 h-3 rounded" style={{ backgroundColor: colors[i % colors.length] }} />
                      <span className="text-zinc-500 w-16">kind {k.kind}</span>
                      <div className="flex-1 h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${pct}%`, backgroundColor: colors[i % colors.length] }}
                        />
                      </div>
                      <span className="text-zinc-700 dark:text-zinc-300 font-mono w-16 text-right">{k.count}</span>
                      <span className="text-zinc-400 w-8 text-right">{pct}%</span>
                    </div>
                  )
                })}
                {(metrics?.eventsByKind.length ?? 0) > 15 && (
                  <p className="text-xs text-zinc-400 pt-1">+{metrics!.eventsByKind.length - 15} kinds adicionais</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="IndexedDB stores" icon={Database} />
          <CardContent>
            <div className="space-y-2">
              {storeSizes.map((s) => {
                const maxCount = Math.max(...storeSizes.map((x) => x.count), 1)
                const pct = Math.round((s.count / maxCount) * 100)
                return (
                  <div key={s.store} className="flex items-center gap-2 text-xs">
                    <span className="text-zinc-500 w-32">{s.store}</span>
                    <div className="flex-1 h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-zinc-700 dark:text-zinc-300 font-mono w-16 text-right">
                      {s.count.toLocaleString()}
                    </span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader title="Eventos por relay" icon={Activity} />
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800">
                  <th
                    className="text-left py-2 px-2 font-medium text-zinc-500 cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-100"
                    onClick={() => toggleRelaySort('relay')}
                  >
                    Relay {relaySortKey === 'relay' ? (relaySortDir === 'desc' ? '↓' : '↑') : ''}
                  </th>
                  <th
                    className="text-right py-2 px-2 font-medium text-zinc-500 cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-100"
                    onClick={() => toggleRelaySort('count')}
                  >
                    Eventos {relaySortKey === 'count' ? (relaySortDir === 'desc' ? '↓' : '↑') : ''}
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedRelays.map((r) => (
                  <tr
                    key={r.relay}
                    className="border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                  >
                    <td className="py-1.5 px-2 text-zinc-700 dark:text-zinc-300 font-mono">{r.relay}</td>
                    <td className="py-1.5 px-2 text-right font-mono text-zinc-900 dark:text-zinc-100">{r.count}</td>
                  </tr>
                ))}
                {sortedRelays.length === 0 && (
                  <tr>
                    <td colSpan={2} className="py-4 text-center text-zinc-400">
                      Nenhum evento com relay registrado
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {!metrics && (
        <Card>
          <CardContent className="py-8 text-center text-zinc-400">
            Cache NDK nao disponivel ou ainda inicializando.
          </CardContent>
        </Card>
      )}
    </div>
  )
}
