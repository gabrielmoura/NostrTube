import { useNDKCurrentUser } from '@nostr-dev-kit/ndk-hooks'
import { Link } from '@tanstack/react-router'
import {
  BellRing,
  Cloud,
  Compass,
  Flame,
  FolderOpen,
  LayoutGrid,
  MonitorUp,
  Radio,
  Settings2,
  ShieldCheck,
  UserRound,
  WalletCards,
  Wifi,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { StatusBadge } from '@/components/ui/status-badge'
import { cn } from '@/lib/utils'
import useUserStore from '@/store/useUserStore'

type SidebarKey = 'home' | 'explore' | 'trending' | 'upload' | 'relays' | 'blossom' | 'zaps' | 'subscriptions' | 'live' | 'library' | 'settings' | 'debug'

interface SidebarItem {
  key: SidebarKey
  label: string
  icon: typeof LayoutGrid
  to?: string
  disabled?: boolean
  badge?: ReactNode
}

const primaryItems: SidebarItem[] = [
  { key: 'home', label: 'Início', icon: LayoutGrid, to: '/' },
  { key: 'explore', label: 'Explorar', icon: Compass, to: '/search' },
  { key: 'trending', label: 'Trending', icon: Flame, to: '/trending' },
  { key: 'upload', label: 'Enviar vídeo', icon: MonitorUp, to: '/new' },
  { key: 'relays', label: 'Relays', icon: Wifi, to: '/relays', badge: 'hot' },
  { key: 'blossom', label: 'Blossom', icon: Cloud, to: '/blossom' },
  { key: 'zaps', label: 'Zaps', icon: WalletCards, to: '/zaps' },
  { key: 'subscriptions', label: 'Inscrições', icon: BellRing, to: '/subscriptions' },
  { key: 'live', label: 'Ao vivo', icon: Radio, to: '/live' },
  { key: 'library', label: 'Biblioteca', icon: FolderOpen, to: '/library' },
]

const secondaryItems: SidebarItem[] = [
  { key: 'settings', label: 'Configurações', icon: Settings2, to: '/configuration' },
]

function SidebarRow({ item, activeKey }: { item: SidebarItem; activeKey?: SidebarKey }) {
  const active = item.key === activeKey
  const rowClass = cn(
    'group flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition-colors',
    active
      ? 'bg-primary/14 text-foreground shadow-[inset_0_0_0_1px_rgba(139,92,246,0.24)]'
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
    <Link to={item.to} className={rowClass} activeProps={{ className: rowClass }}>
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
  const profileName = currentUser?.profile?.displayName || currentUser?.profile?.name || 'Sessão anônima'

  return (
    <aside className={cn('flex h-full w-full max-w-[248px] flex-col border-r border-sidebar-border bg-sidebar/90 px-3 py-4 backdrop-blur-xl', className)}>
      <div className="mb-6 px-3">
        <p className="font-display text-lg font-semibold tracking-tight text-sidebar-foreground">NostrTube</p>
        <p className="mt-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">Relay Cinema</p>
      </div>

      <nav className="space-y-1">
        {primaryItems.map((item) => (
          <SidebarRow key={item.key} item={item} activeKey={activeKey} />
        ))}
      </nav>

      <div className="my-5 border-t border-sidebar-border" />

      <div className="space-y-1">
        {secondaryItems.map((item) => (
          <SidebarRow key={item.key} item={item} activeKey={activeKey} />
        ))}
      </div>

      <div className="mt-auto rounded-2xl border border-sidebar-border bg-sidebar-accent/40 p-4 text-sidebar-foreground">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-primary/14 p-2 text-primary">
            <ShieldCheck className="size-4" />
          </div>
          <div>
            <p className="text-sm font-medium">{profileName}</p>
            <p className="text-xs text-muted-foreground">Infra local pronta para redesign</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
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
