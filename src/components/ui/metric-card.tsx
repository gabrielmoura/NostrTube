import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { TrendingUp } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export interface MetricCardProps {
  title: string
  /** Aceita string ou ReactNode (ex: <span title="...">—</span> para tooltips) */
  value: ReactNode
  description?: string
  icon?: LucideIcon
  tone?: 'default' | 'relay' | 'zap' | 'success'
  className?: string
}

const toneClassMap: Record<NonNullable<MetricCardProps['tone']>, string> = {
  default: 'from-primary/12 via-primary/5 to-transparent text-primary',
  relay: 'from-cyan-500/14 via-cyan-500/6 to-transparent text-cyan-400',
  zap: 'from-amber-500/16 via-amber-500/6 to-transparent text-amber-400',
  success: 'from-emerald-500/16 via-emerald-500/6 to-transparent text-emerald-400',
}

export function MetricCard({
  title,
  value,
  description,
  icon: Icon = TrendingUp,
  tone = 'default',
  className,
}: MetricCardProps) {
  return (
    <Card className={cn('gap-0 overflow-hidden py-0', className)}>
      <CardContent className="relative p-5">
        <div className={cn('absolute inset-x-0 top-0 h-24 bg-gradient-to-br opacity-100', toneClassMap[tone])} />
        <div className="relative flex items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">{title}</p>
            <p className="font-display text-3xl font-semibold tracking-tight text-foreground">{value}</p>
            {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
          </div>
          <div className="rounded-2xl border border-border/70 bg-card/75 p-2.5 text-foreground/80 backdrop-blur">
            <Icon className="size-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
