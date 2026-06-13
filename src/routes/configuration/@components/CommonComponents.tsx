import type React from 'react'
import { Button as UIButton } from '@/components/ui/button'
import { Badge as UIBadge } from '@/components/ui/badge'
import { Card as UICard, CardContent as UICardContent, CardHeader as UICardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Switch as UISwitch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'

export const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <UICard className={cn('overflow-hidden py-0', className)}>{children}</UICard>
)

export const CardHeader = ({ title, description, icon: Icon }: { title: string; description?: string; icon?: React.ElementType }) => (
  <UICardHeader className="gap-1 border-b border-border/70 bg-secondary/35 px-4 py-4">
    <div className="flex items-center gap-2">
      {Icon ? <Icon className="size-5 text-primary" /> : null}
      <CardTitle className="text-base">{title}</CardTitle>
    </div>
    {description ? <CardDescription className="ml-7 text-sm">{description}</CardDescription> : null}
  </UICardHeader>
)

export const CardContent = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <UICardContent className={cn('px-4 py-4', className)}>{children}</UICardContent>
)

export const Badge = ({ children, variant = 'default', className = '' }: {
  children: React.ReactNode
  variant?: 'default' | 'outline' | 'success' | 'warning' | 'destructive'
  className?: string
}) => {
  const mappedVariant = variant === 'destructive' ? 'dangerSoft' : variant
  return (
    <UIBadge variant={mappedVariant as 'default' | 'outline' | 'success' | 'warning' | 'dangerSoft'} className={className}>
      {children}
    </UIBadge>
  )
}

export const Button = ({ children, onClick, variant = 'primary', size = 'md', disabled = false, className = '', ...props }: any) => {
  const variantMap = {
    primary: 'default',
    secondary: 'secondary',
    ghost: 'ghost',
    outline: 'outline',
  } as const
  const sizeMap = {
    sm: 'sm',
    md: 'default',
    icon: 'icon',
  } as const

  return (
    <UIButton
      onClick={onClick}
      disabled={disabled}
      variant={variantMap[variant as keyof typeof variantMap] ?? 'default'}
      size={sizeMap[size as keyof typeof sizeMap] ?? 'default'}
      className={className}
      {...props}
    >
      {children}
    </UIButton>
  )
}

export const Switch = ({ checked, onCheckedChange, disabled = false }: { checked: boolean; onCheckedChange: (c: boolean) => void; disabled?: boolean }) => (
  <UISwitch checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
)
