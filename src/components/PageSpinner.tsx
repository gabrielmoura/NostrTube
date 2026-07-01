import { Loader2, Radio } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface PageSpinnerProps {
  show?: boolean
  label?: string
  description?: string
  variant?: 'page' | 'inline' | 'overlay'
  className?: string
}

export function PageSpinner({
  show = true,
  label = 'Carregando NostrTube',
  description = 'Sincronizando dados dos relays e preparando a interface.',
  variant = 'page',
  className,
}: PageSpinnerProps) {
  const reduceMotion = useReducedMotion()
  const isOverlay = variant === 'overlay'

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          aria-busy="true"
          aria-live="polite"
          className={cn(
            'flex w-full items-center justify-center px-4 py-10',
            variant === 'page' && 'min-h-[min(520px,70svh)]',
            variant === 'inline' && 'min-h-40 py-6',
            isOverlay && 'fixed inset-0 z-50 min-h-svh bg-background/75 backdrop-blur-xl',
            className,
          )}
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.2 }}
        >
          <motion.div
            role="status"
            className={cn(
              'relative w-full overflow-hidden rounded-3xl border border-border/70 bg-card/85 p-6 text-center shadow-lg shadow-black/5',
              'before:absolute before:inset-x-6 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-primary/45 before:to-transparent',
              variant === 'inline' ? 'max-w-xl' : 'max-w-2xl',
            )}
            initial={reduceMotion ? false : { y: 8, scale: 0.98, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 6, scale: 0.98, opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.18, ease: 'easeOut' }}
          >
            <div className="absolute -right-10 -top-12 size-36 rounded-full bg-primary/10 blur-3xl" />
            <div className="absolute -bottom-16 -left-12 size-40 rounded-full bg-[oklch(var(--lightning))]/15 blur-3xl" />

            <div className="relative mx-auto flex size-16 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
              <Radio className="size-6" aria-hidden="true" />
              <Loader2
                className={cn('absolute size-12 text-[oklch(var(--lightning))]', !reduceMotion && 'animate-spin')}
                aria-hidden="true"
              />
            </div>

            <div className="relative mt-5 space-y-2">
              <p className="font-display text-xl font-semibold tracking-tight text-foreground">{label}</p>
              <p className="mx-auto max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
            </div>

            <div className="relative mt-6 grid gap-2" aria-hidden="true">
              <div className="mx-auto h-2 w-2/3 overflow-hidden rounded-full bg-primary/10">
                <div className={cn('h-full w-1/2 rounded-full bg-primary/35', !reduceMotion && 'animate-pulse')} />
              </div>
              <div className="mx-auto h-2 w-1/2 rounded-full bg-[oklch(var(--lightning))]/15" />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
