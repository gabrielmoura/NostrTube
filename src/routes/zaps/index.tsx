import { useNDKCurrentUser } from '@nostr-dev-kit/ndk-hooks'
import { useDebouncedValue } from '@tanstack/react-pacer'
import { createRoute, Link } from '@tanstack/react-router'
import { ArrowRight, BarChart3, HandCoins, HeartHandshake, Search, Sparkles, Target, Wallet, Zap } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { AuthModal } from '@/components/AuthModal'
import { AppShell } from '@/components/layout/AppShell'
import { modal } from '@/components/modal_v2/modal-manager'
import { PageSpinner } from '@/components/PageSpinner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { MetricCard } from '@/components/ui/metric-card'
import { StatusBadge } from '@/components/ui/status-badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useTopSupporters } from '@/features/zap/hooks/useTopSupporters'
import { useZapActivity } from '@/features/zap/hooks/useZapActivity'
import { useZapGoals } from '@/features/zap/hooks/useZapGoals'
import { useZapStats } from '@/features/zap/hooks/useZapStats'
import { Route as rootRoute } from '@/routes/__root'

type ZapTab = 'received' | 'sent' | 'goals' | 'campaigns'
type TimeRange = 'seven' | 'thirty' | 'ninety'

function formatSats(value: number | null, tooltipReason?: string) {
  if (value === null) return <UnavailableValue reason={tooltipReason} />
  return `${value.toLocaleString('pt-BR')} sats`
}

function formatDate(timestamp: number) {
  return new Date(timestamp * 1000).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function trimPubkey(pubkey: string | null) {
  if (!pubkey) return '—'
  return `${pubkey.slice(0, 8)}…${pubkey.slice(-4)}`
}

/** Exibe "—" com tooltip nativa indicando que o valor está indisponível. */
function UnavailableValue({ reason = 'Indisponível no momento.' }: { reason?: string }) {
  return <span title={reason}>—</span>
}

/** Mapeia o status do item de atividade para exibição na tabela.
 *  Preparado para suportar 'pending' e 'failed' quando o dado estiver disponível. */
function statusConfig(status: string): { label: string; tone: 'healthy' | 'partial' | 'danger' } {
  switch (status) {
    case 'confirmed':
      return { label: 'Confirmado', tone: 'healthy' }
    case 'pending':
      return { label: 'Pendente', tone: 'partial' }
    case 'failed':
      return { label: 'Falhou', tone: 'danger' }
    default:
      return { label: status, tone: 'healthy' }
  }
}

function EmptyZapsState() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center gap-4 py-12 text-center">
        <div className="rounded-2xl border border-border/70 bg-secondary/50 p-4 text-[oklch(var(--lightning))]">
          <HandCoins className="size-6" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Ainda não há Zaps por aqui.</h3>
          <p className="max-w-xl text-sm text-muted-foreground">
            Quando recebimentos ou apoios com NIP-57 estiverem visíveis nos relays consultados, esta tela mostrará
            atividade real sem inventar valores monetários.
          </p>
        </div>
        <Link to="/search" className={buttonVariants({ variant: 'gradient' })}>
          Explorar criadores
        </Link>
      </CardContent>
    </Card>
  )
}

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/zaps',
  component: ZapsPage,
})

function ZapsPage() {
  const currentUser = useNDKCurrentUser()
  const [activeTab, setActiveTab] = useState<ZapTab>('received')
  const [timeRange, setTimeRange] = useState<TimeRange>('thirty')
  const [search, setSearch] = useState('')
  const [debouncedSearch, searchDebouncer] = useDebouncedValue(search, { wait: 250, key: 'zaps-search' }, (state) => ({
    isPending: state.isPending,
  }))

  const statsQuery = useZapStats()
  const activityQuery = useZapActivity()
  const supportersQuery = useTopSupporters()
  const goals = useZapGoals()

  if (!currentUser) {
    return (
      <AppShell
        activeKey="zaps"
        title="Zaps"
        description="Acompanhe recompensas, apoie criadores e visualize sua economia de atenção."
        icon={Zap}
        eyebrow="Fase 3"
        badge="NIP-57"
      >
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-4 py-12 text-center">
            <div className="rounded-2xl border border-border/70 bg-secondary/50 p-4 text-[oklch(var(--lightning))]">
              <Zap className="size-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Faça login para ver seus Zaps</h3>
              <p className="max-w-lg text-sm text-muted-foreground">
                A tela usa dados reais dos seus recebimentos e apoios identificáveis via NIP-57. Sem uma sessão ativa,
                não há como calcular suas métricas pessoais.
              </p>
            </div>
            <Button variant="gradient" onClick={() => modal.show(<AuthModal />, { id: 'auth' })}>
              Entrar na conta
            </Button>
          </CardContent>
        </Card>
      </AppShell>
    )
  }

  if (statsQuery.isLoading) {
    return (
      <PageSpinner label="Carregando Zaps" description="Consultando pagamentos, apoiadores e campanhas nos relays." />
    )
  }

  if (statsQuery.isError) {
    return (
      <AppShell
        activeKey="zaps"
        title="Zaps"
        description="Acompanhe recompensas, apoie criadores e visualize sua economia de atenção."
        icon={Zap}
        eyebrow="Fase 3"
        badge="NIP-57"
      >
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-4 py-12 text-center">
            <h3 className="text-lg font-semibold">Não foi possível carregar os Zaps.</h3>
            <p className="text-sm text-muted-foreground">
              Tente novamente. Os botões de Zap existentes permanecem intactos.
            </p>
            <Button variant="outline" onClick={() => void statsQuery.refetch()}>
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      </AppShell>
    )
  }

  const data = statsQuery.data
  const activity = activityQuery.activity
  const filteredActivity = activity.filter((item) => {
    const tabMatches =
      activeTab === 'received' ? item.direction === 'received' : activeTab === 'sent' ? item.direction === 'sent' : true
    const content =
      `${item.targetLabel} ${item.message ?? ''} ${item.senderPubkey ?? ''} ${item.recipientPubkey ?? ''}`.toLowerCase()
    return tabMatches && content.includes(debouncedSearch.toLowerCase())
  })

  const bestVideo = data?.bestVideo
  const topSupporter = supportersQuery.supporters[0] ?? null
  const topSupporterProfile = topSupporter ? supportersQuery.profiles[topSupporter.pubkey] : undefined
  const chartData = data?.timeSeries[timeRange] ?? []
  const hasChartData = chartData.some((entry) => entry.received > 0 || entry.sent > 0)

  const rightAside = (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Top apoiadores</CardTitle>
          <CardDescription>Ranking real por soma de sats recebidos.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {supportersQuery.supporters.length > 0 ? (
            supportersQuery.supporters.map((supporter, index) => {
              const profile = supportersQuery.profiles[supporter.pubkey]
              return (
                <div
                  key={supporter.pubkey}
                  className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card/50 p-3"
                >
                  <div className="text-sm font-semibold text-muted-foreground">#{index + 1}</div>
                  <Avatar className="size-10">
                    <AvatarImage src={profile?.picture || profile?.image} />
                    <AvatarFallback>{(profile?.name || supporter.pubkey).slice(0, 1).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {profile?.displayName || profile?.name || trimPubkey(supporter.pubkey)}
                    </p>
                    <p className="text-xs text-muted-foreground">{supporter.zapCount} zap(s)</p>
                  </div>
                  <StatusBadge tone="warning">{formatSats(supporter.amountSats)}</StatusBadge>
                </div>
              )
            })
          ) : (
            <p className="text-sm text-muted-foreground">Ainda sem apoiadores identificáveis no período atual.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Metas e campanhas</CardTitle>
          <CardDescription>Fallback honesto enquanto não há implementação real dessas entidades.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {!goals.hasGoals ? (
            <div className="rounded-2xl border border-dashed border-border/70 p-4">
              <p className="font-medium text-foreground">Crie sua primeira meta de apoio</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Ainda não encontramos uma estrutura real de metas/campanhas no projeto atual.
              </p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dicas sobre Zaps</CardTitle>
          <CardDescription>Pequenos hábitos para fortalecer a economia da atenção.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div className="flex items-start gap-2">
            <Sparkles className="mt-0.5 size-4 text-[oklch(var(--lightning))]" />
            Recompense bons criadores.
          </div>
          <div className="flex items-start gap-2">
            <Sparkles className="mt-0.5 size-4 text-[oklch(var(--lightning))]" />
            Adicione mensagens para contexto.
          </div>
          <div className="flex items-start gap-2">
            <Sparkles className="mt-0.5 size-4 text-[oklch(var(--lightning))]" />
            Use metas para engajar sua audiência.
          </div>
          <div className="flex items-start gap-2">
            <Sparkles className="mt-0.5 size-4 text-[oklch(var(--lightning))]" />
            Zaps reforçam a descoberta de conteúdo.
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Apoie criadores com Zaps</CardTitle>
          <CardDescription>
            Os botões de Zap já existentes continuam sendo o fluxo principal para pagar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link to="/search" className={buttonVariants({ variant: 'gradient', className: 'w-full' })}>
            Enviar um Zap
            <ArrowRight className="size-4" />
          </Link>
        </CardContent>
      </Card>
    </>
  )

  return (
    <AppShell
      activeKey="zaps"
      title="Zaps"
      description="Acompanhe recompensas, apoie criadores e visualize sua economia de atenção."
      icon={Zap}
      eyebrow="Fase 3"
      badge="NIP-57"
      aside={rightAside}
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Recebidos"
          value={formatSats(data?.received30d ?? null)}
          description="Últimos 30 dias, quando calculável."
          icon={Wallet}
          tone="zap"
        />
        <MetricCard
          title="Enviados"
          value={formatSats(data?.sent30d ?? null)}
          description="Detectados por receipts visíveis no período."
          icon={HeartHandshake}
          tone="default"
        />
        <MetricCard
          title="Criadores apoiados"
          value={
            data?.supportedCreatorsCount == null ? (
              <UnavailableValue reason="Nenhum criador identificado no período." />
            ) : (
              String(data.supportedCreatorsCount)
            )
          }
          description="Pubkeys distintas apoiadas."
          icon={HandCoins}
          tone="success"
        />
        <MetricCard
          title="Taxa média por zap"
          value={formatSats(data?.averageZapSats ?? null)}
          description="Média real no período disponível."
          icon={BarChart3}
          tone="relay"
        />
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ZapTab)} className="w-full">
        <TabsList className="mb-6 flex h-auto w-full flex-wrap justify-start gap-2 rounded-2xl border border-border/70 bg-card/70 p-2">
          <TabsTrigger
            value="received"
            className="rounded-xl data-[state=active]:border-b-2 data-[state=active]:border-[oklch(var(--lightning))]"
          >
            Recebidos
          </TabsTrigger>
          <TabsTrigger
            value="sent"
            className="rounded-xl data-[state=active]:border-b-2 data-[state=active]:border-[oklch(var(--lightning))]"
          >
            Enviados
          </TabsTrigger>
          <TabsTrigger
            value="goals"
            className="rounded-xl data-[state=active]:border-b-2 data-[state=active]:border-[oklch(var(--lightning))]"
          >
            Metas
          </TabsTrigger>
          <TabsTrigger
            value="campaigns"
            className="rounded-xl data-[state=active]:border-b-2 data-[state=active]:border-[oklch(var(--lightning))]"
          >
            Campanhas
          </TabsTrigger>
        </TabsList>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle>Visão geral dos Zaps</CardTitle>
                <CardDescription>Recebidos em âmbar e enviados em roxo, usando apenas séries reais.</CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={timeRange === 'seven' ? 'zap' : 'glass'}
                  size="sm"
                  onClick={() => setTimeRange('seven')}
                >
                  7 dias
                </Button>
                <Button
                  variant={timeRange === 'thirty' ? 'zap' : 'glass'}
                  size="sm"
                  onClick={() => setTimeRange('thirty')}
                >
                  30 dias
                </Button>
                <Button
                  variant={timeRange === 'ninety' ? 'zap' : 'glass'}
                  size="sm"
                  onClick={() => setTimeRange('ninety')}
                >
                  90 dias
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {hasChartData ? (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" opacity={0.2} />
                    <XAxis dataKey="label" />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="received"
                      stroke="#f59e0b"
                      fill="#f59e0b"
                      fillOpacity={0.18}
                      name="Recebidos"
                    />
                    <Area
                      type="monotone"
                      dataKey="sent"
                      stroke="#8b5cf6"
                      fill="#8b5cf6"
                      fillOpacity={0.12}
                      name="Enviados"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-56 items-center justify-center rounded-2xl border border-dashed border-border/70 text-center text-sm text-muted-foreground">
                Ainda não há dados suficientes para montar o gráfico.
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Melhor vídeo</CardTitle>
              <CardDescription>Vídeo com maior soma recebida.</CardDescription>
            </CardHeader>
            <CardContent>
              {bestVideo ? (
                <div className="space-y-2">
                  <p className="break-all text-sm font-medium text-foreground">{bestVideo.targetRef}</p>
                  <StatusBadge tone="warning">{formatSats(bestVideo.amountSats)}</StatusBadge>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  <UnavailableValue reason="Nenhum vídeo com zaps recebidos identificado." />
                </p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Maior apoiador</CardTitle>
              <CardDescription>Pubkey/perfil com maior valor recebido.</CardDescription>
            </CardHeader>
            <CardContent>
              {topSupporter ? (
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={topSupporterProfile?.picture || topSupporterProfile?.image} />
                    <AvatarFallback>
                      {(topSupporterProfile?.name || topSupporter.pubkey).slice(0, 1).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {topSupporterProfile?.displayName || topSupporterProfile?.name || trimPubkey(topSupporter.pubkey)}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatSats(topSupporter.amountSats)}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  <UnavailableValue reason="Nenhum apoiador identificado no período." />
                </p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Meta atual</CardTitle>
              <CardDescription>Exibida somente se houver implementação real.</CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/configuration" className={buttonVariants({ variant: 'glass' })}>
                Crie sua primeira meta de apoio
              </Link>
            </CardContent>
          </Card>
        </div>

        <TabsContent value="received" className="mt-0 space-y-4" />
        <TabsContent value="sent" className="mt-0 space-y-4" />
        <TabsContent value="goals" className="mt-0 space-y-4">
          <Card>
            <CardContent className="py-10 text-center">
              <Target className="mx-auto mb-3 size-6 text-muted-foreground" />
              <p className="font-medium text-foreground">Crie sua primeira meta de apoio</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Não encontramos uma modelagem real de metas nesta base atual.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="campaigns" className="mt-0 space-y-4">
          <Card>
            <CardContent className="py-10 text-center">
              <HeartHandshake className="mx-auto mb-3 size-6 text-muted-foreground" />
              <p className="font-medium text-foreground">Campanhas ainda não disponíveis</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Sem implementação real encontrada para campanhas de Zap neste projeto.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {activity.length === 0 ? (
          <EmptyZapsState />
        ) : (
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <CardTitle>Atividade recente</CardTitle>
                  <CardDescription>Eventos reais recebidos dos relays consultados.</CardDescription>
                </div>
                <div className="relative w-full max-w-sm">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Filtrar atividade..."
                    className="pl-9"
                  />
                  {searchDebouncer.state.isPending ? (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      Filtrando...
                    </span>
                  ) : null}
                </div>
              </div>
            </CardHeader>
            <CardContent className="overflow-x-auto p-0">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-border/70 text-left text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    <th className="px-4 py-3">Tipo</th>
                    <th className="px-4 py-3">Usuário</th>
                    <th className="px-4 py-3">Conteúdo</th>
                    <th className="px-4 py-3">Mensagem</th>
                    <th className="px-4 py-3">Valor</th>
                    <th className="px-4 py-3">Data</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredActivity.map((item) => (
                    <tr key={item.id} className="border-b border-border/50 align-top last:border-b-0">
                      <td className="px-4 py-4">
                        <StatusBadge tone={item.direction === 'received' ? 'warning' : 'partial'}>
                          {item.direction === 'received' ? 'Recebido' : 'Enviado'}
                        </StatusBadge>
                      </td>
                      <td className="px-4 py-4 font-mono text-xs text-muted-foreground">
                        {trimPubkey(item.direction === 'received' ? item.senderPubkey : item.recipientPubkey)}
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm font-medium text-foreground">{item.targetLabel}</p>
                        {item.targetRef ? (
                          <p className="max-w-[260px] truncate text-xs text-muted-foreground">{item.targetRef}</p>
                        ) : null}
                      </td>
                      <td className="px-4 py-4 text-sm text-muted-foreground">{item.message || '—'}</td>
                      <td className="px-4 py-4 font-mono text-sm">{formatSats(item.amountSats)}</td>
                      <td className="px-4 py-4 text-sm text-muted-foreground">{formatDate(item.createdAt)}</td>
                      <td className="px-4 py-4">
                        <StatusBadge tone={statusConfig(item.status).tone}>
                          {statusConfig(item.status).label}
                        </StatusBadge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}
      </Tabs>
    </AppShell>
  )
}
