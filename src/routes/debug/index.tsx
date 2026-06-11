import { createFileRoute } from '@tanstack/react-router'
import { Activity, Bug, Database, Eraser, FileText, Network, Server, Wifi } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.tsx'
import { BuildInfoTab } from '@/routes/debug/@components/BuildInfoTab.tsx'
import { CacheMetricsTab } from '@/routes/debug/@components/CacheMetricsTab.tsx'
import { ClearCacheTab } from '@/routes/debug/@components/ClearCacheTab.tsx'
import { ErrorLogTab } from '@/routes/debug/@components/ErrorLogTab.tsx'
import { ExportEventsTab } from '@/routes/debug/@components/ExportEventsTab.tsx'
import { LocalRelayTab } from '@/routes/debug/@components/LocalRelayTab.tsx'
import { NexusMetricsTab } from '@/routes/debug/@components/NexusMetricsTab.tsx'

export const Route = createFileRoute('/debug/')({
  component: DebugPage,
})

function DebugPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 text-zinc-900 dark:text-zinc-100 sm:px-6 lg:px-8">
      <div className="mb-2">
        <div className="flex items-center gap-3 mb-1">
          <Bug className="w-6 h-6 text-indigo-500" />
          <h1 className="text-2xl font-bold tracking-tight">Debug</h1>
        </div>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm">
          Diagnóstico, gerenciamento de cache e ferramentas de desenvolvimento.
        </p>
      </div>

      <Tabs defaultValue="export" className="w-full">
        <TabsList className="w-full flex flex-wrap mb-6">
          <TabsTrigger value="export" className="flex items-center gap-2 flex-1 min-w-[120px]">
            <Database className="w-4 h-4" />
            <span>Exportar Eventos</span>
          </TabsTrigger>
          <TabsTrigger value="clear" className="flex items-center gap-2 flex-1 min-w-[120px]">
            <Eraser className="w-4 h-4" />
            <span>Limpar Cache</span>
          </TabsTrigger>
          <TabsTrigger value="metrics" className="flex items-center gap-2 flex-1 min-w-[120px]">
            <Activity className="w-4 h-4" />
            <span>Métricas</span>
          </TabsTrigger>
          <TabsTrigger value="nexus" className="flex items-center gap-2 flex-1 min-w-[120px]">
            <Network className="w-4 h-4" />
            <span>Nexus</span>
          </TabsTrigger>
          <TabsTrigger value="local-relay" className="flex items-center gap-2 flex-1 min-w-[120px]">
            <Wifi className="w-4 h-4" />
            <span>Relay Local</span>
          </TabsTrigger>
          <TabsTrigger value="error-logs" className="flex items-center gap-2 flex-1 min-w-[120px]">
            <FileText className="w-4 h-4" />
            <span>Logs de Erro</span>
          </TabsTrigger>
          <TabsTrigger value="build-info" className="flex items-center gap-2 flex-1 min-w-[120px]">
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
    </div>
  )
}
