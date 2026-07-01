import { AlertTriangle, CloudOff, FolderOpen, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function BlossomEmptyState() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center gap-4 py-12 text-center">
        <div className="rounded-2xl border border-border/70 bg-secondary/50 p-4 text-primary">
          <FolderOpen className="size-6" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Nenhum arquivo encontrado</h3>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            Envie seu primeiro arquivo ou ajuste os filtros para ver itens armazenados no Blossom.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

export function BlossomErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center gap-4 py-12 text-center">
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-destructive">
          <AlertTriangle className="size-6" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Não foi possível carregar seus arquivos</h3>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">{message}</p>
        </div>
        <Button variant="glass" onClick={onRetry}>
          <RefreshCw className="size-4" />
          Tentar novamente
        </Button>
      </CardContent>
    </Card>
  )
}

export function BlossomConfigurationState({ isLoggedIn, onLogin }: { isLoggedIn: boolean; onLogin: () => void }) {
  return (
    <Card className="border-primary/20 bg-primary/8">
      <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl border border-primary/25 bg-primary/10 p-3 text-primary">
            <CloudOff className="size-5" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">
              {isLoggedIn ? 'Blossom não configurado' : 'Sessão não iniciada'}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {isLoggedIn
                ? 'Configure um servidor padrão para habilitar uploads reais e replicação.'
                : 'Entre com sua identidade Nostr e configure um servidor padrão para uploads reais.'}
            </p>
          </div>
        </div>
        <Button variant="gradient" onClick={onLogin}>
          {isLoggedIn ? 'Abrir configurações' : 'Entrar'}
        </Button>
      </CardContent>
    </Card>
  )
}

export function BlossomSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-[260px] rounded-3xl" />
      <div className="grid gap-4 sm:grid-cols-3">
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl" />
      </div>
      <Skeleton className="h-72 rounded-2xl" />
    </div>
  )
}
