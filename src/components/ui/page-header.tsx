import type { LucideIcon } from 'lucide-react'
import { ChevronRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { StatusBadge } from '@/components/ui/status-badge'
import { cn } from '@/lib/utils'

export interface PageHeaderProps {
  title: string
  description?: string
  icon?: LucideIcon
  eyebrow?: string
  badge?: string
  actions?: ReactNode
  className?: string
}

export function PageHeader({ title, description, icon: Icon, eyebrow, badge, actions, className }: PageHeaderProps) {
  return (
    <div className={cn('flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between', className)}>
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
          {eyebrow ? <span>{eyebrow}</span> : null}
          {eyebrow && badge ? <ChevronRight className="size-3" /> : null}
          {badge ? <StatusBadge tone="partial">{badge}</StatusBadge> : null}
        </div>
        <div className="flex items-start gap-4">
          {Icon ? (
            <div className="hidden rounded-2xl border border-primary/20 bg-primary/10 p-3 text-primary sm:flex">
              <Icon className="size-6" />
            </div>
          ) : null}
          <div className="space-y-2">
            <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{title}</h1>
            {description ? (
              <p className="max-w-3xl text-balance text-sm text-muted-foreground sm:text-base">{description}</p>
            ) : null}
          </div>
        </div>
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
    </div>
  )
}
