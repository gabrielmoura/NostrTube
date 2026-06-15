import { useNDKCurrentUser, useNDKSessionLogout } from '@nostr-dev-kit/ndk-hooks'
import { Link, useNavigate } from '@tanstack/react-router'
import { Bell, CircleHelp, LogOut, Menu, Search, Settings2, ShieldCheck, Upload, UserRound } from 'lucide-react'
import type { KeyboardEvent } from 'react'
import { useState } from 'react'
import logoNostrTube from '@/assets/logo-nostrtube.png'
import { AppSidebar, type SidebarKey } from '@/components/layout/AppSidebar'
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
import useUserStore from '@/store/useUserStore'

export interface AppHeaderProps {
  activeKey?: SidebarKey
}

export function AppHeader({ activeKey }: AppHeaderProps) {
  const navigate = useNavigate()
  const currentUser = useNDKCurrentUser()
  const logout = useNDKSessionLogout()
  const clearSession = useUserStore((state) => state.clearSession)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const profileName = currentUser?.profile?.displayName || currentUser?.profile?.name || 'Usuário'
  const profileImage = currentUser?.profile?.image || currentUser?.profile?.picture
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
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="glass" size="icon" className="lg:hidden">
              <Menu className="size-4" />
              <span className="sr-only">Abrir navegação</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[286px] border-border bg-sidebar p-0">
            <AppSidebar activeKey={activeKey} className="max-w-none border-r-0" />
          </SheetContent>
        </Sheet>

        <Link to="/" className="mr-1 flex min-w-0 items-center gap-2 lg:hidden">
          <img src={logoNostrTube} alt="NostrTube" className="size-9 shrink-0 rounded-2xl object-contain shadow-lg" />
          <span className="hidden font-display text-sm font-semibold tracking-tight text-foreground sm:inline">NostrTube</span>
        </Link>

        <div className="relative hidden max-w-2xl flex-1 sm:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="h-10 rounded-2xl border-border/70 bg-card/70 pl-9 shadow-none" placeholder="Buscar vídeos, criadores ou tags" onKeyDown={handleSearch} />
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button variant="glass" size="icon" className="sm:hidden" aria-label="Buscar" onClick={() => setMobileSearchOpen((open) => !open)}>
            <Search className="size-4" />
          </Button>
          <FeedbackButton />
          <Link to="/faq" className={buttonVariants({ variant: 'glass', size: 'icon-sm', className: 'hidden sm:inline-flex md:hidden' })}>
            <CircleHelp className="size-4" />
            <span className="sr-only">FAQ</span>
          </Link>
          <Link to="/faq" className={buttonVariants({ variant: 'glass', size: 'sm', className: 'hidden md:inline-flex' })}>
            <CircleHelp className="size-4" />
            FAQ
          </Link>
          <Link to="/terms" className={buttonVariants({ variant: 'glass', size: 'sm', className: 'hidden xl:inline-flex' })}>
            <ShieldCheck className="size-4" />
            Termos
          </Link>
          <Link to="/new" className={buttonVariants({ variant: 'gradient', size: 'sm', className: 'hidden sm:inline-flex' })}>
            <Upload className="size-4" />
            Enviar vídeo
          </Link>
          <Link to="/new" className={buttonVariants({ variant: 'gradient', size: 'icon', className: 'sm:hidden' })}>
            <Upload className="size-4" />
            <span className="sr-only">Enviar vídeo</span>
          </Link>
          <Button variant="glass" size="icon" aria-label="Notificações">
            <Bell className="size-4" />
          </Button>
          {!currentUser ? (
            <Link to="/configuration" search={{ tab: 'platform' }} className={buttonVariants({ variant: 'glass', size: 'icon' })}>
              <Settings2 className="size-4" />
              <span className="sr-only">Configurações</span>
            </Link>
          ) : null}
          {currentUser ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="glass" size="icon" className="rounded-full p-1" aria-label="Menu do usuário">
                  <Avatar className="size-8">
                    <AvatarImage src={profileImage} alt={profileName} />
                    <AvatarFallback>{profileFallback}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="truncate">{profileName}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/u/$userId" params={{ userId: currentUser.npub ?? currentUser.pubkey }}>
                    <UserRound className="size-4" />
                    Perfil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/configuration">
                    <Settings2 className="size-4" />
                    Configurações
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="size-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
      </div>
      {mobileSearchOpen ? (
        <div className="relative mt-3 sm:hidden">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input autoFocus className="h-10 rounded-2xl border-border/70 bg-card/80 pl-9 shadow-none" placeholder="Buscar vídeos, criadores ou tags" onKeyDown={handleSearch} />
        </div>
      ) : null}
    </header>
  )
}
