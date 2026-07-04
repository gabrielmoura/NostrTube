import { Link, useRouter } from '@tanstack/react-router'
import { ArrowLeft, Compass, Home, Radio, Search, Sparkles, TrendingUp, Zap } from 'lucide-react'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { buttonVariants } from '@/components/ui/button'
import { addLog } from '@/features/debug/services/error-log.service'
import { cn } from '@/lib/utils'

export function GlobalNotFound() {
  const { t } = useTranslation('pages')
  const router = useRouter()
  const path = window.location.pathname

  // Log 404 hit to the debug-error-logs IndexedDB
  useEffect(() => {
    addLog({
      timestamp: new Date().toISOString(),
      level: 'warn',
      message: `404 Not Found: "${path}"`,
      context: JSON.stringify({
        source: 'GlobalNotFound',
        path,
        referrer: document.referrer || null,
      }),
    })
  }, [path])

  const quickLinks = [
    {
      to: '/search' as const,
      icon: Search,
      label: t('notFound_search_label'),
      description: t('notFound_search_description'),
    },
    {
      to: '/trending' as const,
      icon: TrendingUp,
      label: t('notFound_trending_label'),
      description: t('notFound_trending_description'),
    },
    {
      to: '/explore' as const,
      icon: Compass,
      label: t('notFound_explore_label'),
      description: t('notFound_explore_description'),
    },
    {
      to: '/live' as const,
      icon: Radio,
      label: t('notFound_live_label'),
      description: t('notFound_live_description'),
    },
  ]

  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden bg-background px-4 py-12">
      {/* ─── Ambient glows ─── */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-[10%] top-[8%] size-[560px] rounded-full bg-primary/8 blur-[140px]" />
        <div className="absolute bottom-[5%] right-[8%] size-[420px] rounded-full bg-accent/7 blur-[120px]" />
        <div className="absolute bottom-[30%] left-[40%] size-[280px] rounded-full bg-[oklch(var(--lightning))]/5 blur-[90px]" />
        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: `linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)`,
            backgroundSize: '48px 48px',
          }}
        />
      </div>

      <div className="flex w-full max-w-2xl flex-col items-center gap-14 text-center">
        {/* ─── Hero block ─── */}
        <div className="flex flex-col items-center">
          {/* Giant 404 */}
          <div className="relative select-none">
            <div aria-hidden className="absolute inset-0 -z-10 scale-110 rounded-full bg-primary/12 blur-[72px]" />
            <span
              aria-hidden
              className="font-display block bg-gradient-to-b from-foreground/90 via-foreground/25 to-foreground/0 bg-clip-text text-[clamp(7rem,22vw,15rem)] font-black leading-none tracking-tighter text-transparent"
            >
              404
            </span>
          </div>

          {/* Kicker badge */}
          <div className="mt-1 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/8 px-4 py-1.5 backdrop-blur-sm">
            <Sparkles className="size-3.5 text-primary" />
            <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
              {t('notFound_badge')}
            </span>
          </div>

          {/* Headline */}
          <h1 className="font-display mt-6 max-w-[560px] text-balance text-2xl font-bold leading-tight tracking-tight text-foreground sm:text-3xl md:text-4xl">
            {/* Split headline so we can gradient the second half */}
            {t('notFound_headline').split('Nostr').at(0)}
            <span className="bg-gradient-to-r from-primary via-accent to-[oklch(var(--lightning))] bg-clip-text text-transparent">
              Nostr
            </span>
            {t('notFound_headline').split('Nostr').at(1)}
          </h1>

          <p className="mt-4 max-w-[440px] text-balance text-sm leading-relaxed text-muted-foreground sm:text-base">
            {t('notFound_description')}
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link to="/" className={cn(buttonVariants({ variant: 'gradient', size: 'lg' }))}>
              <Home className="size-4" />
              {t('notFound_goHome')}
            </Link>
            <button
              type="button"
              onClick={() => router.history.back()}
              className={cn(buttonVariants({ variant: 'glass', size: 'lg' }))}
            >
              <ArrowLeft className="size-4" />
              {t('notFound_goBack')}
            </button>
          </div>
        </div>

        {/* ─── Quick-nav grid ─── */}
        <div className="w-full">
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground/70">
            {t('notFound_quicklinks_title')}
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {quickLinks.map(({ to, icon: Icon, label, description }) => (
              <Link
                key={to}
                to={to}
                className="group flex flex-col items-center gap-3 rounded-2xl border border-border/60 bg-card/50 p-4 text-center backdrop-blur-sm transition-all duration-200 hover:border-primary/40 hover:bg-card/80 hover:shadow-[0_0_28px_color-mix(in_oklab,var(--primary)_12%,transparent)]"
              >
                <div className="flex size-10 items-center justify-center rounded-xl border border-border/60 bg-background/60 text-muted-foreground transition-colors group-hover:border-primary/30 group-hover:text-primary">
                  <Icon className="size-[18px]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{label}</p>
                  <p className="mt-0.5 text-[11px] leading-tight text-muted-foreground">{description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* ─── Bottom tip ─── */}
        <p className="flex flex-wrap items-center justify-center gap-1.5 text-xs text-muted-foreground/60">
          <Zap className="size-3.5 shrink-0 text-[oklch(var(--lightning))]/60" />
          {t('notFound_tip', {
            link: (
              <Link to="/search" className="underline underline-offset-2 transition-colors hover:text-foreground">
                /search
              </Link>
            ),
          })}
        </p>
      </div>
    </div>
  )
}
