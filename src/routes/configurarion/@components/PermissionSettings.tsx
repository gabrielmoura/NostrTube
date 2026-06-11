import { AlertCircle, Bell, Eye, EyeOff, Loader2, MapPin, Network, Shield } from 'lucide-react'
import ngeohash from 'ngeohash'
import { useEffect, useState } from 'react'
import { LoggerAgent } from '@/lib/debug.ts'
import { ndkNexusBridge } from '@/lib/nexus-p2p'
import useUserStore from '@/store/useUserStore.ts'
import { Card, CardHeader, Switch } from './CommonComponents'

export const PermissionSettings = () => {
  const log = LoggerAgent.create('PermissionSettings')
  const storedGeoHash = useUserStore((state) => state.session?.geoHash)
  const storedPushEnabled = useUserStore((state) => state.session?.pushNotificationsEnabled ?? false)
  const setGeoHash = useUserStore((state) => state.setGeoHash)
  const setPushNotificationsEnabled = useUserStore((state) => state.setPushNotificationsEnabled)
  const storedNexusP2PEnabled = useUserStore((state) => state.session?.nexusP2PEnabled ?? true)
  const setNexusP2PEnabled = useUserStore((state) => state.setNexusP2PEnabled)
  const [pushEnabled, setPushEnabled] = useState(false)
  const [locationEnabled, setLocationEnabled] = useState(false)
  const [nexusP2PEnabled, setNexusP2PEnabledState] = useState(true)
  const [showGeoHash, setShowGeoHash] = useState(false)

  // Estados para dados e feedback
  const [currentGeohash, setCurrentGeohash] = useState<string | null>(null)
  const [loading, setLoading] = useState<string | null>(null) // 'location' | 'push' | null
  const [error, setError] = useState<string | null>(null)

  // Verifica o status inicial das permissões ao montar o componente
  useEffect(() => {
    setPushEnabled(storedPushEnabled || ('Notification' in window && Notification.permission === 'granted'))
    setLocationEnabled(Boolean(storedGeoHash))
    setNexusP2PEnabledState(storedNexusP2PEnabled)
    setCurrentGeohash(storedGeoHash ?? null)
    setShowGeoHash(false)
  }, [storedGeoHash, storedNexusP2PEnabled, storedPushEnabled])

  const handleNexusP2P = (checked: boolean) => {
    setNexusP2PEnabledState(checked)
    setNexusP2PEnabled(checked)
    ndkNexusBridge.setEnabled(checked)
  }

  /**
   * Lida com a solicitação de Notificações Push
   */
  const handlePush = async (checked: boolean) => {
    setError(null)

    if (!checked) {
      setPushEnabled(false)
      setPushNotificationsEnabled(false)
      return
    }

    setLoading('push')

    try {
      if (!('Notification' in window)) {
        throw new Error('Este navegador não suporta notificações.')
      }

      const permission = await Notification.requestPermission()

      if (permission === 'granted') {
        setPushEnabled(true)
        setPushNotificationsEnabled(true)
      } else {
        setPushEnabled(false)
        setPushNotificationsEnabled(false)
        throw new Error('Permissão de notificação negada.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao ativar notificações')
      setPushEnabled(false)
      log.error('Erro ao solicitar permissão de notificação:', err)
    } finally {
      setLoading(null)
    }
  }

  /**
   * Lida com a Geolocalização e geração do Geohash
   */
  const handleLocation = (checked: boolean) => {
    setError(null)

    if (!checked) {
      setLocationEnabled(false)
      setCurrentGeohash(null)
      setShowGeoHash(false)
      setGeoHash('')
      return
    }

    setLoading('location')

    if (!('geolocation' in navigator)) {
      setError('Geolocalização não é suportada neste navegador.')
      setLoading(null)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords

        const hash = ngeohash.encode(latitude, longitude, 3).toLowerCase()

        setCurrentGeohash(hash)
        setGeoHash(hash)
        setLocationEnabled(true)
        setShowGeoHash(false)
        setLoading(null)
      },
      (err) => {
        log.error('Erro ao obter localização:', err)
        let msg = 'Erro ao obter localização.'
        if (err.code === 1) msg = 'Permissão de localização negada.'
        if (err.code === 2) msg = 'Posição indisponível.'
        if (err.code === 3) msg = 'Tempo limite esgotado.'

        setError(msg)
        setLocationEnabled(false)
        setLoading(null)
      },
      { enableHighAccuracy: true, timeout: 5000 },
    )
  }

  //

  return (
    <Card>
      <CardHeader title="Privacidade e Notificações" icon={Shield} />

      {/* Exibição de Erros Globais */}
      {error && (
        <div className="mx-4 mt-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-md flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
        {/* Seção Notificações Push */}
        <div className="flex items-center justify-between p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
              {loading === 'push' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Bell className="w-5 h-5" />}
            </div>
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">Notificações Push</p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {pushEnabled ? 'Notificações ativas' : 'Receba alertas sobre novos vídeos e lives.'}
              </p>
            </div>
          </div>
          <Switch checked={pushEnabled} onCheckedChange={handlePush} disabled={loading === 'push'} />
        </div>

        {/* Seção Geohash Local */}
        <div className="flex items-center justify-between p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400">
              {loading === 'location' ? <Loader2 className="w-5 h-5 animate-spin" /> : <MapPin className="w-5 h-5" />}
            </div>
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">Geohash Local</p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Salva apenas o prefixo estadual do geohash, com três caracteres.
              </p>

              {currentGeohash && locationEnabled && (
                <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50/70 px-3 py-2 dark:border-emerald-900/50 dark:bg-emerald-900/20">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-medium text-emerald-800 dark:text-emerald-200">Geohash salvo</span>
                    <button
                      type="button"
                      onClick={() => setShowGeoHash((current) => !current)}
                      className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 transition-colors hover:text-emerald-900 dark:text-emerald-300 dark:hover:text-emerald-100"
                    >
                      {showGeoHash ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      {showGeoHash ? 'Ocultar' : 'Exibir'}
                    </button>
                  </div>
                  {showGeoHash ? (
                    <div className="mt-2 inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                      Hash: {currentGeohash}
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </div>
          <Switch checked={locationEnabled} onCheckedChange={handleLocation} disabled={loading === 'location'} />
        </div>

        <div className="flex items-center justify-between p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg text-cyan-600 dark:text-cyan-400">
              <Network className="w-5 h-5" />
            </div>
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">Nexus P2P Sidecar</p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Cache distribuido paralelo ao NDK. Padrao habilitado com relay em wss://nexus.libernet.app.
              </p>
            </div>
          </div>
          <Switch checked={nexusP2PEnabled} onCheckedChange={handleNexusP2P} />
        </div>
      </div>
    </Card>
  )
}
