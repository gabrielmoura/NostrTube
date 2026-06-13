import { createRoute, Link } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import {
  Activity,
  ArrowDown,
  ArrowUp,
  BarChart3,
  ChevronRight,
  Database,
  GripVertical,
  Network,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  Trash2,
  Wifi,
  WifiHigh,
} from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { MetricCard } from '@/components/ui/metric-card'
import { PageSpinner } from '@/components/PageSpinner'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusBadge } from '@/components/ui/status-badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useRelayHealth, type RelayHealthRow, type RelayHealthState } from '@/features/relays/hooks/useRelayHealth'
import { useRelayMetrics } from '@/features/relays/hooks/useRelayMetrics'
import { useUserRelays } from '@/features/relays/hooks/useUserRelays'
import { Route as rootRoute } from '@/routes/__root'

type RelayTab = 'mine' | 'public' | 'add'
type StatusFilter = 'all' | RelayHealthState

function classifyLatency(latency: number | null) {
  if (latency === null) return 'Indisponível'
  if (latency < 200) return 'Excelente'
  if (latency < 500) return 'Boa'
  if (latency < 1000) return 'Instável'
  return 'Crítica'
}

function formatLatency(latency: number | null | undefined) {
  if (latency === undefined) return '...'
  if (latency === null) return '—'
  return `${latency}ms`
}

function formatConnection(attempts: number | null, successCount: number | null) {
  if (attempts === null && successCount === null) return '—'
  return `${successCount ?? 0}/${attempts ?? 0}`
}

function EmptyRelaysState({ onAdd }: { onAdd: () => void }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center gap-4 py-12 text-center">
        <div className="rounded-2xl border border-border/70 bg-secondary/50 p-4 text-primary">
          <Wifi className="size-6" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Nenhum relay configurado ainda.</h3>
          <p className="max-w-md text-sm text-muted-foreground">
            Adicione ao menos um relay seguro para publicar e ler eventos na rede Nostr.
          </p>
        </div>
        <Button variant="gradient" onClick={onAdd}>
          <Plus className="size-4" />
          Adicionar relay
        </Button>
      </CardContent>
    </Card>
  )
}

function RelayMetricsDialog({
  relay,
  metrics,
  onOpenChange,
}: {
  relay: RelayHealthRow | null
  metrics: { events5m: number | null; cachedTotal: number | null } | null
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={Boolean(relay)} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Métricas do relay</DialogTitle>
          <DialogDescription>
            Dados reais quando disponíveis. Informações indisponíveis permanecem marcadas como `—`.
          </DialogDescription>
        </DialogHeader>

        {relay ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <MetricCard title="Status" value={relay.label} description={relay.url} icon={WifiHigh} tone={relay.state === 'connected' ? 'success' : 'relay'} />
            <MetricCard title="Latência" value={formatLatency(relay.latency)} description={classifyLatency(relay.latency ?? null)} icon={Activity} tone="relay" />
            <MetricCard title="Eventos recebidos (5m)" value={metrics?.events5m === null ? '—' : String(metrics?.events5m ?? '—')} description="Últimos 5 minutos do cache local." icon={Database} tone="default" />
            <MetricCard title="Taxa de sucesso" value={formatConnection(relay.attempts, relay.successCount)} description="Sucessos / tentativas da conexão." icon={BarChart3} tone="success" />
          </div>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/relays',
  component: RelaysPage,
})

function RelaysPage() {
  const [activeTab, setActiveTab] = useState<RelayTab>('mine')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [manualRelayUrl, setManualRelayUrl] = useState('')
  const [manualRelayError, setManualRelayError] = useState<string | null>(null)
  const [selectedMetricsRelay, setSelectedMetricsRelay] = useState<string | null>(null)

  const { selectedRelays, publicRelays, allKnownRelays, relayDirectoryQuery, addRelay, removeRelay, reorderRelay } = useUserRelays()
  const relayHealth = useRelayHealth(allKnownRelays)
  const relayMetrics = useRelayMetrics(allKnownRelays)

  const rows = useMemo(
    () =>
      selectedRelays
        .map((relayUrl) => {
          const health = relayHealth.rows.find((row) => row.url === relayUrl)
          const metrics = relayMetrics.rowMap.get(relayUrl)
          return {
            url: relayUrl,
            health,
            metrics,
          }
        })
        .filter((row) => {
          const matchesSearch = row.url.toLowerCase().includes(search.toLowerCase())
          const matchesStatus = statusFilter === 'all' || row.health?.state === statusFilter
          return matchesSearch && matchesStatus
        }),
    [relayHealth.rows, relayMetrics.rowMap, search, selectedRelays, statusFilter],
  )

  const publicRelayRows = useMemo(
    () =>
      publicRelays
        .filter((relayUrl) => relayUrl.toLowerCase().includes(search.toLowerCase()))
        .map((relayUrl) => ({
          url: relayUrl,
          selected: selectedRelays.includes(relayUrl),
          health: relayHealth.rows.find((row) => row.url === relayUrl),
          metrics: relayMetrics.rowMap.get(relayUrl),
        })),
    [publicRelays, relayHealth.rows, relayMetrics.rowMap, search, selectedRelays],
  )

  const connectedPercent = selectedRelays.length > 0 ? Math.round((relayHealth.connectedCount / selectedRelays.length) * 100) : 0
  const selectedMetricsHealth = relayHealth.rows.find((row) => row.url === selectedMetricsRelay) ?? null
  const selectedMetrics = selectedMetricsRelay ? relayMetrics.rowMap.get(selectedMetricsRelay) ?? null : null

  const layoutAside = (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Visão geral da conexão</CardTitle>
          <CardDescription>{relayHealth.connectedCount} conectados de {selectedRelays.length} configurados.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Progress value={connectedPercent} className="h-3" />
          <div className="flex flex-wrap gap-2">
            <StatusBadge tone={selectedRelays.length === 0 ? 'warning' : connectedPercent >= 80 ? 'healthy' : connectedPercent >= 40 ? 'partial' : 'danger'}>
              {selectedRelays.length === 0 ? 'Sem relays' : connectedPercent >= 80 ? 'Rede saudável' : connectedPercent >= 40 ? 'Parcial' : 'Instável'}
            </StatusBadge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Distribuição da rede</CardTitle>
          <CardDescription>Eventos recentes por relay quando o cache local fornece esse dado.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {relayMetrics.isError ? (
            <p className="text-sm text-muted-foreground">Métrica indisponível no cache local atual.</p>
          ) : rows.length > 0 ? (
            rows.slice(0, 5).map((row) => {
              const events5m = row.metrics?.events5m ?? 0
              const total = relayMetrics.totalEvents5m || 1
              return (
                <div key={row.url} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span className="truncate">{row.url.replace(/^wss?:\/\//, '')}</span>
                    <span>{events5m}</span>
                  </div>
                  <Progress value={Math.round((events5m / total) * 100)} className="h-2" />
                </div>
              )
            })
          ) : (
            <p className="text-sm text-muted-foreground">Sem dados suficientes para distribuição real no momento.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dicas sobre relays</CardTitle>
          <CardDescription>Boas práticas para manter uma malha estável.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div className="flex items-start gap-2"><ChevronRight className="mt-0.5 size-4 text-primary" />Use múltiplos relays para reduzir falhas isoladas.</div>
          <div className="flex items-start gap-2"><ChevronRight className="mt-0.5 size-4 text-primary" />Acompanhe a latência antes de promover um relay a principal.</div>
          <div className="flex items-start gap-2"><ChevronRight className="mt-0.5 size-4 text-primary" />Privacidade primeiro: prefira endpoints confiáveis e seguros.</div>
        </CardContent>
      </Card>
    </>
  )

  const handleAddManualRelay = () => {
    const normalized = manualRelayUrl.trim()
    if (!normalized.startsWith('wss://')) {
      setManualRelayError(
        normalized.startsWith('ws://')
          ? 'Relays inseguros com ws:// não são aceitos. Use apenas wss://.'
          : 'Informe um relay válido começando com wss://.',
      )
      return
    }

    addRelay(normalized)
    setManualRelayUrl('')
    setManualRelayError(null)
    setActiveTab('mine')
  }

  const shouldShowLoading = relayDirectoryQuery.isLoading && selectedRelays.length === 0

  if (shouldShowLoading) {
    return (
      <AppShell
        activeKey="relays"
        title="Relays"
        description="Conecte-se à rede Nostr através de múltiplos relays."
        icon={Network}
        eyebrow="Fase 2"
        badge="Dados reais"
        aside={layoutAside}
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-32 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-[420px] rounded-2xl" />
      </AppShell>
    )
  }

  return (
    <AppShell
      activeKey="relays"
      title="Relays"
      description="Conecte-se à rede Nostr através de múltiplos relays."
      icon={Network}
      eyebrow="Fase 2"
      badge="Relay Cinema"
      aside={layoutAside}
      actions={
        <>
          <Button variant="glass" onClick={() => void relayHealth.testAllRelays()} disabled={relayHealth.isTestingAll || allKnownRelays.length === 0}>
            <RefreshCw className={`size-4 ${relayHealth.isTestingAll ? 'animate-spin' : ''}`} />
            Testar todos
          </Button>
          <Button variant="gradient" onClick={() => setActiveTab('add')}>
            <Plus className="size-4" />
            Adicionar relay
          </Button>
        </>
      }
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Relays conectados"
          value={`${relayHealth.connectedCount} / ${selectedRelays.length}`}
          description={selectedRelays.length > 0 ? `${connectedPercent}% online` : '0 / 0'}
          icon={WifiHigh}
          tone="success"
        />
        <MetricCard
          title="Latência média"
          value={relayHealth.avgLatency === null ? '—' : `${relayHealth.avgLatency}ms`}
          description={classifyLatency(relayHealth.avgLatency)}
          icon={Activity}
          tone="relay"
        />
        <MetricCard
          title="Eventos recebidos"
          value={relayMetrics.totalEvents5m === null ? '—' : String(relayMetrics.totalEvents5m)}
          description={relayMetrics.isError ? 'Indisponível' : 'Últimos 5 minutos'}
          icon={Database}
          tone="default"
        />
        <MetricCard
          title="Taxa de sucesso"
          value={relayHealth.successRate === null ? '—' : `${relayHealth.successRate}%`}
          description={relayHealth.successRate === null ? 'Indisponível' : 'Conexões bem-sucedidas'}
          icon={BarChart3}
          tone="success"
        />
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as RelayTab)} className="w-full">
        <TabsList className="mb-6 flex h-auto w-full flex-wrap justify-start gap-2 rounded-2xl border border-border/70 bg-card/70 p-2">
          <TabsTrigger value="mine" className="rounded-xl">Meus relays</TabsTrigger>
          <TabsTrigger value="public" className="rounded-xl">Relays públicos</TabsTrigger>
          <TabsTrigger value="add" className="rounded-xl">Adicionar relay</TabsTrigger>
        </TabsList>

        <TabsContent value="mine" className="space-y-4">
          <Card>
            <CardContent className="flex flex-col gap-3 py-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-1 flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar relays..." className="pl-9" />
                </div>
                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Todos os status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="connected">Conectado</SelectItem>
                    <SelectItem value="connecting">Conectando</SelectItem>
                    <SelectItem value="unstable">Instável</SelectItem>
                    <SelectItem value="offline">Offline</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="glass" onClick={() => void relayHealth.testAllRelays()} disabled={relayHealth.isTestingAll || selectedRelays.length === 0}>
                  <RefreshCw className={`size-4 ${relayHealth.isTestingAll ? 'animate-spin' : ''}`} />
                  Testar todos
                </Button>
                <Button variant="gradient" onClick={() => setActiveTab('add')}>
                  <Plus className="size-4" />
                  Adicionar relay
                </Button>
              </div>
            </CardContent>
          </Card>

          {selectedRelays.length === 0 ? (
            <EmptyRelaysState onAdd={() => setActiveTab('add')} />
          ) : (
            <Card>
              <CardContent className="overflow-x-auto p-0">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/70 text-left text-xs uppercase tracking-[0.16em] text-muted-foreground">
                      <th className="px-4 py-3">Mover</th>
                      <th className="px-4 py-3">Relay</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Latência</th>
                      <th className="px-4 py-3">Eventos (5m)</th>
                      <th className="px-4 py-3">Leitura</th>
                      <th className="px-4 py-3">Escrita</th>
                      <th className="px-4 py-3">Conexão</th>
                      <th className="px-4 py-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.url} className="border-b border-border/50 align-top last:border-b-0">
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <GripVertical className="size-4" />
                            <div className="flex flex-col">
                              <button type="button" className="rounded p-1 hover:bg-secondary" onClick={() => reorderRelay(row.url, 'up')} aria-label="Mover para cima">
                                <ArrowUp className="size-3.5" />
                              </button>
                              <button type="button" className="rounded p-1 hover:bg-secondary" onClick={() => reorderRelay(row.url, 'down')} aria-label="Mover para baixo">
                                <ArrowDown className="size-3.5" />
                              </button>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="space-y-1">
                            <p className="font-medium text-foreground">{row.url.replace(/^wss?:\/\//, '')}</p>
                            <p className="font-mono text-xs text-muted-foreground">{row.url}</p>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <StatusBadge tone={row.health?.tone ?? 'warning'}>{row.health?.label ?? 'Offline'}</StatusBadge>
                        </td>
                        <td className="px-4 py-4 font-mono text-sm">{formatLatency(row.health?.latency)}</td>
                        <td className="px-4 py-4 font-mono text-sm">{row.metrics?.events5m ?? '—'}</td>
                        <td className="px-4 py-4 text-muted-foreground">—</td>
                        <td className="px-4 py-4 text-muted-foreground">—</td>
                        <td className="px-4 py-4 font-mono text-sm">{formatConnection(row.health?.attempts ?? null, row.health?.successCount ?? null)}</td>
                        <td className="px-4 py-4">
                          <div className="flex justify-end gap-2">
                            <Button variant="glass" size="sm" onClick={() => setSelectedMetricsRelay(row.url)}>
                              Ver métricas
                            </Button>
                            <Link to="/configuration" className={buttonVariants({ variant: "outline", size: "sm" })}>
                              Configurar
                            </Link>
                            <Button variant="dangerSoft" size="sm" onClick={() => removeRelay(row.url)}>
                              <Trash2 className="size-4" />
                              Remover
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="public" className="space-y-4">
          {relayDirectoryQuery.isError ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
                <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-destructive">
                  <Wifi className="size-6" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Não foi possível carregar seus relays.</h3>
                  <p className="text-sm text-muted-foreground">O diretório público falhou. Seus relays atuais continuam disponíveis na aba principal.</p>
                </div>
                <Button variant="outline" onClick={() => void relayDirectoryQuery.refetch()}>Tentar novamente</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
              {publicRelayRows.map((row) => (
                <Card key={row.url}>
                  <CardContent className="space-y-4 py-5">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-foreground">{row.url.replace(/^wss?:\/\//, '')}</p>
                        <StatusBadge tone={row.health?.tone ?? 'warning'}>{row.selected ? 'Adicionado' : row.health?.label ?? 'Disponível'}</StatusBadge>
                      </div>
                      <p className="font-mono text-xs text-muted-foreground">{row.url}</p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Latência</p>
                        <p className="mt-1 font-mono text-sm">{formatLatency(row.health?.latency)}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Eventos (5m)</p>
                        <p className="mt-1 font-mono text-sm">{row.metrics?.events5m ?? '—'}</p>
                      </div>
                    </div>
                    <Button variant={row.selected ? 'glass' : 'relay'} onClick={() => addRelay(row.url)} disabled={row.selected}>
                      <Plus className="size-4" />
                      {row.selected ? 'Já adicionado' : 'Adicionar relay'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="add" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Adicionar relay</CardTitle>
              <CardDescription>
                Use relays `wss://` para garantir compatibilidade com a pool atual. A configuração é persistida localmente e sincronizada imediatamente.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="relay-url" className="text-sm font-medium text-foreground">Relay URL</label>
                <Input
                  id="relay-url"
                  value={manualRelayUrl}
                  onChange={(event) => {
                    setManualRelayUrl(event.target.value)
                    setManualRelayError(null)
                  }}
                  placeholder="wss://relay.example.com"
                />
                {manualRelayError ? <p className="text-sm text-destructive">{manualRelayError}</p> : null}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="gradient" onClick={handleAddManualRelay}>Salvar relay</Button>
                <Button variant="outline" onClick={() => setActiveTab('mine')}>Voltar para meus relays</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <RelayMetricsDialog relay={selectedMetricsHealth} metrics={selectedMetrics} onOpenChange={(open) => !open && setSelectedMetricsRelay(null)} />
    </AppShell>
  )
}
