import { AlertTriangle, CheckCircle2, Dot, Radio, WifiOff } from 'lucide-react'
import type { ComponentProps } from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export type StatusBadgeTone = 'healthy' | 'partial' | 'warning' | 'danger' | 'neutral' | 'live'

const toneMap: Record<StatusBadgeTone, { variant: ComponentProps<typeof Badge>['variant']; icon: typeof Dot }> = {
  healthy: { variant: 'success', icon: CheckCircle2 },
  partial: { variant: 'relay', icon: Dot },
  warning: { variant: 'warning', icon: AlertTriangle },
  danger: { variant: 'dangerSoft', icon: WifiOff },
  neutral: { variant: 'glass', icon: Dot },
  live: { variant: 'relay', icon: Radio },
}

export interface StatusBadgeProps extends Omit<ComponentProps<typeof Badge>, 'variant'> {
  tone?: StatusBadgeTone
}

export function StatusBadge({ tone = 'neutral', className, children, ...props }: StatusBadgeProps) {
  const { variant, icon: Icon } = toneMap[tone]

  return (
    <Badge variant={variant} className={cn('gap-1.5', className)} {...props}>
      <Icon className="size-3.5" />
      {children}
    </Badge>
  )
}
