import { useNDKCurrentUser } from '@nostr-dev-kit/ndk-hooks'
import { Link } from '@tanstack/react-router'
import {
  BellRing,
  Bookmark,
  Cloud,
  Compass,
  Flame,
  FolderOpen,
  Heart,
  History,
  LayoutGrid,
  ListVideo,
  MonitorUp,
  PlaySquare,
  Radio,
  Settings2,
  ShieldCheck,
  UserRound,
  WalletCards,
  Wifi,
} from 'lucide-react'
import type { ReactNode } from 'react'
import logoNostrTube from '@/assets/logo-nostrtube.png'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { StatusBadge } from '@/components/ui/status-badge'
import { cn } from '@/lib/utils'
import useUserStore from '@/store/useUserStore'

type SidebarKey =
  | 'home'
  | 'explore'
  | 'trending'
  | 'upload'
  | 'relays'
  | 'blossom'
  | 'zaps'
  | 'subscriptions'
  | 'live'
  | 'library'
  | 'history'
  | 'watchlater'
  | 'liked'
  | 'myvideos'
  | 'playlists'
  | 'settings'
  | 'debug'

interface SidebarItem {
  key: SidebarKey
  label: string
  icon: typeof LayoutGrid
  to?: string
  search?: Record<string, string>
  disabled?: boolean
  badge?: ReactNode
}

const primaryItems: SidebarItem[] = [
  { key: 'home', label: 'Início', icon: LayoutGrid, to: '/' },
  { key: 'trending', label: 'Trending', icon: Flame, to: '/trending' },
  { key: 'subscriptions', label: 'Inscrições', icon: BellRing, to: '/subscriptions' },
  { key: 'live', label: 'Ao vivo', icon: Radio, to: '/live' },
  { key: 'zaps', label: 'Zaps', icon: WalletCards, to: '/zaps' },
  { key: 'explore', label: 'Explorar', icon: Compass, to: '/explore' },
  { key: 'upload', label: 'Enviar vídeo', icon: MonitorUp, to: '/new' },
  { key: 'relays', label: 'Relays', icon: Wifi, to: '/relays', badge: 'hot' },
  { key: 'blossom', label: 'Blossom', icon: Cloud, to: '/blossom' },
]

const libraryItems: SidebarItem[] = [
  { key: 'library', label: 'Biblioteca', icon: FolderOpen, to: '/library' },
  { key: 'history', label: 'Histórico', icon: History, to: '/library', search: { tab: 'history' } },
  { key: 'watchlater', label: 'Assistir mais tarde', icon: Bookmark, to: '/library', search: { tab: 'watchlater' } },
  { key: 'liked', label: 'Vídeos curtidos', icon: Heart, to: '/library', search: { tab: 'liked' } },
  { key: 'myvideos', label: 'Seus vídeos', icon: PlaySquare, to: '/library', search: { tab: 'myvideos' } },
  { key: 'playlists', label: 'Playlists', icon: ListVideo, to: '/library', search: { tab: 'playlists' } },
]

const secondaryItems: SidebarItem[] = [
  { key: 'settings', label: 'Configurações', icon: Settings2, to: '/configuration', search: { tab: 'platform' } },
]

function shortenIdentifier(identifier?: string) {
  if (!identifier) return ''
  if (identifier.length <= 18) return identifier
  return `${identifier.slice(0, 10)}...${identifier.slice(-6)}`
}

function SidebarRow({ item, activeKey }: { item: SidebarItem; activeKey?: SidebarKey }) {
  const active = item.key === activeKey
  const rowClass = cn(
    'group flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60',
    active
      ? 'bg-primary/14 text-foreground shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--primary)_26%,transparent)]'
      : 'text-muted-foreground hover:bg-secondary/70 hover:text-foreground',
    item.disabled && 'cursor-not-allowed opacity-55 hover:bg-transparent hover:text-muted-foreground',
  )

  const content = (
    <>
      <item.icon className={cn('size-4', active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground')} />
      <span className="flex-1 text-left">{item.label}</span>
      {item.badge ? (
        item.badge === 'soon' ? <StatusBadge tone="neutral">soon</StatusBadge> : <StatusBadge tone="partial">{item.badge}</StatusBadge>
      ) : null}
    </>
  )

  if (item.disabled || !item.to) {
    return (
      <button type="button" disabled className={rowClass}>
        {content}
      </button>
    )
  }

  return (
    <Link to={item.to} search={item.search as never} className={rowClass} activeProps={{ className: rowClass }}>
      {content}
    </Link>
  )
}

export interface AppSidebarProps {
  activeKey?: SidebarKey
  className?: string
}

export function AppSidebar({ activeKey, className }: AppSidebarProps) {
  const currentUser = useNDKCurrentUser()
  const relayCount = useUserStore((state) => state.session?.relays?.length ?? 0)
  const profileName = currentUser?.profile?.displayName || currentUser?.profile?.name
  const profileIdentifier = currentUser?.npub || currentUser?.pubkey
  const profileLabel = profileName || (currentUser ? shortenIdentifier(profileIdentifier) : 'Sessão anônima')
  const profileImage = currentUser?.profile?.image || currentUser?.profile?.picture
  const profileFallback = (profileName || profileIdentifier || 'U').slice(0, 1).toUpperCase()

  return (
    <aside className={cn('flex h-full w-full max-w-[248px] flex-col border-r border-sidebar-border bg-sidebar/90 px-3 py-4 backdrop-blur-xl', className)}>
      <div className="mb-5 flex items-center gap-3 px-3">
        <img src={logoNostrTube} alt="NostrTube" className="size-10 rounded-2xl object-contain shadow-lg" />
        <div className="min-w-0">
          <p className="font-display text-lg font-semibold leading-tight tracking-tight text-sidebar-foreground">NostrTube</p>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Relay Cinema</p>
        </div>
      </div>

      <nav className="space-y-1" aria-label="Navegação principal">
        {primaryItems.map((item) => (
          <SidebarRow key={item.key} item={item} activeKey={activeKey} />
        ))}
      </nav>

      <div className="my-4 border-t border-sidebar-border" />

      <div className="mb-2 px-3 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Biblioteca</div>

      <nav className="space-y-1" aria-label="Biblioteca">
        {libraryItems.map((item) => (
          <SidebarRow key={item.key} item={item} activeKey={activeKey} />
        ))}
      </nav>

      <div className="my-4 border-t border-sidebar-border" />

      <div className="space-y-1" aria-label="Preferências">
        {secondaryItems.map((item) => (
          <SidebarRow key={item.key} item={item} activeKey={activeKey} />
        ))}
      </div>

      <div className="mt-auto rounded-2xl border border-sidebar-border bg-sidebar-accent/45 p-4 text-sidebar-foreground shadow-[inset_0_1px_0_color-mix(in_oklab,var(--foreground)_8%,transparent)]">
        <div className="flex items-center gap-3">
          {currentUser ? (
            <Avatar className="size-9 border border-sidebar-border">
              <AvatarImage src={profileImage} alt={profileLabel} />
              <AvatarFallback>{profileFallback}</AvatarFallback>
            </Avatar>
          ) : (
            <div className="rounded-2xl bg-primary/14 p-2 text-primary">
              <ShieldCheck className="size-4" />
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{profileLabel}</p>
            <p className="text-xs text-muted-foreground">{currentUser ? 'Sessão Nostr ativa' : 'Navegando sem login'}</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <StatusBadge tone={currentUser ? 'healthy' : 'neutral'}>{currentUser ? 'logado' : 'anônimo'}</StatusBadge>
          <StatusBadge tone={relayCount > 0 ? 'healthy' : 'warning'}>{relayCount} relays</StatusBadge>
          {currentUser ? (
            <Link to="/u/$userId" params={{ userId: currentUser.npub ?? currentUser.pubkey }} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              <UserRound className="size-3.5" />
              perfil
            </Link>
          ) : null}
        </div>
      </div>
    </aside>
  )
}

export type { SidebarKey }
