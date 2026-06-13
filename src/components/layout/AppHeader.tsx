import { useNDKCurrentUser } from '@nostr-dev-kit/ndk-hooks'
import { Link, useNavigate } from '@tanstack/react-router'
import { Bell, CircleHelp, Menu, Search, Settings2, ShieldCheck } from 'lucide-react'
import type { KeyboardEvent } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { AppSidebar, type SidebarKey } from '@/components/layout/AppSidebar'

export interface AppHeaderProps {
  activeKey?: SidebarKey
}

export function AppHeader({ activeKey }: AppHeaderProps) {
  const navigate = useNavigate()
  const currentUser = useNDKCurrentUser()

  const handleSearch = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return
    const query = event.currentTarget.value.trim()
    if (!query) return
    navigate({ to: '/search', search: { search: query } as never })
  }

  return (
    <header className="sticky top-16 z-30 border-b border-border/70 bg-background/75 px-4 py-3 backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
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

        <div className="relative hidden max-w-xl flex-1 sm:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="h-10 rounded-2xl bg-card/70 pl-9" placeholder="Buscar vídeos, criadores ou tags" onKeyDown={handleSearch} />
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Link to="/faq" className={buttonVariants({ variant: 'glass', size: 'sm' })}>
            <CircleHelp className="size-4" />
            FAQ
          </Link>
          <Link to="/terms" className={buttonVariants({ variant: 'glass', size: 'sm' })}>
            <ShieldCheck className="size-4" />
            Termos
          </Link>
          <Link to="/new" className={buttonVariants({ variant: 'gradient', size: 'sm' })}>
            Enviar vídeo
          </Link>
          <Button variant="glass" size="icon">
            <Bell className="size-4" />
            <span className="sr-only">Notificações</span>
          </Button>
          <Link to="/configuration" className={buttonVariants({ variant: 'glass', size: 'icon' })}>
            <Settings2 className="size-4" />
            <span className="sr-only">Configurações</span>
          </Link>
          {currentUser ? (
            <Link to="/u/$userId" params={{ userId: currentUser.npub ?? currentUser.pubkey }} className="rounded-full border border-border/70 bg-card/70 p-1 transition-colors hover:border-primary/40">
              <Avatar className="size-8">
                <AvatarImage src={currentUser.profile?.image || currentUser.profile?.picture} />
                <AvatarFallback>{(currentUser.profile?.name || 'U').slice(0, 1).toUpperCase()}</AvatarFallback>
              </Avatar>
            </Link>
          ) : null}
        </div>
      </div>
    </header>
  )
}
