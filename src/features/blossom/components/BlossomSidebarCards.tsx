import { HeartHandshake, Info, Server, Zap } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import type { BlossomServerStatus, BlossomStorageSummary } from '../blossom.types'
import { formatBytes } from '../blossom.utils'

export function BlossomStorageSummaryCard({ summary }: { summary: BlossomStorageSummary }) {
  const percent = summary.totalBytes ? Math.round((summary.usedBytes / summary.totalBytes) * 100) : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Resumo do armazenamento</CardTitle>
        <CardDescription>
          {summary.totalBytes ? `${percent}% usado` : `${formatBytes(summary.usedBytes)} listados`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="mx-auto flex size-32 items-center justify-center rounded-full border border-primary/30 bg-[conic-gradient(var(--primary)_0_25%,color-mix(in_oklab,var(--accent)_70%,transparent)_25%_42%,color-mix(in_oklab,var(--lightning)_70%,transparent)_42%_54%,color-mix(in_oklab,var(--secondary)_80%,transparent)_54%_100%)] p-3">
          <div className="flex size-24 flex-col items-center justify-center rounded-full bg-card text-center">
            <span className="text-2xl font-semibold">{percent}%</span>
            <span className="text-[10px] text-muted-foreground">usado</span>
          </div>
        </div>
        <Progress value={percent} />
        <div className="space-y-3">
          {summary.byType.map((entry) => (
            <div key={entry.type} className="flex items-center justify-between gap-3 text-sm">
              <span className="text-muted-foreground">{entry.label}</span>
              <span className="font-medium text-foreground">{formatBytes(entry.bytes)}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export function BlossomConnectedServersCard({ servers }: { servers: BlossomServerStatus[] }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Server className="size-4 text-primary" />
          <CardTitle className="text-base">Blossoms conectados</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {servers.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum servidor Blossom carregado.</p>
        ) : null}
        {servers.slice(0, 5).map((server) => (
          <div
            key={server.url}
            className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card/45 p-3"
          >
            <div className="min-w-0">
              <p className="truncate font-mono text-xs text-foreground" title={server.url}>
                {server.url}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {server.latencyMs ? `${server.latencyMs}ms` : 'latência indisponível'} •{' '}
                {server.source === 'bud03' ? 'BUD-03' : 'local'}
              </p>
              {server.capabilities ? (
                <div className="mt-2 flex flex-wrap gap-1">
                  <CapabilityBadge label="BUD-06" value={server.capabilities.uploadRequirements} />
                  <CapabilityBadge label="BUD-05" value={server.capabilities.mediaOptimization} />
                  <CapabilityBadge label="BUD-09" value={server.capabilities.reporting} />
                </div>
              ) : null}
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <Badge
                variant={
                  server.listStatus === 'pending'
                    ? 'glass'
                    : server.online && server.listStatus !== 'error'
                      ? 'success'
                      : 'dangerSoft'
                }
              >
                {server.listStatus === 'pending'
                  ? 'consultando'
                  : server.online && server.listStatus !== 'error'
                    ? 'online'
                    : 'offline'}
              </Badge>
              {typeof server.filesCount === 'number' ? (
                <span className="text-[11px] text-muted-foreground">{server.filesCount} blobs</span>
              ) : null}
            </div>
          </div>
        ))}
        <Button variant="glass" size="sm" className="w-full">
          Ver todos
        </Button>
      </CardContent>
    </Card>
  )
}

function CapabilityBadge({ label, value }: { label: string; value: 'supported' | 'unsupported' | 'unknown' }) {
  return (
    <Badge
      variant={value === 'supported' ? 'relay' : value === 'unsupported' ? 'outline' : 'glass'}
      className="px-1.5 py-0.5 text-[10px]"
      title={value}
    >
      {label}
    </Badge>
  )
}

export function BlossomTipsCard() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Info className="size-4 text-cyan-300" />
          <CardTitle className="text-base">Dicas sobre o Blossom</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3 text-sm text-muted-foreground">
          <li>Use mirrors para arquivos importantes.</li>
          <li>Guarde hashes para validar integridade.</li>
          <li>Prefira servidores com boa latência para uploads grandes.</li>
        </ul>
      </CardContent>
    </Card>
  )
}

export function BlossomSupportCard({ onZap }: { onZap: () => void }) {
  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/12 via-card to-[oklch(var(--lightning))]/10">
      <CardContent className="p-5">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-[oklch(var(--lightning))]/15 p-3 text-[oklch(var(--lightning))]">
            <HeartHandshake className="size-5" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Apoie o ecossistema de armazenamento descentralizado</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Zaps ajudam criadores e operadores a manter infraestrutura aberta.
            </p>
          </div>
        </div>
        <Button variant="zap" className="mt-5 w-full" onClick={onZap}>
          <Zap className="size-4" />
          Enviar um Zap
        </Button>
      </CardContent>
    </Card>
  )
}
