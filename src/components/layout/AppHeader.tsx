import { NDKKind, type NDKUser } from '@nostr-dev-kit/ndk'
import {
  useCurrentUserProfile,
  useNDKCurrentUser,
  useNDKSessionEvent,
  useNDKSessionLogout,
} from '@nostr-dev-kit/ndk-hooks'
import { Link, useNavigate } from '@tanstack/react-router'
import {
  Bell,
  CircleHelp,
  LogIn,
  LogOut,
  Menu,
  Search,
  Settings2,
  ShieldCheck,
  Upload,
  UserRound,
  Youtube,
} from 'lucide-react'
import type { KeyboardEvent } from 'react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AuthModal } from '@/components/AuthModal'
import { AppSidebar, type SidebarKey } from '@/components/layout/AppSidebar'
import { NostrTubeLogo } from '@/components/logo/NostrTube.tsx'
import { modal } from '@/components/modal_v2/modal-manager'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { FeedbackButton } from '@/features/feedback/components/FeedbackButton'
import { getNip01PictureFromMetadataEvent } from '@/helper/nostrProfile'
import { cn } from '@/lib/utils'
import useUserStore from '@/store/useUserStore'

export interface AppHeaderProps {
  activeKey?: SidebarKey
}

interface HeaderSearchProps {
  compact?: boolean
  onSearch: (event: KeyboardEvent<HTMLInputElement>) => void
}

function HeaderSearch({ compact = false, onSearch }: HeaderSearchProps) {
  const { t } = useTranslation('common')
  return (
    <div className={compact ? 'relative mt-3 sm:hidden' : 'relative hidden max-w-2xl flex-1 sm:block'}>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        autoFocus={compact}
        className="h-10 rounded-2xl border-border/70 bg-card/70 pl-9 shadow-none"
        placeholder={t('search_placeholder')}
        onKeyDown={onSearch}
      />
    </div>
  )
}

function MobileNavigation({ activeKey }: { activeKey?: SidebarKey }) {
  const { t } = useTranslation('common')
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="glass" size="icon" className="lg:hidden">
          <Menu className="size-4" />
          <span className="sr-only">{t('open_navigation')}</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[min(286px,calc(100vw-32px))] border-border bg-sidebar p-0">
        <AppSidebar activeKey={activeKey} className="max-w-none border-r-0" showMobileFeedback />
      </SheetContent>
    </Sheet>
  )
}

function MobileBrand() {
  const { t } = useTranslation('common')
  return (
    <Link
      to="/"
      className="mr-1 flex size-9 shrink-0 items-center justify-center lg:hidden"
      aria-label={t('go_to_homepage')}
    >
      <NostrTubeLogo className="size-9" />
    </Link>
  )
}

function HeaderUtilityActions({
  currentUser,
  onToggleMobileSearch,
}: {
  currentUser: NDKUser | null | undefined
  onToggleMobileSearch: () => void
}) {
  const { t: tc } = useTranslation('common')
  const { t: tpages } = useTranslation('pages')
  return (
    <>
      <Button
        variant="glass"
        size="icon"
        className="sm:hidden"
        aria-label={tc('Search')}
        onClick={onToggleMobileSearch}
      >
        <Search className="size-4" />
      </Button>

      <div className="hidden md:flex items-center gap-2">
        <FeedbackButton />
        <Link to="/faq" className={cn(buttonVariants({ variant: 'glass', size: 'icon-sm' }), 'xl:hidden')}>
          <CircleHelp className="size-4" />
          <span className="sr-only">{tpages('sidebar_faq')}</span>
        </Link>
        <Link to="/faq" className={cn(buttonVariants({ variant: 'glass', size: 'sm' }), 'hidden xl:inline-flex')}>
          <CircleHelp className="size-4" />
          {tpages('sidebar_faq')}
        </Link>
        <Link to="/terms" className={cn(buttonVariants({ variant: 'glass', size: 'sm' }), 'hidden xl:inline-flex')}>
          <ShieldCheck className="size-4" />
          {tpages('sidebar_terms')}
        </Link>
        <Link to="/new" className={buttonVariants({ variant: 'gradient', size: 'sm' })}>
          <Upload className="size-4" />
          {tpages('sidebar_upload')}
        </Link>
        <Link
          to="/import/youtube"
          className={cn(buttonVariants({ variant: 'glass', size: 'sm' }), 'hidden xl:inline-flex')}
        >
          <Youtube className="size-4" />
          {tpages('sidebar_import_youtube')}
        </Link>
      </div>

      <Button variant="glass" size="icon" aria-label={tc('notifications')}>
        <Bell className="size-4" />
      </Button>
      {!currentUser ? (
        <Button
          variant="relay"
          size="sm"
          className="hidden min-[420px]:inline-flex"
          onClick={() => modal.show(<AuthModal />, { id: 'auth' })}
        >
          <LogIn className="size-4" />
          {tc('login')}
        </Button>
      ) : null}
      {!currentUser ? (
        <Button
          variant="relay"
          size="icon"
          className="min-[420px]:hidden"
          aria-label={tc('login')}
          onClick={() => modal.show(<AuthModal />, { id: 'auth' })}
        >
          <LogIn className="size-4" />
        </Button>
      ) : null}
    </>
  )
}

function HeaderUserMenu({
  currentUser,
  profileName,
  profileImage,
  profileFallback,
  onLogout,
}: {
  currentUser: NDKUser | null | undefined
  profileName: string
  profileImage?: string
  profileFallback: string
  onLogout: () => void
}) {
  const { t: tc } = useTranslation('common')
  const { t: tpages } = useTranslation('pages')
  if (!currentUser) {
    return (
      <Link
        to="/configuration"
        search={{ tab: 'platform' }}
        className={buttonVariants({ variant: 'glass', size: 'icon' })}
      >
        <Settings2 className="size-4" />
        <span className="sr-only">{tpages('sidebar_settings')}</span>
      </Link>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="glass" size="icon" className="rounded-full p-1" aria-label={tc('user_menu')}>
          <Avatar className="size-8">
            {profileImage ? <AvatarImage src={profileImage} alt={profileName} /> : null}
            {!profileImage ? <AvatarFallback>{profileFallback}</AvatarFallback> : null}
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="truncate">{profileName}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/u/$userId" params={{ userId: currentUser.npub ?? currentUser.pubkey }}>
            <UserRound className="size-4" />
            {tc('profile')}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/configuration">
            <Settings2 className="size-4" />
            {tpages('sidebar_settings')}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onLogout}>
          <LogOut className="size-4" />
          {tc('logout')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function AppHeader({ activeKey }: AppHeaderProps) {
  const navigate = useNavigate()
  const currentUser = useNDKCurrentUser()
  const logout = useNDKSessionLogout()
  const clearSession = useUserStore((state) => state.clearSession)
  const currentProfile = useCurrentUserProfile()
  const metadataEvent = useNDKSessionEvent(NDKKind.Metadata)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const { t } = useTranslation('common')
  const profileName =
    currentProfile?.displayName ||
    currentProfile?.name ||
    currentUser?.profile?.displayName ||
    currentUser?.profile?.name ||
    t('user')
  const profileImage =
    getNip01PictureFromMetadataEvent(metadataEvent) || currentProfile?.picture || currentUser?.profile?.picture
  const profileFallback = profileName.slice(0, 1).toUpperCase()

  const handleLogout = () => {
    logout()
    clearSession()
    navigate({ to: '/' })
  }

  const handleSearch = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return
    const query = event.currentTarget.value.trim()
    if (!query) return
    navigate({ to: '/search', search: { search: query } as never })
  }

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/78 px-3 py-3 backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="flex items-center gap-2 sm:gap-3">
        <MobileNavigation activeKey={activeKey} />
        <MobileBrand />
        <HeaderSearch onSearch={handleSearch} />

        <div className="ml-auto flex items-center gap-2">
          <HeaderUtilityActions
            currentUser={currentUser}
            onToggleMobileSearch={() => setMobileSearchOpen((open) => !open)}
          />
          <HeaderUserMenu
            currentUser={currentUser}
            profileName={profileName}
            profileImage={profileImage}
            profileFallback={profileFallback}
            onLogout={handleLogout}
          />
        </div>
      </div>
      {mobileSearchOpen ? <HeaderSearch compact onSearch={handleSearch} /> : null}
    </header>
  )
}
