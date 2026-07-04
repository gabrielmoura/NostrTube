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
    <div className="min-h-svh bg-background">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_18%_0%,color-mix(in_oklab,var(--primary)_16%,transparent),transparent_32%),radial-gradient(circle_at_86%_12%,color-mix(in_oklab,var(--accent)_12%,transparent),transparent_28%)]" />
      <div className="mx-auto grid min-h-svh max-w-[1760px] lg:grid-cols-[248px_minmax(0,1fr)]">
        <div className="hidden border-r border-sidebar-border/80 bg-sidebar/70 lg:block">
          <AppSidebar activeKey={activeKey} className="sticky top-0 h-svh border-r-0" />
        </div>
        <div className="min-w-0 bg-background/55">
          <AppHeader activeKey={activeKey} />
          <main className={cn('px-4 py-5 sm:px-6 lg:px-8 lg:py-7', className)}>
            <div className={cn('grid gap-6', aside ? '2xl:grid-cols-[minmax(0,1fr)_336px]' : '')}>
              <div className="space-y-6">
                {title ? (
                  <PageHeader
                    title={title}
                    description={description}
                    icon={icon}
                    eyebrow={eyebrow}
                    badge={badge}
                    actions={actions}
                  />
                ) : null}
                {children}
              </div>
              {aside ? <aside className="space-y-4 2xl:sticky 2xl:top-24 2xl:h-fit">{aside}</aside> : null}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
