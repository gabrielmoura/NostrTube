import { AlertTriangle, Eraser, Loader2, Trash2 } from 'lucide-react'
import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import {
  clearAllIndexedDB,
  clearEventTags,
  clearMediaCache,
  clearNip05Cache,
  clearProfiles,
  clearServiceWorkerCache,
  deleteAllEvents,
  deleteEventsByKind,
} from '@/features/debug/services/cache.service.ts'
import { Badge, Button, Card, CardContent, CardHeader } from '@/routes/configurarion/@components/CommonComponents.tsx'

interface ClearOption {
  id: string
  label: string
  description: string
  danger: boolean
}

const CLEAR_OPTIONS: ClearOption[] = [
  {
    id: 'video-events',
    label: 'Eventos de vídeo (kind 34235 / 1063)',
    description: 'Remove metadados de vídeo do cache local',
    danger: false,
  },
  { id: 'profiles', label: 'Perfis (kind 0)', description: 'Remove metadata de usuários', danger: false },
  { id: 'feed-cache', label: 'Feed cache', description: 'Remove eventos do timeline', danger: false },
  { id: 'thumbnails', label: 'Thumbnails & imagens', description: 'Remove cache de mídia', danger: false },
  {
    id: 'indexeddb-all',
    label: 'IndexedDB completo',
    description: 'Remove todos os dados locais do NDK',
    danger: true,
  },
  { id: 'sw-cache', label: 'Service Worker cache', description: 'Remove caches do Service Worker', danger: false },
]

interface OperationLog {
  action: string
  timestamp: string
  removed: string
  details?: string
}

export function ClearCacheTab() {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [clearing, setClearing] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [logs, setLogs] = useState<OperationLog[]>([])
  const hasDangerous = Array.from(selected).some((id) => CLEAR_OPTIONS.find((o) => o.id === id)?.danger)

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleClear = useCallback(async () => {
    setConfirming(false)
    setClearing(true)
    const results: OperationLog[] = []
    const ts = new Date().toISOString()

    try {
      for (const id of selected) {
        if (id === 'video-events') {
          const removed = (await deleteEventsByKind(34235)) + (await deleteEventsByKind(1063))
          results.push({ action: 'Eventos de vídeo', timestamp: ts, removed: `${removed} eventos` })
        } else if (id === 'profiles') {
          const removed = await clearProfiles()
          results.push({ action: 'Perfis', timestamp: ts, removed: `${removed} perfis` })
        } else if (id === 'feed-cache') {
          const removed = await deleteAllEvents()
          results.push({ action: 'Feed cache', timestamp: ts, removed: `${removed} eventos` })
        } else if (id === 'thumbnails') {
          const removed = await clearMediaCache()
          results.push({ action: 'Thumbnails & imagens', timestamp: ts, removed: `${removed} caches` })
        } else if (id === 'indexeddb-all') {
          const res = await clearAllIndexedDB()
          const total = res.events + res.profiles + res.eventTags + res.nip05 + res.lnurl
          results.push({
            action: 'IndexedDB completo',
            timestamp: ts,
            removed: `${total} registros (${res.events} eventos, ${res.profiles} perfis, ${res.eventTags} tags, ${res.nip05} NIP-05, ${res.lnurl} LNURL)`,
          })
        } else if (id === 'sw-cache') {
          const removed = await clearServiceWorkerCache()
          results.push({ action: 'Service Worker cache', timestamp: ts, removed: `${removed} caches` })
        }
      }

      setLogs((prev) => [...results, ...prev])
      toast.success('Cache limpo com sucesso')
    } catch (_err) {
      toast.error('Erro ao limpar cache')
    } finally {
      setClearing(false)
      setSelected(new Set())
    }
  }, [selected])

  const handleClearAllClick = () => {
    const hasDanger = Array.from(selected).some((id) => CLEAR_OPTIONS.find((o) => o.id === id)?.danger)
    if (hasDanger) {
      setConfirming(true)
    } else {
      handleClear()
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader
          title="Opções de limpeza"
          icon={Eraser}
          description="Selecione o que deseja remover do cache local."
        />
        <CardContent className="space-y-2">
          {CLEAR_OPTIONS.map((opt) => (
            <label
              key={opt.id}
              className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                selected.has(opt.id)
                  ? 'border-indigo-200 bg-indigo-50/30 dark:border-indigo-900/50'
                  : 'border-transparent hover:bg-zinc-50 dark:hover:bg-zinc-800/30'
              }`}
            >
              <input
                type="checkbox"
                checked={selected.has(opt.id)}
                onChange={() => toggle(opt.id)}
                className="mt-0.5 w-4 h-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{opt.label}</span>
                  {opt.danger && <Badge variant="destructive">Perigoso</Badge>}
                </div>
                <p className="text-xs text-zinc-500 mt-0.5">{opt.description}</p>
              </div>
            </label>
          ))}
        </CardContent>
      </Card>

      {selected.size > 0 && !clearing && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
          <p className="text-sm text-amber-800 dark:text-amber-200 flex-1">
            {selected.size} item(ns) selecionado(s).
            {hasDangerous && ' Esta ação inclui operações perigosas que removerão dados permanentemente.'}
          </p>
          <Button variant="destructive" size="sm" onClick={handleClearAllClick}>
            <Trash2 className="w-4 h-4 mr-1" />
            Limpar selecionados
          </Button>
        </div>
      )}

      {clearing && (
        <div className="flex items-center justify-center gap-2 p-6 text-zinc-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          Limpando cache...
        </div>
      )}

      {confirming && (
        <Card>
          <CardHeader
            title="Confirmação"
            icon={AlertTriangle}
            description="Você está prestes a remover dados permanentemente. Esta ação não pode ser desfeita."
          />
          <CardContent className="flex gap-3">
            <Button variant="destructive" onClick={handleClear}>
              <Trash2 className="w-4 h-4 mr-1" />
              Confirmar limpeza
            </Button>
            <Button variant="ghost" onClick={() => setConfirming(false)}>
              Cancelar
            </Button>
          </CardContent>
        </Card>
      )}

      {logs.length > 0 && (
        <Card>
          <CardHeader title="Histórico de operações" icon={Eraser} />
          <CardContent className="max-h-60 overflow-y-auto space-y-1">
            {logs.map((log, i) => (
              <div
                key={i}
                className="text-xs text-zinc-600 dark:text-zinc-400 font-mono p-2 bg-zinc-50 dark:bg-zinc-900 rounded"
              >
                <span className="text-zinc-400">{log.timestamp.split('T')[1]?.slice(0, 8)}</span>{' '}
                <strong>{log.action}</strong>: {log.removed}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
