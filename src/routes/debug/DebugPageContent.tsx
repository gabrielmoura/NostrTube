import { Activity, Bug, Database, Eraser, FileText, Network, Server, Wifi } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { MetricCard } from '@/components/ui/metric-card'
import { StatusBadge } from '@/components/ui/status-badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.tsx'
import { Card, CardContent, CardHeader } from '@/routes/configuration/@components/CommonComponents.tsx'
import { BuildInfoTab } from '@/routes/debug/@components/BuildInfoTab.tsx'
import { CacheMetricsTab } from '@/routes/debug/@components/CacheMetricsTab.tsx'
import { ClearCacheTab } from '@/routes/debug/@components/ClearCacheTab.tsx'
import { ErrorLogTab } from '@/routes/debug/@components/ErrorLogTab.tsx'
import { ExportEventsTab } from '@/routes/debug/@components/ExportEventsTab.tsx'
import { LocalRelayTab } from '@/routes/debug/@components/LocalRelayTab.tsx'
import { NexusMetricsTab } from '@/routes/debug/@components/NexusMetricsTab.tsx'

export default function DebugPageContent() {
  const aside = (
    <>
      <MetricCard title="Ambiente" value={import.meta.env.DEV ? 'DEV' : 'PROD'} description={`Modo ${import.meta.env.MODE}`} icon={Server} tone="relay" />
      <MetricCard title="PWA / cache" value="ativo" description="Ferramentas de export, métricas e limpeza já disponíveis." icon={Database} tone="default" />
      <Card>
        <CardHeader title="Leitura rápida" icon={Bug} description="Painel técnico aproveitado como validação da nova base visual." />
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <StatusBadge tone="warning">debug interno</StatusBadge>
            <StatusBadge tone="partial">infra observável</StatusBadge>
          </div>
          <p className="text-sm text-muted-foreground">
            Esta página continua técnica, mas já recebe a mesma casca visual reutilizável que servirá para Relays e demais telas do redesign.
          </p>
        </CardContent>
      </Card>
    </>
  )

  return (
    <AppShell
      activeKey="debug"
      title="Debug"
      description="Diagnóstico, gerenciamento de cache e ferramentas de desenvolvimento sob a mesma base visual que sustentará o redesign Relay Cinema."
      icon={Bug}
      eyebrow="Ferramentas internas"
      badge="Fase 1"
      aside={aside}
    >
      <Tabs defaultValue="export" className="w-full">
        <TabsList className="mb-6 flex h-auto w-full flex-wrap justify-start gap-2 rounded-2xl border border-border/70 bg-card/70 p-2">
          <TabsTrigger value="export" className="flex min-w-[120px] items-center gap-2 rounded-xl">
            <Database className="w-4 h-4" />
            <span>Exportar Eventos</span>
          </TabsTrigger>
          <TabsTrigger value="clear" className="flex min-w-[120px] items-center gap-2 rounded-xl">
            <Eraser className="w-4 h-4" />
            <span>Limpar Cache</span>
          </TabsTrigger>
          <TabsTrigger value="metrics" className="flex min-w-[120px] items-center gap-2 rounded-xl">
            <Activity className="w-4 h-4" />
            <span>Métricas</span>
          </TabsTrigger>
          <TabsTrigger value="nexus" className="flex min-w-[120px] items-center gap-2 rounded-xl">
            <Network className="w-4 h-4" />
            <span>Nexus</span>
          </TabsTrigger>
          <TabsTrigger value="local-relay" className="flex min-w-[120px] items-center gap-2 rounded-xl">
            <Wifi className="w-4 h-4" />
            <span>Relay Local</span>
          </TabsTrigger>
          <TabsTrigger value="error-logs" className="flex min-w-[120px] items-center gap-2 rounded-xl">
            <FileText className="w-4 h-4" />
            <span>Logs de Erro</span>
          </TabsTrigger>
          <TabsTrigger value="build-info" className="flex min-w-[120px] items-center gap-2 rounded-xl">
            <Server className="w-4 h-4" />
            <span>Diagnóstico</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="export" className="focus-visible:outline-none">
          <ExportEventsTab />
        </TabsContent>
        <TabsContent value="clear" className="focus-visible:outline-none">
          <ClearCacheTab />
        </TabsContent>
        <TabsContent value="metrics" className="focus-visible:outline-none">
          <CacheMetricsTab />
        </TabsContent>
        <TabsContent value="nexus" className="focus-visible:outline-none">
          <NexusMetricsTab />
        </TabsContent>
        <TabsContent value="local-relay" className="focus-visible:outline-none">
          <LocalRelayTab />
        </TabsContent>
        <TabsContent value="error-logs" className="focus-visible:outline-none">
          <ErrorLogTab />
        </TabsContent>
        <TabsContent value="build-info" className="focus-visible:outline-none">
          <BuildInfoTab />
        </TabsContent>
      </Tabs>
    </AppShell>
  )
}
