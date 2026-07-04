import { NDKKind } from '@nostr-dev-kit/ndk'
import { useCurrentUserProfile, useNDKCurrentUser, useNDKSessionEvent } from '@nostr-dev-kit/ndk-hooks'
import { Link } from '@tanstack/react-router'
import {
  BellRing,
  Bookmark,
  ChevronDown,
  CircleHelp,
  Cloud,
  Compass,
  Clapperboard,
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
  Youtube,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { FeedbackButton } from '@/features/feedback/components/FeedbackButton'
import { NostrTubeLogoWhitText } from '@/components/logo/NostrTube.tsx'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { StatusBadge } from '@/components/ui/status-badge'
import { getNip01PictureFromMetadataEvent } from '@/helper/nostrProfile'
import { cn } from '@/lib/utils'
import useUserStore from '@/store/useUserStore'

type SidebarKey =
  | 'home'
  | 'explore'
  | 'shorts'
  | 'trending'
  | 'upload'
  | 'youtubeImport'
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
  | 'faq'
  | 'terms'
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
  { key: 'shorts', label: 'Shorts', icon: Clapperboard, to: '/shorts' },
  { key: 'subscriptions', label: 'Inscrições', icon: BellRing, to: '/subscriptions' },
  { key: 'live', label: 'Ao vivo', icon: Radio, to: '/live' },
  { key: 'zaps', label: 'Zaps', icon: WalletCards, to: '/zaps' },
  { key: 'explore', label: 'Explorar', icon: Compass, to: '/explore' },
  { key: 'upload', label: 'Enviar vídeo', icon: MonitorUp, to: '/new' },
  { key: 'youtubeImport', label: 'Importar YouTube', icon: Youtube, to: '/import/youtube' },
  { key: 'relays', label: 'Relays', icon: Wifi, to: '/relays', badge: 'hot' },
  { key: 'blossom', label: 'Blossom', icon: Cloud, to: '/blossom' },
]

const libraryItems: SidebarItem[] = [{ key: 'library', label: 'Biblioteca', icon: FolderOpen, to: '/library' }]

const librarySubItems: SidebarItem[] = [
  { key: 'history', label: 'Histórico', icon: History, to: '/library', search: { tab: 'history' } },
  { key: 'watchlater', label: 'Assistir mais tarde', icon: Bookmark, to: '/library', search: { tab: 'watchlater' } },
  { key: 'liked', label: 'Vídeos curtidos', icon: Heart, to: '/library', search: { tab: 'liked' } },
  { key: 'myvideos', label: 'Seus vídeos', icon: PlaySquare, to: '/library', search: { tab: 'myvideos' } },
  { key: 'playlists', label: 'Playlists', icon: ListVideo, to: '/library', search: { tab: 'playlists' } },
]

const secondaryItems: SidebarItem[] = [
  { key: 'settings', label: 'Configurações', icon: Settings2, to: '/configuration', search: { tab: 'platform' } },
  { key: 'faq', label: 'FAQ', icon: CircleHelp, to: '/faq' },
  { key: 'terms', label: 'Termos', icon: ShieldCheck, to: '/terms' },
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
      <item.icon
        className={cn('size-4', active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground')}
      />
      <span className="flex-1 text-left">{item.label}</span>
      {item.badge ? (
        item.badge === 'soon' ? (
          <StatusBadge tone="neutral">soon</StatusBadge>
        ) : (
          <StatusBadge tone="partial">{item.badge}</StatusBadge>
        )
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

function SidebarBrand() {
  return (
    <Link to="/" className="mb-5 block px-2" aria-label="Ir para a página inicial do NostrTube">
      <NostrTubeLogoWhitText
        className="h-auto w-full max-w-[210px] text-sidebar-foreground"
        nostrTextColor="var(--sidebar-foreground)"
        tubeTextColor="var(--primary)"
        taglineColor="var(--muted-foreground)"
      />
    </Link>
  )
}

function SidebarNavSection({
  items,
  activeKey,
  label,
}: {
  items: SidebarItem[]
  activeKey?: SidebarKey
  label: string
}) {
  return (
    <nav className="space-y-1" aria-label={label}>
      {items.map((item) => (
        <SidebarRow key={item.key} item={item} activeKey={activeKey} />
      ))}
    </nav>
  )
}

function SidebarLibrarySection({ activeKey }: { activeKey?: SidebarKey }) {
  const hasActiveLibraryChild = librarySubItems.some((item) => item.key === activeKey)
  const [open, setOpen] = useState(hasActiveLibraryChild)
  const libraryItem = libraryItems[0]

  useEffect(() => {
    if (hasActiveLibraryChild) setOpen(true)
  }, [hasActiveLibraryChild])

  return (
    <div className="space-y-1" aria-label="Biblioteca">
      <SidebarRow item={libraryItem} activeKey={activeKey} />
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger className="group flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-secondary/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60">
          <FolderOpen className="size-4 text-muted-foreground group-hover:text-foreground" />
          <span className="flex-1 text-left">Itens da biblioteca</span>
          <ChevronDown className={cn('size-4 transition-transform', open && 'rotate-180')} />
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-1 space-y-1 pl-3">
          {librarySubItems.map((item) => (
            <SidebarRow key={item.key} item={item} activeKey={activeKey} />
          ))}
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}

function SidebarUserCard({
  currentUser,
  relayCount,
  profileLabel,
  profileImage,
  profileFallback,
}: {
  currentUser: ReturnType<typeof useNDKCurrentUser>
  relayCount: number
  profileLabel: string
  profileImage?: string
  profileFallback: string
}) {
  return (
    <div className="mt-auto rounded-2xl border border-sidebar-border bg-sidebar-accent/45 p-4 text-sidebar-foreground shadow-[inset_0_1px_0_color-mix(in_oklab,var(--foreground)_8%,transparent)]">
      <div className="flex items-center gap-3">
        {currentUser ? (
          <Avatar className="size-9 border border-sidebar-border">
            {profileImage ? <AvatarImage src={profileImage} alt={profileLabel} /> : null}
            {!profileImage ? <AvatarFallback>{profileFallback}</AvatarFallback> : null}
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
          <Link
            to="/u/$userId"
            params={{ userId: currentUser.npub ?? currentUser.pubkey }}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <UserRound className="size-3.5" />
            perfil
          </Link>
        ) : null}
      </div>
    </div>
  )
}

export interface AppSidebarProps {
  activeKey?: SidebarKey
  className?: string
  showMobileFeedback?: boolean
}

export function AppSidebar({ activeKey, className, showMobileFeedback = false }: AppSidebarProps) {
  const currentUser = useNDKCurrentUser()
  const currentProfile = useCurrentUserProfile()
  const metadataEvent = useNDKSessionEvent(NDKKind.Metadata)
  const relayCount = useUserStore((state) => state.session?.relays?.length ?? 0)
  const profileName =
    currentProfile?.displayName ||
    currentProfile?.name ||
    currentUser?.profile?.displayName ||
    currentUser?.profile?.name
  const profileIdentifier = currentUser?.npub || currentUser?.pubkey
  const profileLabel = profileName || (currentUser ? shortenIdentifier(profileIdentifier) : 'Sessão anônima')
  const profileImage =
    getNip01PictureFromMetadataEvent(metadataEvent) || currentProfile?.picture || currentUser?.profile?.picture
  const profileFallback = (profileName || profileIdentifier || 'U').slice(0, 1).toUpperCase()

  return (
    <aside
      className={cn(
        'flex h-full w-full max-w-[248px] flex-col overflow-y-auto border-r border-sidebar-border bg-sidebar/90 px-3 py-4 backdrop-blur-xl',
        className,
      )}
    >
      <SidebarBrand />
      <SidebarNavSection items={primaryItems} activeKey={activeKey} label="Navegação principal" />

      <div className="my-4 border-t border-sidebar-border" />

      <div className="mb-2 px-3 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
        Biblioteca
      </div>
      <SidebarLibrarySection activeKey={activeKey} />

      <div className="my-4 border-t border-sidebar-border" />

      <SidebarNavSection items={secondaryItems} activeKey={activeKey} label="Preferências" />
      {showMobileFeedback ? (
        <div className="mt-2 px-1 md:hidden">
          <FeedbackButton className="w-full justify-start border-sidebar-border bg-sidebar-accent/45 text-sidebar-foreground hover:bg-sidebar-accent" />
        </div>
      ) : null}
      <SidebarUserCard
        currentUser={currentUser}
        relayCount={relayCount}
        profileLabel={profileLabel}
        profileImage={profileImage}
        profileFallback={profileFallback}
      />
    </aside>
  )
}

export type { SidebarKey }
