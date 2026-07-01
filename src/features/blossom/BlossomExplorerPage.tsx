import { useNDK, useNDKCurrentUser } from '@nostr-dev-kit/ndk-hooks'
import { useNavigate } from '@tanstack/react-router'
import { Files, HardDrive, Server } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { AuthModal } from '@/components/AuthModal'
import { AppShell } from '@/components/layout/AppShell'
import { modal } from '@/components/modal_v2/modal-manager'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useClipboard } from '@/hooks/useClipboard'
import { deleteBlossomFile } from './blossom.service'
import type { BlossomFileRecord, BlossomMetric } from './blossom.types'
import { formatBytes } from './blossom.utils'
import { BlossomFileDetailsDialog } from './components/BlossomFileDetailsDialog'
import { BlossomFileTable } from './components/BlossomFileTable'
import { BlossomHeader, BlossomHero } from './components/BlossomHero'
import { BlossomFileToolbar, BlossomMetricCard } from './components/BlossomMetricsToolbar'
import {
  BlossomConnectedServersCard,
  BlossomStorageSummaryCard,
  BlossomSupportCard,
  BlossomTipsCard,
} from './components/BlossomSidebarCards'
import {
  BlossomConfigurationState,
  BlossomEmptyState,
  BlossomErrorState,
  BlossomSkeleton,
} from './components/BlossomStates'
import { BlossomUploadDropzone } from './components/BlossomUploadDropzone'
import { useBlossomDbFiles } from './hooks/useBlossomDbFiles'
import { useBlossomFiles } from './hooks/useBlossomFiles'
import { useBlossomServers } from './hooks/useBlossomServers'
import { useBlossomStorageSummary } from './hooks/useBlossomStorageSummary'
import { useBlossomUpload } from './hooks/useBlossomUpload'
import { useFileFilters } from './hooks/useFileFilters'

export function BlossomExplorerPage() {
  return <BlossomExplorerContainer />
}

function BlossomExplorerContainer() {
  const currentUser = useNDKCurrentUser()
  const { ndk } = useNDK()
  const navigate = useNavigate()
  const { copyToClipboard } = useClipboard()
  const serverState = useBlossomServers()
  const filesState = useBlossomFiles({
    ndk: ndk ?? undefined,
    pubkey: currentUser?.pubkey,
    localServers: serverState.localServers,
    signer: ndk?.signer,
  })
  const filters = useFileFilters([])
  const dbFiles = useBlossomDbFiles({
    pubkey: currentUser?.pubkey,
    search: filters.debouncedSearch,
    typeFilter: filters.typeFilter,
    sort: filters.sort,
    cacheVersion: filesState.cacheVersion,
  })
  const summary = useBlossomStorageSummary(dbFiles.files, {
    connectedServers: filesState.servers.length,
    onlineServers: filesState.servers.filter((server) => server.online).length,
  })
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [detailsFile, setDetailsFile] = useState<BlossomFileRecord | null>(null)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const upload = useBlossomUpload({
    defaultServer: serverState.defaultServer,
    hasUserConfiguration: serverState.hasUserConfiguration,
    onUploaded: ({ file }) => filesState.addFile(file),
  })

  const metrics = useMemo<BlossomMetric[]>(() => {
    const totalBytes = summary.totalBytes ?? 0
    const usedPercent = totalBytes > 0 ? Math.round((summary.usedBytes / totalBytes) * 100) : 0
    return [
      {
        title: 'Armazenamento usado',
        value:
          totalBytes > 0
            ? `${formatBytes(summary.usedBytes)} de ${formatBytes(totalBytes)}`
            : formatBytes(summary.usedBytes),
        description: totalBytes > 0 ? `${usedPercent}% do limite reportado` : 'Somado a partir dos blobs listados',
        icon: HardDrive,
        progress: totalBytes > 0 ? usedPercent : undefined,
      },
      { title: 'Arquivos', value: `${summary.filesCount}`, description: 'Retornados por /list/<pubkey>', icon: Files },
      {
        title: 'Blossoms conectados',
        value: `${summary.onlineServers}/${summary.connectedServers}`,
        description: 'online',
        icon: Server,
      },
    ]
  }, [summary])

  const copyText = async (text: string, label: string) => {
    await copyToClipboard(text)
    toast.success(`${label} copiado.`)
  }
  const toggleSelected = (fileId: string) => {
    setSelectedIds((current) =>
      current.includes(fileId) ? current.filter((id) => id !== fileId) : [...current, fileId],
    )
  }
  const removeLocalFile = (file: BlossomFileRecord) => {
    filesState.removeLocalFile(file)
    setSelectedIds((current) => current.filter((id) => id !== file.id))
    toast.success(`${file.name} removido da lista local.`)
  }
  const selectedFiles = dbFiles.files.filter((file) => selectedIds.includes(file.id))
  const needsLogin = !currentUser
  const deleteSelectedFiles = async () => {
    if (!ndk || !ndk.signer || selectedFiles.length === 0) return
    setIsDeleting(true)
    try {
      const servers = filesState.servers.map((server) => server.url)
      for (const file of selectedFiles) {
        const results = await deleteBlossomFile({ ndk, signer: ndk.signer, file, servers })
        const successCount = results.filter((result) => result.ok).length
        if (successCount > 0) {
          filesState.removeLocalFile(file)
          toast.success(`${file.name} deletado em ${successCount} servidor(es).`)
        } else {
          toast.error(`Não foi possível deletar ${file.name}.`)
        }
      }
      setSelectedIds([])
      setConfirmDeleteOpen(false)
    } finally {
      setIsDeleting(false)
    }
  }
  const openLogin = () => modal.show(<AuthModal />, { id: 'auth' })
  const openConfiguration = () =>
    void navigate({
      to: '/configuration',
      search: (old) => ({ ...old, tab: 'platform', sub: 'blossom' }),
    })
  const uploadDisabled = needsLogin

  const aside = (
    <>
      <BlossomStorageSummaryCard summary={summary} />
      <BlossomConnectedServersCard servers={filesState.servers} />
      <BlossomTipsCard />
      <BlossomSupportCard onZap={() => toast.info('Abra a tela de Zaps para apoiar operadores e criadores.')} />
    </>
  )

  return (
    <AppShell activeKey="blossom" aside={aside}>
      <BlossomHeader />
      <BlossomHero />
      {!currentUser ? (
        <BlossomConfigurationState isLoggedIn={false} onLogin={openLogin} />
      ) : !serverState.hasUserConfiguration ? (
        <Card className="border-border/70 bg-card/55">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm text-muted-foreground">
            <span>Você está usando o preset Blossom padrão do app. Pode alterar isso depois em Configurações.</span>
            <Button variant="glass" size="sm" onClick={openConfiguration}>
              Abrir configurações
            </Button>
          </CardContent>
        </Card>
      ) : null}
      {filesState.isHydratingCache || filesState.isLoading || filesState.serverErrors.length > 0 ? (
        <Card className="border-border/70 bg-card/55">
          <CardContent className="p-4 text-sm text-muted-foreground">
            {filesState.isHydratingCache
              ? 'Carregando cache local Blossom para exibir dados imediatamente.'
              : filesState.pendingServers > 0
                ? `Consultando ${filesState.pendingServers} servidor(es) Blossom em paralelo. Os arquivos aparecem assim que cada servidor responde.`
                : filesState.isDiscoveringServers
                  ? 'Descobrindo servidores Blossom do usuário via BUD-03.'
                  : 'Consulta Blossom finalizada.'}
            {filesState.serverErrors.length > 0
              ? ` ${filesState.serverErrors.length} servidor(es) não responderam ou recusaram /list/<pubkey>.`
              : null}
          </CardContent>
        </Card>
      ) : null}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <Card>
          <CardContent className="p-4 sm:p-5">
            <BlossomUploadDropzone
              status={upload.status}
              isUploading={upload.status === 'uploading'}
              progress={upload.progress}
              error={upload.error}
              disabled={uploadDisabled}
              onFilesSelected={(files) => void upload.uploadFiles(files)}
            />
          </CardContent>
        </Card>
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
          {metrics.map((metric) => (
            <BlossomMetricCard key={metric.title} metric={metric} />
          ))}
        </div>
      </div>
      <BlossomFileToolbar
        search={filters.search}
        typeFilter={filters.typeFilter}
        sort={filters.sort}
        viewMode={filters.viewMode}
        isPending={filters.isPending}
        onSearchChange={filters.setSearch}
        onTypeFilterChange={filters.setTypeFilter}
        onSortChange={filters.setSort}
        onViewModeChange={filters.setViewMode}
      />
      {(filesState.isHydratingCache || filesState.isLoading || dbFiles.isLoadingPage) && dbFiles.files.length === 0 ? (
        <BlossomSkeleton />
      ) : null}
      {!filesState.isLoading && filesState.error ? (
        <BlossomErrorState message={filesState.error} onRetry={filesState.retry} />
      ) : null}
      {!filesState.isLoading && !filesState.error && !dbFiles.isLoadingPage && dbFiles.files.length === 0 ? (
        <BlossomEmptyState />
      ) : null}
      {!filesState.error && dbFiles.files.length > 0 ? (
        <BlossomFileTable
          files={dbFiles.files}
          selectedIds={selectedIds}
          viewMode={filters.viewMode}
          totalCount={dbFiles.totalCount}
          hasMore={dbFiles.hasMore}
          isLoadingMore={dbFiles.isLoadingPage}
          onLoadMore={dbFiles.loadMore}
          onToggleSelected={toggleSelected}
          onCopyUrl={(file) => void copyText(file.url, 'URL')}
          onCopyHash={(file) => file.hash && void copyText(file.hash, 'Hash')}
          onViewDetails={(file) => setDetailsFile(file)}
          onRemoveLocal={removeLocalFile}
        />
      ) : null}
      {selectedIds.length > 0 ? (
        <div className="fixed bottom-5 left-1/2 z-30 flex -translate-x-1/2 flex-wrap items-center justify-center gap-3 rounded-2xl border border-border/70 bg-popover px-4 py-3 shadow-2xl">
          <span className="text-sm text-muted-foreground">{selectedIds.length} selecionado(s)</span>
          <Button variant="dangerSoft" size="sm" onClick={() => setConfirmDeleteOpen(true)} disabled={!ndk?.signer}>
            Deletar
          </Button>
          <Button variant="glass" size="sm" onClick={() => setSelectedIds([])}>
            Limpar
          </Button>
        </div>
      ) : null}
      <BlossomFileDetailsDialog
        file={detailsFile}
        open={Boolean(detailsFile)}
        onOpenChange={(open) => !open && setDetailsFile(null)}
      />
      <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deletar arquivos Blossom?</DialogTitle>
            <DialogDescription>
              Esta ação envia DELETE assinado para os servidores Blossom conhecidos. A remoção remota depende de cada
              servidor aceitar BUD-02.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-2xl border border-destructive/25 bg-destructive/8 p-4 text-sm text-muted-foreground">
            {selectedFiles.length} arquivo(s) selecionado(s). Esta ação não é apenas local.
          </div>
          <DialogFooter>
            <Button variant="glass" onClick={() => setConfirmDeleteOpen(false)} disabled={isDeleting}>
              Cancelar
            </Button>
            <Button variant="dangerSoft" onClick={() => void deleteSelectedFiles()} isLoading={isDeleting}>
              Confirmar deleção
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  )
}
