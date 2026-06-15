import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { useNDK, useNDKCurrentUser } from '@nostr-dev-kit/ndk-hooks'
import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import {
  Bell,
  Cloud,
  Cpu,
  Eye,
  EyeOff,
  HandCoins,
  Lightbulb,
  Mail,
  Monitor,
  Moon,
  Palette,
  Play,
  RadioTower,
  Settings2,
  ShieldCheck,
  Sun,
  Upload,
  User,
  UserRound,
  Wifi,
  Zap,
} from 'lucide-react'
import { AuthModal } from '@/components/AuthModal.tsx'
import { AppShell } from '@/components/layout/AppShell'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MetricCard } from '@/components/ui/metric-card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { StatusBadge } from '@/components/ui/status-badge'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { modal } from '@/components/modal_v2/modal-manager.ts'
import { useZapStats } from '@/features/zap/hooks/useZapStats'
import { publishDmRelayList } from '@/lib/ndk-messages'
import { BlossomSettings } from '@/routes/configuration/@components/BlossomSettings.tsx'
import { PermissionSettings } from '@/routes/configuration/@components/PermissionSettings.tsx'
import { RelaySettings } from '@/routes/configuration/@components/RelaySettings.tsx'
import { VisibilitySettings } from '@/routes/configuration/@components/VisibilitySettings.tsx'
import { useUploadPreferencesStore, type ThumbnailGenerationMode } from '@/store/useUploadPreferencesStore'
import useUserStore from '@/store/useUserStore.ts'

type SettingsTab = 'appearance' | 'player' | 'privacy' | 'relays-blossom' | 'profile' | 'account' | 'notifications'
type SettingsGroup = 'platform' | 'user'
const userSettingsTabs: SettingsTab[] = ['profile', 'account', 'notifications']
const platformSettingsTabs: SettingsTab[] = ['appearance', 'player', 'privacy', 'relays-blossom']

function getSettingsGroup(tab: SettingsTab): SettingsGroup {
  return userSettingsTabs.includes(tab) ? 'user' : 'platform'
}

function formatSats(value: number | null | undefined) {
  if (value == null) return '0 sats'
  return `${value.toLocaleString()} sats`
}

function shortenIdentifier(identifier?: string) {
  if (!identifier) return ''
  if (identifier.length <= 18) return identifier
  return `${identifier.slice(0, 10)}...${identifier.slice(-6)}`
}

// ====================================================================
// Sub-componentes para as novas seções
// ====================================================================

function ProfileSection() {
  const currentUser = useNDKCurrentUser()
  const profile = currentUser?.profile

  if (!currentUser) return null

  const pubkeyDisplay = currentUser.npub
    ? `${currentUser.npub.slice(0, 12)}…${currentUser.npub.slice(-6)}`
    : currentUser.pubkey

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <User className="size-5 text-primary" />
          <CardTitle className="text-base">Perfil do criador</CardTitle>
        </div>
        <CardDescription>Suas informações públicas na rede Nostr.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Avatar + Banner preview */}
        <div className="flex items-center gap-4">
          <Avatar className="size-16 border-2 border-border">
            <AvatarImage src={profile?.image || profile?.picture} />
            <AvatarFallback>{(profile?.name || 'U').slice(0, 1).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <p className="font-medium text-foreground">{profile?.displayName || profile?.name || 'Sessão anônima'}</p>
            <p className="font-mono text-xs text-muted-foreground">{pubkeyDisplay}</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="settings-name">Nome de exibição</Label>
            <Input id="settings-name" defaultValue={profile?.displayName || profile?.name || ''} placeholder="Seu nome" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="settings-website">Website</Label>
            <Input id="settings-website" defaultValue={profile?.website || ''} placeholder="https://" />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="settings-bio">Bio</Label>
            <Input id="settings-bio" defaultValue={profile?.bio || profile?.about || ''} placeholder="Conte um pouco sobre você" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="settings-location">Localização</Label>
            <Input id="settings-location" defaultValue={profile?.lud06 || ''} placeholder="Cidade, País" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="settings-lang">Idioma padrão</Label>
            <Select defaultValue="pt-BR">
              <SelectTrigger id="settings-lang">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Español</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="gradient">Salvar alterações</Button>
          <Link
            to="/u/$userId/edit"
            params={{ userId: currentUser.npub ?? currentUser.pubkey }}
            className={buttonVariants({ variant: "glass" })}
          >
            Editar perfil completo
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

function AccountSection() {
  const currentUser = useNDKCurrentUser()
  const nsfw = useUserStore((state) => state.session?.nsfw ?? false)
  const setNsfw = useUserStore((state) => state.setNsfw)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-5 text-primary" />
          <CardTitle className="text-base">Conta e segurança</CardTitle>
        </div>
        <CardDescription>Gerencie sua sessão e preferências da conta.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-center justify-between rounded-xl border border-border/60 bg-card/60 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-500/14 p-2 text-emerald-400">
              <UserRound className="size-4" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Sessão Nostr</p>
              <p className="text-xs text-muted-foreground">{currentUser ? 'Ativa' : 'Inativa — faça login'}</p>
            </div>
          </div>
          <StatusBadge tone={currentUser ? 'healthy' : 'warning'}>{currentUser ? 'Conectada' : 'Desconectada'}</StatusBadge>
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-sm font-medium">Bloquear conteúdo NSFW</Label>
            <p className="text-xs text-muted-foreground">Oculta vídeos marcados como sensíveis.</p>
          </div>
          <Switch checked={nsfw} onCheckedChange={(c) => setNsfw(c)} />
        </div>

        <Separator />

        <div className="flex flex-wrap gap-2">
          <Button variant="glass">Exportar dados da conta</Button>
          <Button variant="dangerSoft">Encerrar sessão</Button>
        </div>
      </CardContent>
    </Card>
  )
}

function AppearanceSection() {
  const [theme, setTheme] = useState<'dark' | 'light' | 'system'>(
    () => (localStorage.getItem('theme') as 'dark' | 'light' | 'system') || 'dark'
  )

  const handleThemeChange = (value: string) => {
    const newTheme = value as 'dark' | 'light' | 'system'
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    if (newTheme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      document.documentElement.classList.toggle('dark', prefersDark)
    } else {
      document.documentElement.classList.toggle('dark', newTheme === 'dark')
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Palette className="size-5 text-primary" />
          <CardTitle className="text-base">Aparência e experiência</CardTitle>
        </div>
        <CardDescription>Personalize a aparência do NostrTube.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-sm font-medium">Tema</Label>
            <p className="text-xs text-muted-foreground">Escuro, claro ou segue o sistema.</p>
          </div>
          <div className="flex gap-1 rounded-xl border border-border/60 bg-card/60 p-1">
            <Button
              variant={theme === 'dark' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleThemeChange('dark')}
            >
              <Moon className="size-4" />
              <span className="sr-only">Escuro</span>
            </Button>
            <Button
              variant={theme === 'light' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleThemeChange('light')}
            >
              <Sun className="size-4" />
              <span className="sr-only">Claro</span>
            </Button>
            <Button
              variant={theme === 'system' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleThemeChange('system')}
            >
              <Monitor className="size-4" />
              <span className="sr-only">Sistema</span>
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-sm font-medium">Cor de destaque</Label>
            <p className="text-xs text-muted-foreground">Roxo, ciano ou âmbar.</p>
          </div>
          <div className="flex gap-2">
            <button type="button" className="size-7 rounded-full bg-[oklch(var(--primary))] ring-2 ring-primary ring-offset-2 ring-offset-background" aria-label="Roxo" />
            <button type="button" className="size-7 rounded-full bg-cyan-400 ring-offset-2 ring-offset-background hover:ring-2 hover:ring-cyan-400" aria-label="Ciano" />
            <button type="button" className="size-7 rounded-full bg-amber-400 ring-offset-2 ring-offset-background hover:ring-2 hover:ring-amber-400" aria-label="Âmbar" />
          </div>
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-sm font-medium">Prévias automáticas</Label>
            <p className="text-xs text-muted-foreground">Reproduz prévias ao passar o mouse.</p>
          </div>
          <Switch defaultChecked />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-sm font-medium">Miniaturas animadas</Label>
            <p className="text-xs text-muted-foreground">Animações sutis nas thumbnails.</p>
          </div>
          <Switch defaultChecked />
        </div>
      </CardContent>
    </Card>
  )
}

function NotificationsSection() {
  const [switches, setSwitches] = useState({
    comments: true,
    zaps: true,
    subscriptions: false,
    relays: true,
    weekly: false,
  })

  const toggle = (key: keyof typeof switches) => {
    setSwitches((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Bell className="size-5 text-primary" />
          <CardTitle className="text-base">Notificações</CardTitle>
        </div>
        <CardDescription>Controle quais notificações você recebe.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <NotificationRow label="Novos comentários" description="Alertas de respostas nos seus vídeos." checked={switches.comments} onChange={() => toggle('comments')} />
        <NotificationRow label="Zaps recebidos" description="Notifique quando receber um Zap." checked={switches.zaps} onChange={() => toggle('zaps')} />
        <NotificationRow label="Inscrições" description="Novos vídeos de criadores que você segue." checked={switches.subscriptions} onChange={() => toggle('subscriptions')} />
        <NotificationRow label="Relays instáveis" description="Alertas sobre quedas de conexão." checked={switches.relays} onChange={() => toggle('relays')} />
        <NotificationRow label="Resumo semanal" description="Email ou notificação com resumo da semana." checked={switches.weekly} onChange={() => toggle('weekly')} />
      </CardContent>
    </Card>
  )
}

function NotificationRow({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: () => void }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border/60 bg-card/60 px-4 py-3">
      <div className="space-y-0.5">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  )
}

function PlayerSection() {
  const thumbnailGenerationMode = useUploadPreferencesStore((state) => state.thumbnailGenerationMode)
  const setThumbnailGenerationMode = useUploadPreferencesStore((state) => state.setThumbnailGenerationMode)
  const thumbnailModeOptions: Array<{
    value: ThumbnailGenerationMode
    title: string
    description: string
    icon: typeof Cpu
  }> = [
    {
      value: 'local',
      title: 'Local',
      description: 'Tenta gerar no navegador primeiro. Se falhar, usa ffmpeg.wasm quando disponível.',
      icon: Cpu,
    },
    {
      value: 'remote',
      title: 'Remoto',
      description: 'Usa um DVM para gerar thumbnails a partir da fonte de vídeo publicada/importada.',
      icon: RadioTower,
    },
  ]

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Play className="size-5 text-primary" />
          <CardTitle className="text-base">Player e upload</CardTitle>
        </div>
        <CardDescription>Preferências de reprodução e envio de vídeos.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-3 rounded-2xl border border-border/70 bg-card/60 p-4">
          <div>
            <Label className="text-sm font-medium">Geração de thumbnail</Label>
            <p className="mt-1 text-xs text-muted-foreground">
              Preferência global usada na tela de upload e importação por URL.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {thumbnailModeOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setThumbnailGenerationMode(option.value)}
                className={cn(
                  'flex items-start gap-3 rounded-2xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60',
                  thumbnailGenerationMode === option.value
                    ? 'border-primary/60 bg-primary/10 text-foreground shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--primary)_20%,transparent)]'
                    : 'border-border/70 bg-background/35 text-muted-foreground hover:border-primary/35 hover:bg-secondary/55',
                )}
                aria-pressed={thumbnailGenerationMode === option.value}
              >
                <span className="rounded-2xl bg-secondary p-2 text-primary">
                  <option.icon className="size-4" />
                </span>
                <span>
                  <span className="block text-sm font-medium text-foreground">{option.title}</span>
                  <span className="mt-1 block text-xs leading-5 text-muted-foreground">{option.description}</span>
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="quality">Qualidade padrão</Label>
            <Select defaultValue="auto">
              <SelectTrigger id="quality">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Automática</SelectItem>
                <SelectItem value="1080p">1080p</SelectItem>
                <SelectItem value="720p">720p</SelectItem>
                <SelectItem value="480p">480p</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="speed">Velocidade padrão</Label>
            <Select defaultValue="1x">
              <SelectTrigger id="speed">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0.5x">0.5x</SelectItem>
                <SelectItem value="1x">1x (Normal)</SelectItem>
                <SelectItem value="1.5x">1.5x</SelectItem>
                <SelectItem value="2x">2x</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Legendas ativadas por padrão</Label>
              <p className="text-xs text-muted-foreground">Exibir legendas automaticamente.</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Picture-in-Picture (PiP)</Label>
              <p className="text-xs text-muted-foreground">Flutuar o vídeo ao navegar.</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">HLS preferencial</Label>
              <p className="text-xs text-muted-foreground">Usar HLS quando disponível.</p>
            </div>
            <Switch defaultChecked />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ====================================================================
// Página principal
// ====================================================================

export default function ConfigurationPageContent() {
  const currentUser = useNDKCurrentUser()
  const { ndk } = useNDK()
  const navigate = useNavigate()
  const { tab: searchTab } = useSearch({ from: '/configuration' })
  const zapStatsQuery = useZapStats()
  const selectedRelays = useUserStore((state) => state.session?.relays) ?? import.meta.env.VITE_NOSTR_RELAYS ?? []
  const blossomDefault = useUserStore((state) => state.blossom.default)
  const blossomMirrors = useUserStore((state) => state.blossom.mirrors)
  const [activeTab, setActiveTabState] = useState<SettingsTab>(() => (searchTab === 'user' ? 'profile' : 'appearance'))
  const profileName = currentUser?.profile?.displayName || currentUser?.profile?.name
  const sessionIdentifier = currentUser?.npub || currentUser?.pubkey
  const sessionMetricValue = currentUser ? profileName || shortenIdentifier(sessionIdentifier) || 'Conectada' : 'Anônima'
  const zapMetricValue = currentUser
    ? zapStatsQuery.isLoading
      ? 'Carregando'
      : formatSats(zapStatsQuery.data?.received30d)
    : 'Login'
  const zapMetricDescription = currentUser
    ? zapStatsQuery.isError
      ? 'Não foi possível carregar seus Zaps agora.'
      : 'Recebidos nos últimos 30 dias.'
    : 'Entre para ver seus Zaps.'

  const setActiveTab = useCallback((nextTab: SettingsTab) => {
    setActiveTabState(nextTab)
    navigate({
      to: '/configuration',
      search: (old: { tab?: SettingsGroup }) => ({ ...old, tab: getSettingsGroup(nextTab) }),
      replace: true,
    })
  }, [navigate])

  useEffect(() => {
    if (!currentUser && userSettingsTabs.includes(activeTab)) {
      setActiveTab('appearance')
    }
  }, [activeTab, currentUser, setActiveTab])

  useEffect(() => {
    if (searchTab === 'user') {
      if (currentUser) {
        if (!userSettingsTabs.includes(activeTab)) setActiveTabState('profile')
      } else {
        setActiveTab('appearance')
      }
      return
    }

    if (searchTab === 'platform' && !platformSettingsTabs.includes(activeTab)) {
      setActiveTabState('appearance')
    }
  }, [activeTab, currentUser, searchTab, setActiveTab])

  // Coluna direita
  const aside = (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Resumo da plataforma</CardTitle>
          <CardDescription>Preferências disponíveis neste dispositivo.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Relays</span>
            <span className="font-medium text-foreground">{selectedRelays.length}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Mirrors Blossom</span>
            <span className="font-medium text-foreground">{blossomMirrors.length}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Sessão</span>
            <StatusBadge tone={currentUser ? 'healthy' : 'warning'}>{currentUser ? 'Ativa' : 'Inativa'}</StatusBadge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Integrações</CardTitle>
          <CardDescription>Ferramentas locais e integrações da conta.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-center gap-2 rounded-xl border border-border/60 px-3 py-2">
            <ShieldCheck className="size-4 text-primary" />
            <span className="text-muted-foreground">Nostr Extension</span>
            <StatusBadge tone={currentUser ? 'healthy' : 'warning'} className="ml-auto">
              {currentUser ? 'Conectada' : 'Login'}
            </StatusBadge>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-border/60 px-3 py-2">
            <Zap className="size-4 text-[oklch(var(--lightning))]" />
            <span className="text-muted-foreground">Lightning Wallet</span>
            <StatusBadge tone="neutral" className="ml-auto">Wallet</StatusBadge>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-border/60 px-3 py-2">
            <Cloud className="size-4 text-cyan-400" />
            <span className="text-muted-foreground">Blossom</span>
            <StatusBadge tone={blossomDefault ? 'healthy' : 'warning'} className="ml-auto">{blossomDefault ? 'Configurado' : 'Pendente'}</StatusBadge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dicas rápidas</CardTitle>
          <CardDescription>Pequenos hábitos para fortalecer sua presença.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-start gap-2"><Lightbulb className="mt-0.5 size-4 shrink-0 text-primary" />Configure ao menos 3 relays para redundância.</div>
          <div className="flex items-start gap-2"><Lightbulb className="mt-0.5 size-4 shrink-0 text-primary" />Use Blossom mirrors para distribuir sua mídia.</div>
          <div className="flex items-start gap-2"><Lightbulb className="mt-0.5 size-4 shrink-0 text-primary" />Ative notificações de Zaps para não perder apoios.</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Fortaleça sua presença</CardTitle>
          <CardDescription>Compartilhe conteúdo e conecte-se com a comunidade.</CardDescription>
        </CardHeader>
        <CardContent>
          <Link to="/new" className={cn(buttonVariants({ variant: "gradient" }), "w-full")}>
            Publicar vídeo
            <Upload className="size-4" />
          </Link>
        </CardContent>
      </Card>
    </>
  )

  const handlePublishDmRelays = async () => {
    if (!currentUser) {
      modal.show(<AuthModal />, { id: 'auth' })
      return
    }
    if (!ndk) {
      toast.error('NDK ainda não está pronto.')
      return
    }
    try {
      await publishDmRelayList(ndk, selectedRelays)
      toast.success('Lista de relays de DM publicada com sucesso.')
    } catch (error) {
      console.error(error)
      toast.error('Falha ao publicar a lista de relays de DM.')
    }
  }

  return (
    <AppShell
      activeKey="settings"
      title="Configurações"
      description="Personalize sua conta, experiência e integrações no NostrTube."
      icon={Settings2}
      eyebrow="Fase 4"
      badge="Relay Cinema"
      aside={aside}
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Relays configurados" value={`${selectedRelays.length}`} description="Pool ativa para sincronização." icon={Wifi} tone="relay" />
        <MetricCard title="Mirrors Blossom" value={`${blossomMirrors.length}`} description={blossomDefault ? 'Primário definido.' : 'Fallback padrão.'} icon={Cloud} tone="zap" />
        <MetricCard title="Sessão Nostr" value={sessionMetricValue} description={currentUser ? 'Sessão ativa neste dispositivo.' : 'Configurações da plataforma seguem disponíveis.'} icon={ShieldCheck} tone={currentUser ? 'success' : 'default'} />
        <MetricCard title="Zaps recebidos" value={zapMetricValue} description={zapMetricDescription} icon={HandCoins} tone="zap" />
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as SettingsTab)} className="w-full">
        <TabsList className="mb-6 flex h-auto w-full flex-wrap justify-start gap-2 rounded-2xl border border-border/70 bg-card/70 p-2">
          <span className="flex items-center px-2 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Plataforma</span>
          <TabsTrigger value="appearance" className="rounded-xl data-[state=active]:border-b-2 data-[state=active]:border-primary">Aparência</TabsTrigger>
          <TabsTrigger value="player" className="rounded-xl data-[state=active]:border-b-2 data-[state=active]:border-primary">Player</TabsTrigger>
          <TabsTrigger value="privacy" className="rounded-xl data-[state=active]:border-b-2 data-[state=active]:border-primary">Privacidade</TabsTrigger>
          <TabsTrigger value="relays-blossom" className="rounded-xl data-[state=active]:border-b-2 data-[state=active]:border-primary">Relays &amp; Blossom</TabsTrigger>
          <span className="flex items-center px-2 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Usuário</span>
          {currentUser ? (
            <>
              <TabsTrigger value="profile" className="rounded-xl data-[state=active]:border-b-2 data-[state=active]:border-primary">Perfil</TabsTrigger>
              <TabsTrigger value="account" className="rounded-xl data-[state=active]:border-b-2 data-[state=active]:border-primary">Conta</TabsTrigger>
              <TabsTrigger value="notifications" className="rounded-xl data-[state=active]:border-b-2 data-[state=active]:border-primary">Notificações</TabsTrigger>
            </>
          ) : (
            <Button variant="glass" size="sm" onClick={() => modal.show(<AuthModal />, { id: 'auth' })}>Entrar para conta</Button>
          )}
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <ProfileSection />
        </TabsContent>

        <TabsContent value="account" className="space-y-4">
          <AccountSection />
        </TabsContent>

        <TabsContent value="appearance" className="space-y-4">
          <AppearanceSection />
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <NotificationsSection />
        </TabsContent>

        <TabsContent value="privacy" className="space-y-4">
          <PermissionSettings />
          <VisibilitySettings />
        </TabsContent>

        <TabsContent value="player" className="space-y-4">
          <PlayerSection />
        </TabsContent>

        <TabsContent value="relays-blossom" className="space-y-6">
          <RelaySettings />
          <BlossomSettings />

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Mail className="size-5 text-primary" />
                <CardTitle className="text-base">Mensagens privadas Nostr</CardTitle>
              </div>
              <CardDescription>Publique a sua lista de relays preferidos para DM via NIP-17.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                Isso ajuda outros clientes a descobrir onde entregar mensagens privadas para a sua conta.
              </p>
              <Button onClick={handlePublishDmRelays}>Publicar relays de DM</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AppShell>
  )
}
