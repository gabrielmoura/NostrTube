import { useQuery } from '@tanstack/react-query'
import { Activity, AlertCircle, Plus, RefreshCw, Wifi } from 'lucide-react'
import { type MouseEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
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
import { RelayDirectoryError } from '@/errors'
import { usePreset } from '@/features/presets/hooks/usePreset'
import { checkLatency } from '@/helper/checkLatency.ts'
import { syncNdkRelayPool } from '@/lib/ndk'
import useUserStore from '@/store/useUserStore.ts'
import { Badge, Button, Card, CardContent, CardHeader } from './CommonComponents.tsx'

interface DufflePudRelaysResponse {
  relays: string[]
}

function AddRelayDialog({ onAdd }: { onAdd: (relayUrl: string) => void }) {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [relayUrl, setRelayUrl] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSave = () => {
    const normalized = relayUrl.trim()
    if (!normalized.startsWith('wss://')) {
      setError(normalized.startsWith('ws://') ? t('relays.error_insecure') : t('relays.error_invalid'))
      return
    }

    onAdd(normalized)
    setRelayUrl('')
    setError(null)
    setIsOpen(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          {t('relays.add')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>{t('relays.dialog_title')}</DialogTitle>
          <DialogDescription>{t('relays.dialog_description')}</DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <Label htmlFor="relay-url">{t('relays.url_label')}</Label>
          <Input
            id="relay-url"
            value={relayUrl}
            onChange={(event) => {
              setRelayUrl(event.target.value)
              setError(null)
            }}
            placeholder={t('relays.url_placeholder')}
          />
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setIsOpen(false)}>
            {t('relays.cancel')}
          </Button>
          <Button onClick={handleSave} disabled={!relayUrl.trim()}>
            {t('relays.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export const RelaySettings = () => {
  const { t } = useTranslation()
  const storedRelays = useUserStore((state) => state.session?.relays)
  const setRelays = useUserStore((state) => state.setRelays)
  const { activePreset } = usePreset()
  const defaultRelays = import.meta.env.VITE_NOSTR_RELAYS || []
  const presetRelays = activePreset?.content.defaultRelays ?? []
  const [selectedRelays, setSelectedRelays] = useState<string[]>(() =>
    storedRelays?.length ? storedRelays : defaultRelays,
  )
  const [latencies, setLatencies] = useState<Record<string, number | null>>({})
  const [isPinging, setIsPinging] = useState(false)

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['relay-directory'],
    queryFn: async (): Promise<DufflePudRelaysResponse> => {
      const response = await fetch(import.meta.env.VITE_DUFFLEPUD_URL as string)
      if (!response.ok) {
        throw new RelayDirectoryError(undefined, {
          relayDirectoryUrl: import.meta.env.VITE_DUFFLEPUD_URL,
          status: response.status,
        })
      }
      return response.json()
    },
    networkMode: 'online',
    staleTime: 1000 * 60 * 60 * 24,
    enabled: !!import.meta.env.VITE_DUFFLEPUD_URL,
  })

  useEffect(() => {
    if (storedRelays?.length) {
      setSelectedRelays(storedRelays)
    }
  }, [storedRelays])

  const validRelays = useMemo(() => {
    const remoteRelays = data?.relays ?? []
    return Array.from(
      new Set([
        ...selectedRelays,
        ...presetRelays,
        ...remoteRelays.filter((relay) => relay.startsWith('ws://') || relay.startsWith('wss://')),
        ...defaultRelays,
      ]),
    ).sort((left, right) => {
      const leftSelected = selectedRelays.includes(left) ? 0 : 1
      const rightSelected = selectedRelays.includes(right) ? 0 : 1
      if (leftSelected !== rightSelected) return leftSelected - rightSelected
      const leftPreset = presetRelays.includes(left) ? 0 : 1
      const rightPreset = presetRelays.includes(right) ? 0 : 1
      if (leftPreset !== rightPreset) return leftPreset - rightPreset
      return left.localeCompare(right)
    })
  }, [data?.relays, presetRelays, selectedRelays])

  const pingAllRelays = useCallback(async () => {
    if (!validRelays.length) return
    setIsPinging(true)
    const nextLatencies: Record<string, number | null> = {}

    const relayResults = await Promise.all(
      validRelays.slice(0, 15).map(async (relayUrl) => ({
        relayUrl,
        latency: await checkLatency(relayUrl),
      })),
    )

    relayResults.forEach(({ relayUrl, latency }) => {
      nextLatencies[relayUrl] = latency
    })

    setLatencies((previous) => ({ ...previous, ...nextLatencies }))
    setIsPinging(false)
  }, [validRelays])

  useEffect(() => {
    if (validRelays.length && Object.keys(latencies).length === 0) {
      void pingAllRelays()
    }
  }, [latencies, pingAllRelays, validRelays.length])

  const applyRelaySelection = (nextRelays: string[]) => {
    setSelectedRelays(nextRelays)
    setRelays(nextRelays)
    syncNdkRelayPool(nextRelays)
  }

  const toggleRelay = (url: string) => {
    const nextRelays = selectedRelays.includes(url)
      ? selectedRelays.filter((relayUrl) => relayUrl !== url)
      : [...selectedRelays, url]
    applyRelaySelection(nextRelays)
  }

  const addRelay = (url: string) => {
    if (selectedRelays.includes(url)) return
    applyRelaySelection([...selectedRelays, url])
  }

  const getLatencyColor = (ms: number | null | undefined) => {
    if (ms === null) return 'text-red-500'
    if (ms === undefined) return 'text-zinc-400'
    if (ms > 1000) return 'text-red-400'
    if (ms < 200) return 'text-emerald-500'
    return 'text-amber-500'
  }

  const forcePing = async (url: string) => {
    setIsPinging(true)
    const latency = await checkLatency(url)
    setLatencies((prev) => ({ ...prev, [url]: latency }))
    setIsPinging(false)
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader title={t('relays.title')} icon={Wifi} />
        <CardContent className="flex h-48 items-center justify-center">
          <RefreshCw className="h-6 w-6 animate-spin text-zinc-400" />
          <span className="ml-2 text-zinc-500">{t('relays.loading')}</span>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader title={t('relays.title')} icon={Wifi} />
        <CardContent className="flex h-48 flex-col items-center justify-center text-red-500">
          <AlertCircle className="mb-2 h-8 w-8" />
          <span className="text-sm">{t('relays.error')}</span>
          <Button variant="ghost" size="sm" onClick={() => void refetch()} className="mt-2">
            {t('relays.retry')}
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader title={t('relays.title')} description={t('relays.description')} icon={Wifi} />
      <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50/30 p-2 dark:border-zinc-800">
        <span className="ml-2 text-xs text-zinc-400">{t('relays.selected', { count: selectedRelays.length })}</span>
        <div className="flex items-center gap-2">
          <AddRelayDialog onAdd={addRelay} />
          <Button
            variant="outline"
            size="sm"
            onClick={() => void pingAllRelays()}
            disabled={isPinging}
            className="flex gap-2 text-xs"
          >
            <RefreshCw className={`h-3 w-3 ${isPinging ? 'animate-spin' : ''}`} />
            {isPinging ? t('relays.pinging') : t('relays.test_latency')}
          </Button>
        </div>
      </div>
      <CardContent>
        <div className="h-64 space-y-1 overflow-y-auto pr-1">
          {validRelays.map((relayUrl) => {
            const isSelected = selectedRelays.includes(relayUrl)
            const isPresetRelay = presetRelays.includes(relayUrl)
            const latency = latencies[relayUrl]

            return (
              <label
                key={relayUrl}
                className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50 ${isSelected ? 'border-indigo-200 bg-indigo-50/30 dark:border-indigo-900/50' : 'border-transparent'}`}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleRelay(relayUrl)}
                    className="h-4 w-4 flex-shrink-0 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div className="flex flex-col overflow-hidden">
                    <span className="w-full truncate text-sm font-medium text-zinc-700 dark:text-zinc-200">
                      {relayUrl.replace('wss://', '').replace('ws://', '')}
                    </span>
                    <span className="flex items-center gap-2 truncate text-xs text-zinc-400">
                      {relayUrl}
                      {isPresetRelay ? <Badge variant="outline">{t('relays.badge_preset')}</Badge> : null}
                    </span>
                  </div>
                </div>

                <div className="ml-2 flex flex-shrink-0 items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="p-0 transition-colors hover:bg-zinc-350 dark:hover:bg-zinc-700"
                    onClick={(e: MouseEvent<HTMLButtonElement>) => {
                      e.preventDefault()
                      e.stopPropagation()
                      void forcePing(relayUrl)
                    }}
                  >
                    <Activity className="h-3 w-3 text-zinc-400" />
                  </Button>
                  <span className={`w-12 text-right font-mono text-xs font-bold ${getLatencyColor(latency)}`}>
                    {latency !== undefined && latency !== null
                      ? `${latency}ms`
                      : latency === null && isPinging
                        ? '...'
                        : '--'}
                  </span>
                </div>
              </label>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
