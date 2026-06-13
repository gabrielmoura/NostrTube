import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { AppHeader } from '@/components/layout/AppHeader'
import { AppSidebar, type SidebarKey } from '@/components/layout/AppSidebar'
import { PageHeader } from '@/components/ui/page-header'
import { cn } from '@/lib/utils'

export interface AppShellProps {
  activeKey?: SidebarKey
  /** Se omitido, o PageHeader não é renderizado (útil para home com hero) */
  title?: string
  description?: string
  icon?: LucideIcon
  eyebrow?: string
  badge?: string
  actions?: ReactNode
  aside?: ReactNode
  children: ReactNode
  className?: string
}

export function AppShell({
  activeKey,
  title,
  description,
  icon,
  eyebrow,
  badge,
  actions,
  aside,
  children,
  className,
}: AppShellProps) {
  return (
    <div className="min-h-[calc(100svh-var(--header-height))] bg-transparent">
      <div className="mx-auto grid max-w-[1680px] lg:grid-cols-[248px_minmax(0,1fr)]">
        <div className="hidden lg:block">
          <AppSidebar activeKey={activeKey} className="sticky top-16 h-[calc(100svh-var(--header-height))]" />
        </div>
        <div className="min-w-0">
          <AppHeader activeKey={activeKey} />
          <main className={cn('px-4 py-6 sm:px-6 lg:px-8', className)}>
            <div className={cn('grid gap-6', aside ? 'xl:grid-cols-[minmax(0,1fr)_320px]' : '')}>
              <div className="space-y-6">
                {title ? (
                  <PageHeader title={title} description={description} icon={icon} eyebrow={eyebrow} badge={badge} actions={actions} />
                ) : null}
                {children}
              </div>
              {aside ? <aside className="space-y-4 xl:sticky xl:top-36 xl:h-fit">{aside}</aside> : null}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
