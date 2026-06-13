import { createRoute, Link } from '@tanstack/react-router'
import { t } from 'i18next'
import {
  Check,
  Cloud,
  Globe,
  HardDrive,
  Info,
  MonitorUp,
  Plus,
  RefreshCw,
  Server,
  Shield,
  Trash2,
  Upload,
  Wifi,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { MOCK_BLOSSOM_SERVERS } from '@/default'
import { AppShell } from '@/components/layout/AppShell'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MetricCard } from '@/components/ui/metric-card'
import { StatusBadge } from '@/components/ui/status-badge'
import { normalizeBlossomServerUrl, testBlossomServer } from '@/features/upload/services/blossom-server.service'
import { cn } from '@/lib/utils'
import { Route as rootRoute } from '@/routes/__root'
import useUserStore from '@/store/useUserStore'

// ============================================================
// Rota
// ============================================================
export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/blossom',
  component: BlossomPage,
  head: () => ({
    meta: [
      { title: t('blossom_page_title', 'Blossom Servers - NostrTube') },
      {
        name: 'description',
        content: t('blossom_page_desc', 'Manage your Blossom media servers for decentralized file storage.'),
      },
    ],
  }),
})

// ============================================================
// Helpers
// ============================================================
function describeServer(url: string): { name: string; region: string; custom: boolean } {
  const known = MOCK_BLOSSOM_SERVERS.find((s) => normalizeBlossomServerUrl(s.url) === normalizeBlossomServerUrl(url))
  if (known) return { name: known.name, region: known.region, custom: false }

  try {
    const hostname = new URL(url).hostname
    return {
      name: hostname
        .replace(/^cdn\./, '')
        .replace(/^files\./, '')
        .replace(/^media\./, '')
        .replace(/^blossom\./, '')
        .replace(/\./g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase()),
      region: 'Custom',
      custom: true,
    }
  } catch {
    return { name: url, region: 'Custom', custom: true }
  }
}

// ============================================================
// BlossomServerRow
// ============================================================
function BlossomServerRow({
  url,
  isPrimary,
  isMirror,
  onSetPrimary,
  onToggleMirror,
  onRemove,
}: {
  url: string
  isPrimary: boolean
  isMirror: boolean
  onSetPrimary: () => void
  onToggleMirror: () => void
  onRemove: () => void
}) {
  const [health, setHealth] = useState<'idle' | 'checking' | 'healthy' | 'error'>('idle')
  const info = useMemo(() => describeServer(url), [url])

  const checkHealth = async () => {
    setHealth('checking')
    const result = await testBlossomServer(url)
    setHealth(result.ok ? 'healthy' : 'error')
  }

  return (
    <div
      className={cn(
        'group relative flex items-center justify-between rounded-2xl border p-4 transition-all',
        isPrimary
          ? 'border-primary/40 bg-primary/8 shadow-[inset_0_0_0_1px_rgba(139,92,246,0.1)]'
          : 'border-border/70 bg-card/60 hover:border-border',
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
            <Server className="size-3.5 text-muted-foreground" />
            {info.name}
          </span>
          <Badge variant={info.custom ? 'secondary' : 'outline'} className="text-[10px] font-normal">
            {info.custom ? 'Custom' : info.region}
          </Badge>
          {isPrimary ? (
            <StatusBadge tone="healthy" className="text-[10px]">
              <Check className="mr-0.5 size-2.5" />
              Primary
            </StatusBadge>
          ) : null}
          {isMirror && !isPrimary ? (
            <StatusBadge tone="neutral" className="text-[10px]">
              Mirror
            </StatusBadge>
          ) : null}
        </div>
        <p className="mt-1 truncate font-mono text-xs text-muted-foreground">{url}</p>
      </div>

      <div className="ml-4 flex items-center gap-2">
        {/* Health check */}
        <button
          type="button"
          onClick={checkHealth}
          disabled={health === 'checking'}
          className={cn(
            'flex size-7 items-center justify-center rounded-lg border border-border/60 transition-colors hover:bg-secondary/60',
            health === 'healthy' && 'border-emerald-500/40 bg-emerald-500/10',
            health === 'error' && 'border-red-500/40 bg-red-500/10',
          )}
          title="Testar conexão"
        >
          {health === 'checking' ? (
            <RefreshCw className="size-3 animate-spin text-muted-foreground" />
          ) : health === 'healthy' ? (
            <Wifi className="size-3 text-emerald-400" />
          ) : health === 'error' ? (
            <span className="text-[10px] font-bold text-red-400">!</span>
          ) : (
            <RefreshCw className="size-3 text-muted-foreground" />
          )}
        </button>

        {/* Set as primary */}
        {!isPrimary ? (
          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={onSetPrimary}>
            Primary
          </Button>
        ) : null}

        {/* Mirror toggle */}
        {!isPrimary ? (
          <label className="flex items-center gap-1.5 border-l border-border/50 pl-3 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={isMirror}
              onChange={onToggleMirror}
              className="size-3.5 rounded border-border/70 text-primary focus:ring-primary/50"
            />
            Mirror
          </label>
        ) : null}

        {/* Remove custom */}
        {info.custom ? (
          <Button size="icon" variant="ghost" onClick={onRemove} className="size-7 text-muted-foreground hover:text-destructive">
            <Trash2 className="size-3.5" />
          </Button>
        ) : null}
      </div>
    </div>
  )
}

// ============================================================
// AddServerInline
// ============================================================
function AddServerInline() {
  const addCustom = useUserStore((state) => state.blossom.addCustom)
  const setDefault = useUserStore((state) => state.blossom.setDefault)
  const setMirrors = useUserStore((state) => state.blossom.setMirrors)
  const mirrors = useUserStore((state) => state.blossom.mirrors) ?? []
  const [url, setUrl] = useState('')
  const [saveAsPrimary, setSaveAsPrimary] = useState(false)
  const [saveAsMirror, setSaveAsMirror] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    setError(null)
    const normalized = normalizeBlossomServerUrl(url)
    try {
      const parsed = new URL(normalized)
      if (!(parsed.protocol === 'https:' || parsed.protocol === 'http:')) {
        throw new Error('Use uma URL http(s) válida')
      }
    } catch {
      setError('URL inválida')
      return
    }

    setIsSaving(true)
    const probe = await testBlossomServer(normalized)
    setIsSaving(false)

    if (!probe.ok) {
      setError(probe.message || 'Servidor não respondeu')
      return
    }

    addCustom(normalized)
    if (saveAsPrimary) {
      setDefault(normalized)
      setMirrors(mirrors.filter((entry) => entry !== normalized))
    } else if (saveAsMirror && !mirrors.includes(normalized)) {
      setMirrors([...mirrors, normalized])
    }

    setUrl('')
    setSaveAsPrimary(false)
    setSaveAsMirror(true)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Plus className="size-4 text-primary" />
          <CardTitle className="text-base">{t('blossom_add_server', 'Adicionar servidor Blossom')}</CardTitle>
        </div>
        <CardDescription>
          {t('blossom_add_desc', 'Testamos o endpoint antes de salvar. Use como primário ou mirror.')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-2">
            <label htmlFor="blossom-url-input" className="text-xs font-medium text-muted-foreground">
              URL do servidor
            </label>
            <input
              id="blossom-url-input"
              type="text"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value)
                setError(null)
              }}
              placeholder="https://blossom.example.com"
              className="w-full rounded-xl border border-border/70 bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
            {error ? <p className="text-xs text-destructive">{error}</p> : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-border/60 bg-card/50 px-3 py-2 text-xs text-muted-foreground transition-colors hover:border-primary/30">
              <input
                type="checkbox"
                checked={saveAsPrimary}
                onChange={(e) => {
                  setSaveAsPrimary(e.target.checked)
                  if (e.target.checked) setSaveAsMirror(false)
                }}
                className="size-3.5 rounded border-border/70 text-primary focus:ring-primary/50"
              />
              Primary
            </label>
            <label className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-border/60 bg-card/50 px-3 py-2 text-xs text-muted-foreground transition-colors hover:border-primary/30">
              <input
                type="checkbox"
                checked={saveAsMirror}
                onChange={(e) => {
                  setSaveAsMirror(e.target.checked)
                  if (e.target.checked) setSaveAsPrimary(false)
                }}
                className="size-3.5 rounded border-border/70 text-primary focus:ring-primary/50"
              />
              Mirror
            </label>
            <Button
              size="sm"
              variant="gradient"
              onClick={() => void handleSave()}
              disabled={!url.trim() || isSaving}
            >
              {isSaving ? 'Testing...' : 'Add server'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================
// BlossomPage
// ============================================================
function BlossomPage() {
  const storeDefault = useUserStore((state) => state.blossom.default)
  const storeMirrors = useUserStore((state) => state.blossom.mirrors)
  const customServers = useUserStore((state) => state.blossom.custom)
  const setMirrors = useUserStore((state) => state.blossom.setMirrors)
  const setDefault = useUserStore((state) => state.blossom.setDefault)
  const removeCustom = useUserStore((state) => state.blossom.removeCustom)

  const currentMirrors = storeMirrors ?? []
  const currentCustom = customServers ?? []

  const primaryUrl = normalizeBlossomServerUrl(storeDefault || import.meta.env.VITE_NOSTR_BLOSSOM_FALLBACK || MOCK_BLOSSOM_SERVERS[0]?.url || '')

  // Collect all servers (deduped, sorted: primary first, mirrors next, then custom)
  const allUrls = useMemo(() => {
    const known = MOCK_BLOSSOM_SERVERS.map((s) => normalizeBlossomServerUrl(s.url))
    const custom = currentCustom.map(normalizeBlossomServerUrl)
    const set = new Set([...known, ...custom, primaryUrl, ...currentMirrors.map(normalizeBlossomServerUrl)])
    return Array.from(set).filter(Boolean)
  }, [currentCustom, currentMirrors, primaryUrl])

  const sortedServers = useMemo(() => {
    return [...allUrls].sort((a, b) => {
      if (a === primaryUrl) return -1
      if (b === primaryUrl) return 1
      const aMirror = currentMirrors.includes(a)
      const bMirror = currentMirrors.includes(b)
      if (aMirror && !bMirror) return -1
      if (!aMirror && bMirror) return 1
      return 0
    })
  }, [allUrls, currentMirrors, primaryUrl])

  const toggleMirror = (url: string) => {
    if (url === primaryUrl) return
    const next = currentMirrors.includes(url)
      ? currentMirrors.filter((u) => u !== url)
      : [...currentMirrors, url]
    setMirrors(next)
  }

  const handleSetPrimary = (url: string) => {
    setDefault(url)
    setMirrors(currentMirrors.filter((u) => u !== url))
  }

  const mirrorCount = currentMirrors.length
  const totalCount = allUrls.length

  // Right aside
  const aside = (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="size-4 text-cyan-400" />
            <CardTitle className="text-base">{t('blossom_primary_info', 'Primary server')}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {primaryUrl ? (
            <>
              <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-card/50 px-3 py-2">
                <div className="rounded-lg bg-emerald-500/14 p-1.5 text-emerald-400">
                  <Check className="size-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-mono text-xs text-foreground">{primaryUrl}</p>
                  <p className="text-[10px] text-muted-foreground">Primary upload destination</p>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 rounded-xl border border-dashed border-border/60 px-3 py-2 text-muted-foreground">
              <Info className="size-3.5 shrink-0" />
              <span className="text-xs">No primary server configured.</span>
            </div>
          )}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Mirrors</span>
            <span className="font-medium text-foreground">{mirrorCount}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Total servers</span>
            <span className="font-medium text-foreground">{totalCount}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Upload className="size-4 text-[oklch(var(--lightning))]" />
            <CardTitle className="text-base">{t('blossom_upload_info', 'Uploads')}</CardTitle>
          </div>
          <CardDescription>Files are uploaded to primary then mirrored.</CardDescription>
        </CardHeader>
        <CardContent>
          <Link to="/new" className={cn(buttonVariants({ variant: 'glass', size: 'sm' }), 'w-full gap-2')}>
            <MonitorUp className="size-3.5" />
            Upload video
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Globe className="size-4 text-primary" />
            <CardTitle className="text-base">Blossom Protocol</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-xs text-muted-foreground">
          <p>
            Blossom is a decentralized storage protocol for Nostr. Files are addressed by SHA-256 hash.
          </p>
          <p>
            <a
              href="https://github.com/hzrd149/blossom"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              BUDs specification
            </a>
          </p>
        </CardContent>
      </Card>
    </>
  )

  return (
    <AppShell activeKey="blossom" aside={aside}>
      {/* ============ HEADER ============ */}
      <section className="relative overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-br from-[#0E1020] via-[#17142B] to-[#103030] px-8 py-10 sm:px-12 sm:py-12">
        <div className="pointer-events-none absolute -left-16 -top-16 size-72 rounded-full bg-cyan-500/12 blur-[100px]" />
        <div className="pointer-events-none absolute -bottom-12 right-20 size-48 rounded-full bg-emerald-500/10 blur-[70px]" />

        <div className="relative">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-4 py-1.5">
            <Cloud className="size-3.5 text-cyan-400" />
            <span className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-primary">
              Blossom
            </span>
          </div>

          <h1 className="font-display max-w-[560px] text-3xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-4xl">
            {t('blossom_title', 'Blossom Servers')}
          </h1>
          <p className="mt-4 max-w-[480px] text-balance text-sm leading-relaxed text-muted-foreground sm:text-base">
            {t(
              'blossom_subtitle',
              'Gerencie seus servidores de armazenamento descentralizado. Publique mídia em múltiplos relays e mantenha seus arquivos acessíveis na rede Nostr.',
            )}
          </p>
        </div>
      </section>

      {/* ============ METRICS ============ */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Primary"
          value={primaryUrl ? describeServer(primaryUrl).name : 'Not set'}
          description={primaryUrl ? normalizeBlossomServerUrl(primaryUrl) : 'Configurar servidor primário'}
          icon={Shield}
          tone="default"
        />
        <MetricCard
          title="Mirrors"
          value={String(mirrorCount)}
          description={mirrorCount > 0 ? 'Servidores mirror ativos' : 'Nenhum mirror configurado'}
          icon={HardDrive}
          tone="success"
        />
        <MetricCard
          title="Servidores"
          value={String(totalCount)}
          description={`${totalCount - mirrorCount - (primaryUrl ? 1 : 0)} disponíveis`}
          icon={Globe}
          tone="relay"
        />
        <MetricCard
          title="Protocolo"
          value="NIP-B7"
          description="Kind 10063 — User Blossom Server List"
          icon={Cloud}
          tone="zap"
        />
      </div>

      {/* ============ ADD SERVER FORM ============ */}
      <AddServerInline />

      {/* ============ SERVER LIST ============ */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl font-bold tracking-tight text-foreground">
              {t('blossom_server_list', 'All servers')}
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {totalCount} server{totalCount !== 1 ? 's' : ''} — {mirrorCount} mirror{mirrorCount !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
            <Wifi className="size-3.5" />
            <span>Click <RefreshCw className="inline size-3" /> to test connection</span>
          </div>
        </div>

        {sortedServers.length > 0 ? (
          <div className="space-y-2">
            {sortedServers.map((url) => {
              const isPrimary = url === primaryUrl
              const isMirror = currentMirrors.includes(url) && url !== primaryUrl
              return (
                <BlossomServerRow
                  key={url}
                  url={url}
                  isPrimary={isPrimary}
                  isMirror={isMirror}
                  onSetPrimary={() => handleSetPrimary(url)}
                  onToggleMirror={() => toggleMirror(url)}
                  onRemove={() => removeCustom(url)}
                />
              )
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center gap-4 py-12 text-center">
              <div className="rounded-2xl border border-border/70 bg-secondary/50 p-4 text-muted-foreground">
                <Cloud className="size-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">{t('blossom_empty_title', 'Nenhum servidor Blossom')}</h3>
                <p className="max-w-md text-sm text-muted-foreground">
                  {t(
                    'blossom_empty_desc',
                    'Adicione seu primeiro servidor Blossom para armazenar e distribuir seus vídeos na rede.',
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </section>
    </AppShell>
  )
}
