import { t } from 'i18next'
import { Check, Info, Plus, RefreshCw, Server, Trash2, Wifi } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { type BlossomServer } from '@/default'
import { BLOSSOM_DEFAULT_PRIMARY_SERVER, BLOSSOM_DEFAULT_SERVERS } from '@/features/blossom/blossom.defaults'
import { normalizeBlossomServerUrl, testBlossomServer } from '@/features/upload/services/blossom-server.service'
import useUserStore from '@/store/useUserStore.ts'
import { Badge, Button, Card, CardContent, CardHeader } from './CommonComponents.tsx'

const EMPTY_LIST: string[] = []

type PingState = {
  status: 'idle' | 'checking' | 'online' | 'offline'
  latencyMs?: number
  message?: string
}

function pingLabel(state: PingState | undefined) {
  if (!state || state.status === 'idle') return t('blossom.settings.ping_idle')
  if (state.status === 'checking') return t('blossom.settings.ping_checking')
  if (state.status === 'online') {
    return state.latencyMs
      ? t('blossom.settings.ping_online_with_latency', { latency: state.latencyMs })
      : t('blossom.settings.ping_online')
  }
  return state.message || t('blossom.settings.ping_offline')
}

function describeServer(url: string): BlossomServer & { custom: boolean } {
  try {
    const hostname = new URL(url).hostname
    return {
      url,
      name: hostname
        .replace(/^cdn\./, '')
        .replace(/^files\./, '')
        .replace(/^media\./, '')
        .replace(/^blossom\./, '')
        .replace(/\./g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase()),
      region: 'Custom',
      custom: true,
    }
  } catch {
    return {
      url,
      name: url,
      region: 'Custom',
      custom: true,
    }
  }
}

function AddBlossomServerDialog() {
  const addCustom = useUserStore((state) => state.blossom.addCustom)
  const setDefault = useUserStore((state) => state.blossom.setDefault)
  const mirrors = useUserStore((state) => state.blossom.mirrors)
  const setMirrors = useUserStore((state) => state.blossom.setMirrors)
  const [isOpen, setIsOpen] = useState(false)
  const [url, setUrl] = useState('')
  const [saveAsPrimary, setSaveAsPrimary] = useState(false)
  const [saveAsMirror, setSaveAsMirror] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const currentMirrors = mirrors ?? EMPTY_LIST

  const handleSave = async () => {
    setError(null)
    const normalized = normalizeBlossomServerUrl(url)

    try {
      const parsed = new URL(normalized)
      if (!(parsed.protocol === 'https:' || parsed.protocol === 'http:')) {
        throw new Error(t('blossom.settings.invalid_url'))
      }
    } catch {
      setError(t('blossom.settings.invalid_url'))
      return
    }

    setIsSaving(true)
    const probe = await testBlossomServer(normalized)
    setIsSaving(false)

    if (!probe.ok) {
      setError(probe.message || t('blossom.settings.server_unreachable'))
      return
    }

    addCustom(normalized)

    if (saveAsPrimary) {
      setDefault(normalized)
      setMirrors(currentMirrors.filter((entry) => entry !== normalized))
    } else if (saveAsMirror && !currentMirrors.includes(normalized)) {
      setMirrors([...currentMirrors, normalized])
    }

    setUrl('')
    setSaveAsPrimary(false)
    setSaveAsMirror(true)
    setError(null)
    setIsOpen(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          {t('blossom.settings.add_server')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>{t('blossom.settings.dialog_title')}</DialogTitle>
          <DialogDescription>{t('blossom.settings.dialog_description')}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="blossom-server-url">{t('blossom.settings.server_url')}</Label>
            <Input
              id="blossom-server-url"
              value={url}
              onChange={(event) => {
                setUrl(event.target.value)
                setError(null)
              }}
              placeholder={t('blossom.settings.server_placeholder')}
            />
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </div>
          <div className="space-y-3 rounded-xl border border-border/60 bg-muted/30 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">{t('blossom.settings.set_primary')}</p>
                <p className="text-xs text-muted-foreground">{t('blossom.settings.set_primary_desc')}</p>
              </div>
              <Switch
                checked={saveAsPrimary}
                onCheckedChange={(checked) => {
                  setSaveAsPrimary(checked)
                  if (checked) setSaveAsMirror(false)
                }}
              />
            </div>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">{t('blossom.settings.add_mirror')}</p>
                <p className="text-xs text-muted-foreground">{t('blossom.settings.add_mirror_desc')}</p>
              </div>
              <Switch
                checked={saveAsMirror}
                onCheckedChange={(checked) => {
                  setSaveAsMirror(checked)
                  if (checked) setSaveAsPrimary(false)
                }}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setIsOpen(false)}>
            {t('Cancel')}
          </Button>
          <Button onClick={() => void handleSave()} disabled={!url.trim() || isSaving}>
            {isSaving ? t('blossom.settings.testing_server') : t('blossom.settings.save_server')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export const BlossomSettings = () => {
  const storeDefault = useUserStore((state) => state.blossom.default)
  const storeMirrors = useUserStore((state) => state.blossom.mirrors)
  const customServers = useUserStore((state) => state.blossom.custom)
  const setMirrors = useUserStore((state) => state.blossom.setMirrors)
  const setDefault = useUserStore((state) => state.blossom.setDefault)
  const removeCustom = useUserStore((state) => state.blossom.removeCustom)
  const [pingStates, setPingStates] = useState<Record<string, PingState>>({})
  const currentMirrors = storeMirrors ?? EMPTY_LIST
  const currentCustomServers = customServers ?? EMPTY_LIST
  const primary = normalizeBlossomServerUrl(
    storeDefault || import.meta.env.VITE_NOSTR_BLOSSOM_FALLBACK || BLOSSOM_DEFAULT_PRIMARY_SERVER || '',
  )
  const mirrors = useMemo(
    () => Array.from(new Set(currentMirrors.map(normalizeBlossomServerUrl))).filter((url) => url !== primary),
    [currentMirrors, primary],
  )
  const presetServers = useMemo(
    () => BLOSSOM_DEFAULT_SERVERS.map((server) => normalizeBlossomServerUrl(server.url)),
    [],
  )
  const isUsingPreset = !storeDefault && currentMirrors.length === 0 && currentCustomServers.length === 0
  const available = useMemo(
    () =>
      Array.from(
        new Set([...presetServers, ...currentCustomServers.map(normalizeBlossomServerUrl), primary, ...mirrors]),
      ).filter(Boolean),
    [currentCustomServers, mirrors, primary, presetServers],
  )

  const servers = useMemo(() => {
    return available
      .map((url) => describeServer(url))
      .sort((left, right) => {
        const leftScore = left.url === primary ? 0 : mirrors.includes(left.url) ? 1 : 2
        const rightScore = right.url === primary ? 0 : mirrors.includes(right.url) ? 1 : 2
        if (leftScore !== rightScore) return leftScore - rightScore
        return left.name.localeCompare(right.name)
      })
  }, [available, mirrors, primary])

  const toggleSecondary = (url: string) => {
    if (url === primary) return
    const nextMirrors = currentMirrors.includes(url)
      ? currentMirrors.filter((serverUrl) => serverUrl !== url)
      : [...currentMirrors, url]
    setMirrors(nextMirrors)
  }

  const handleSetPrimary = (url: string) => {
    setDefault(url)
    setMirrors(currentMirrors.filter((serverUrl) => serverUrl !== url))
  }

  const restoreDefaultPreset = () => {
    setDefault(BLOSSOM_DEFAULT_PRIMARY_SERVER)
    setMirrors(presetServers.filter((url) => url !== BLOSSOM_DEFAULT_PRIMARY_SERVER))
  }

  const pingServer = useCallback(async (url: string) => {
    setPingStates((current) => ({
      ...current,
      [url]: { status: 'checking' },
    }))

    const startedAt = performance.now()
    const probe = await testBlossomServer(url)
    const latencyMs = Math.round(performance.now() - startedAt)

    setPingStates((current) => ({
      ...current,
      [url]: {
        status: probe.ok ? 'online' : 'offline',
        latencyMs: probe.ok ? latencyMs : undefined,
        message: probe.message,
      },
    }))
  }, [])

  useEffect(() => {
    void Promise.all(servers.map((server) => pingServer(server.url)))
  }, [servers, pingServer])

  return (
    <div id="blossom-settings" className="scroll-mt-24">
      <Card>
        <CardHeader
          title={t('blossom.settings.card_title')}
          description={t('blossom.settings.card_description')}
          icon={Server}
        />
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-500">
                <span>
                  {t('blossom.settings.primary_label')}:{' '}
                  <span className="text-zinc-800 dark:text-zinc-100">
                    {primary || t('blossom.settings.not_configured')}
                  </span>
                </span>
                {isUsingPreset ? <Badge variant="outline">Padrão do app</Badge> : null}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="ghost" size="sm" onClick={restoreDefaultPreset} className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Padrão do app
                </Button>
                <AddBlossomServerDialog />
              </div>
            </div>

            <div className="h-72 space-y-2 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-700">
              {servers.map((server) => {
                const isPrimary = server.url === primary
                const isSecondary = mirrors.includes(server.url)

                return (
                  <div
                    key={server.url}
                    className={`relative flex items-center justify-between rounded-xl border p-4 transition-all ${isPrimary ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20' : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'}`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{server.name}</span>
                        <Badge variant={server.custom ? 'warning' : 'outline'}>
                          {server.custom ? t('blossom.settings.custom') : server.region}
                        </Badge>
                        {isSecondary && !isPrimary ? (
                          <Badge variant="outline">{t('blossom.settings.mirror')}</Badge>
                        ) : null}
                      </div>
                      <p className="mt-1 truncate text-xs text-zinc-400">{server.url}</p>
                      <div className="mt-2 flex items-center gap-2 text-xs text-zinc-500">
                        <Wifi className="h-3.5 w-3.5" />
                        <span>{pingLabel(pingStates[server.url])}</span>
                      </div>
                    </div>

                    <div className="ml-4 flex items-center gap-2">
                      {isPrimary ? (
                        <Badge variant="success" className="flex items-center gap-1">
                          <Check className="h-3 w-3" /> {t('blossom.settings.primary')}
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs h-7"
                          onClick={() => handleSetPrimary(server.url)}
                        >
                          {t('blossom.settings.set_primary_action')}
                        </Button>
                      )}
                      <label className="flex items-center gap-2 border-l border-zinc-200 pl-3 text-xs dark:border-zinc-700">
                        <span>{t('blossom.settings.mirror')}</span>
                        <input
                          type="checkbox"
                          checked={isSecondary}
                          onChange={() => toggleSecondary(server.url)}
                          disabled={isPrimary}
                          className="h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                        />
                      </label>
                      {server.custom ? (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => removeCustom(server.url)}
                          className="text-zinc-500 hover:text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      ) : null}
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => void pingServer(server.url)}
                        className="text-zinc-500 hover:text-indigo-500"
                        aria-label={t('blossom.settings.ping_server_aria', { server: server.name })}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="flex items-start gap-2 pt-1 text-xs text-zinc-400">
              <Info className="mt-0.5 h-3 w-3" />
              {t('blossom.settings.helper')}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
