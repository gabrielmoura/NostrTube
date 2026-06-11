import { Activity, Database, Network, RefreshCw } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  getNexusHistory,
  getNexusWindowLabel,
  type NexusHistoryPoint,
  type NexusWindowKey,
  recordNexusSnapshot,
} from '@/features/debug/services/nexus-metrics.service'
import { type NexusDebugSnapshot, ndkNexusBridge } from '@/lib/nexus-p2p'
import { Badge, Card, CardContent, CardHeader } from '@/routes/configurarion/@components/CommonComponents.tsx'

interface NexusChartPoint extends NexusHistoryPoint {
  time: string
}

function formatChartData(history: NexusHistoryPoint[]): NexusChartPoint[] {
  return history.map((point) => ({
    ...point,
    time: new Date(point.at).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
  }))
}

export function NexusMetricsTab() {
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [windowKey, setWindowKey] = useState<NexusWindowKey>('2m')
  const [snapshot, setSnapshot] = useState<NexusDebugSnapshot>(() => ndkNexusBridge.getDebugSnapshot())
  const [chartData, setChartData] = useState<NexusChartPoint[]>(() => formatChartData(getNexusHistory('2m')))
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const refresh = useCallback(() => {
    const nextSnapshot = ndkNexusBridge.getDebugSnapshot()
    recordNexusSnapshot(nextSnapshot)
    setSnapshot(nextSnapshot)
    setChartData(formatChartData(getNexusHistory(windowKey)))
  }, [windowKey])

  useEffect(() => {
    refresh()
  }, [refresh])

  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(refresh, 5000)
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [autoRefresh, refresh])

  const totals = [
    { name: 'Servidos', value: snapshot.cacheStats.served },
    { name: 'Recebidos', value: snapshot.cacheStats.received },
    { name: 'Cacheados', value: snapshot.cacheStats.cached },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={snapshot.enabled ? 'success' : 'destructive'}>
            {snapshot.enabled ? 'Nexus ativo' : 'Nexus desligado'}
          </Badge>
          <Badge variant={snapshot.signalingOpen ? 'success' : 'outline'}>
            {snapshot.signalingOpen ? 'WS conectado' : 'WS offline'}
          </Badge>
          <Badge variant={snapshot.unifiedWithNdkCache ? 'success' : 'warning'}>
            {snapshot.unifiedWithNdkCache ? 'Cache unificado com NDK' : 'Fallback isolado'}
          </Badge>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(['30s', '2m', '10m'] as NexusWindowKey[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setWindowKey(key)}
              className={`rounded-lg px-3 py-1 text-xs transition-colors ${
                windowKey === key
                  ? 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300'
                  : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
              }`}
            >
              {getNexusWindowLabel(key)}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setAutoRefresh((current) => !current)}
            className={`inline-flex items-center gap-1 rounded-lg px-3 py-1 text-xs transition-colors ${
              autoRefresh
                ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
                : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
            }`}
          >
            <RefreshCw className={`h-3 w-3 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'Auto 5s' : 'Manual'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader title="Estado do sidecar" icon={Network} />
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900">
                <p className="mb-1 text-xs text-zinc-500">Relay</p>
                <p className="break-all text-xs font-mono text-zinc-700 dark:text-zinc-300">{snapshot.relayUrl}</p>
              </div>
              <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900">
                <p className="mb-1 text-xs text-zinc-500">Backend</p>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{snapshot.storageBackend}</p>
              </div>
              <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900">
                <p className="mb-1 text-xs text-zinc-500">Peers</p>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{snapshot.peerCount}</p>
              </div>
              <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900">
                <p className="mb-1 text-xs text-zinc-500">Requests pendentes</p>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{snapshot.pendingRequestCount}</p>
              </div>
              <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900">
                <p className="mb-1 text-xs text-zinc-500">Anuncios em fila</p>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {snapshot.queuedAnnouncementCount}
                </p>
              </div>
              <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900">
                <p className="mb-1 text-xs text-zinc-500">Started</p>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {snapshot.started ? 'sim' : 'nao'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Totais Nexus" icon={Database} />
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={totals}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" opacity={0.2} />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]} fill="#06b6d4" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader title="Fila e conectividade" icon={Activity} />
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" opacity={0.2} />
                  <XAxis dataKey="time" minTickGap={24} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="peers" stroke="#22c55e" strokeWidth={2} dot={false} name="Peers" />
                  <Line
                    type="monotone"
                    dataKey="pending"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={false}
                    name="Pendentes"
                  />
                  <Line type="monotone" dataKey="queued" stroke="#8b5cf6" strokeWidth={2} dot={false} name="Anuncios" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Fluxo de eventos" icon={Database} />
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" opacity={0.2} />
                  <XAxis dataKey="time" minTickGap={24} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="served"
                    stackId="nexus"
                    stroke="#ef4444"
                    fill="#ef4444"
                    fillOpacity={0.25}
                    name="Servidos"
                  />
                  <Area
                    type="monotone"
                    dataKey="received"
                    stackId="nexus"
                    stroke="#06b6d4"
                    fill="#06b6d4"
                    fillOpacity={0.25}
                    name="Recebidos"
                  />
                  <Area
                    type="monotone"
                    dataKey="cached"
                    stackId="nexus"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.25}
                    name="Cacheados"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
