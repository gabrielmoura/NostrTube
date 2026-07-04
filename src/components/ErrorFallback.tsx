import { AlertTriangle, Home, type LucideIcon, RefreshCw, RotateCcw } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

function isChunkLoadError(error: Error | string | null): boolean {
  if (!error) return false
  const msg = typeof error === 'string' ? error : error.message
  return (
    msg.includes('Failed to fetch dynamically imported module') ||
    msg.includes('dynamically imported module') ||
    msg.includes('Loading chunk') ||
    msg.includes('ChunkLoadError') ||
    msg.includes('import()')
  )
}

interface ErrorFallbackProps {
  variant?: 'card' | 'page'
  icon?: LucideIcon
  title: string
  description?: string
  error?: Error | string | null
  retryLabel?: string
  onRetry?: () => void
  homeLabel?: string
  onGoHome?: () => void
  children?: ReactNode
}

export function ErrorFallback({
  variant = 'card',
  icon: Icon = AlertTriangle,
  title,
  description,
  error,
  retryLabel = 'Tentar novamente',
  onRetry,
  homeLabel = 'Voltar ao início',
  onGoHome,
  children,
}: ErrorFallbackProps) {
  const errorMessage = error instanceof Error ? error.message : (error ?? undefined)
  const isChunkError = isChunkLoadError(error ?? null)
  const finalDescription =
    description ??
    (isChunkError
      ? 'Parece que houve um problema ao carregar um módulo da aplicação. Pode ser um problema de conexão ou o app foi atualizado.'
      : undefined)

  const content = (
    <div
      role="alert"
      className={cn(
        'animate-in fade-in zoom-in-95 duration-300',
        variant === 'page'
          ? 'w-full max-w-lg'
          : 'overflow-hidden rounded-2xl border border-border/60 bg-card/95 shadow-sm',
      )}
    >
      {variant === 'card' && (
        <>
          <div className="border-b border-border/60 bg-muted/40 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 space-y-1">
                <h1 className="text-lg font-semibold text-foreground">{title}</h1>
                {finalDescription && <p className="text-sm text-muted-foreground">{finalDescription}</p>}
              </div>
            </div>
          </div>

          <div className="space-y-5 px-6 py-5">
            {(onRetry || onGoHome || isChunkError) && (
              <div className="flex flex-wrap items-center gap-3">
                {isChunkError && (
                  <Button onClick={() => window.location.reload()} className="cursor-pointer">
                    <RotateCcw className="h-4 w-4" />
                    Recarregar página
                  </Button>
                )}
                {onRetry && (
                  <Button onClick={onRetry} variant={isChunkError ? 'outline' : 'default'} className="cursor-pointer">
                    <RefreshCw className="h-4 w-4" />
                    {retryLabel}
                  </Button>
                )}
                {onGoHome && (
                  <Button variant="outline" onClick={onGoHome} className="cursor-pointer">
                    <Home className="h-4 w-4" />
                    {homeLabel}
                  </Button>
                )}
              </div>
            )}

            {children}
          </div>

          {errorMessage && (
            <details className="mx-6 mb-6 rounded-xl border border-border/60 bg-muted/30 p-4 text-left">
              <summary className="cursor-pointer text-sm font-medium text-foreground hover:text-primary">
                Detalhes técnicos
              </summary>
              <pre className="mt-3 overflow-auto whitespace-pre-wrap break-all rounded-lg bg-background p-3 text-xs text-muted-foreground">
                {errorMessage}
              </pre>
            </details>
          )}
        </>
      )}

      {variant === 'page' && (
        <div className="flex flex-col items-center justify-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
            <Icon className="h-8 w-8" />
          </div>
          <h1 className="mt-6 text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
          {finalDescription && <p className="mt-2 text-sm text-muted-foreground">{finalDescription}</p>}
          {(onRetry || onGoHome || isChunkError) && (
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              {isChunkError && (
                <Button onClick={() => window.location.reload()} className="cursor-pointer">
                  <RotateCcw className="h-4 w-4" />
                  Recarregar página
                </Button>
              )}
              {onRetry && (
                <Button onClick={onRetry} variant={isChunkError ? 'outline' : 'default'} className="cursor-pointer">
                  <RefreshCw className="h-4 w-4" />
                  {retryLabel}
                </Button>
              )}
              {onGoHome && (
                <Button variant="outline" onClick={onGoHome} className="cursor-pointer">
                  <Home className="h-4 w-4" />
                  {homeLabel}
                </Button>
              )}
            </div>
          )}
          {children && <div className="mt-6">{children}</div>}
          {errorMessage && (
            <details className="mt-6 w-full max-w-lg rounded-xl border border-border/60 bg-muted/30 p-4 text-left">
              <summary className="cursor-pointer text-sm font-medium text-foreground hover:text-primary">
                Detalhes técnicos
              </summary>
              <pre className="mt-3 overflow-auto whitespace-pre-wrap break-all rounded-lg bg-background p-3 text-xs text-muted-foreground">
                {errorMessage}
              </pre>
            </details>
          )}
        </div>
      )}
    </div>
  )

  if (variant === 'page') {
    return <div className="flex min-h-[70vh] items-center justify-center px-4 py-16">{content}</div>
  }

  return content
}
