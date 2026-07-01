import { Cloud, Database, FileArchive, Lock, Network, ShieldCheck } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import type { BlossomBenefit } from '../blossom.types'

export function BlossomHeader() {
  return (
    <div className="flex items-start gap-3">
      <div className="rounded-2xl border border-primary/30 bg-primary/12 p-3 text-primary">
        <Cloud className="size-6" />
      </div>
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">Blossom</h1>
        <p className="mt-1 text-sm text-muted-foreground sm:text-base">
          Armazene e gerencie seus arquivos com liberdade e privacidade.
        </p>
      </div>
    </div>
  )
}

const benefits: BlossomBenefit[] = [
  { title: 'Descentralizado', description: 'Distribua arquivos entre servidores independentes.', icon: Network },
  { title: 'Privado', description: 'Uploads assinados pela sua identidade Nostr.', icon: Lock },
  { title: 'Permanente', description: 'Conteúdo endereçado por hash para resistir a perdas.', icon: ShieldCheck },
]

export function BlossomBenefitItem({ benefit }: { benefit: BlossomBenefit }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card/45 p-4">
      <benefit.icon className="mb-3 size-5 text-primary" />
      <h3 className="text-sm font-semibold text-foreground">{benefit.title}</h3>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{benefit.description}</p>
    </div>
  )
}

export function BlossomHero() {
  return (
    <Card className="overflow-hidden border-primary/15 bg-gradient-to-br from-card via-card to-primary/10">
      <CardContent className="grid gap-8 p-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:p-8">
        <div>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <FileArchive className="size-3.5" />
            Painel de armazenamento
          </div>
          <h2 className="font-display max-w-2xl text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
            Armazenamento descentralizado para o{' '}
            <span className="bg-gradient-to-r from-primary via-cyan-300 to-[oklch(var(--lightning))] bg-clip-text text-transparent">
              ecossistema Nostr
            </span>
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
            Blossom permite armazenar arquivos de forma privada, imutável e resistente à censura, usando servidores
            independentes e metadados compatíveis com a rede Nostr.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {benefits.map((benefit) => (
              <BlossomBenefitItem key={benefit.title} benefit={benefit} />
            ))}
          </div>
        </div>
        <div className="relative min-h-[280px] overflow-hidden rounded-3xl border border-border/70 bg-background/35 p-5">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_24%_18%,color-mix(in_oklab,var(--primary)_26%,transparent),transparent_34%),radial-gradient(circle_at_80%_70%,color-mix(in_oklab,var(--accent)_20%,transparent),transparent_32%)]" />
          <div className="relative flex h-full flex-col justify-between">
            <div className="ml-auto w-36 rounded-2xl border border-cyan-300/30 bg-cyan-300/10 p-4 text-cyan-200">
              <Database className="size-8" />
              <p className="mt-3 font-mono text-xs">mirror cluster</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {['MP4', 'JSON', 'WEBP', 'PDF'].map((label) => (
                <div key={label} className="rounded-2xl border border-border/70 bg-card/70 p-4 shadow-xl backdrop-blur">
                  <div className="mb-4 h-2 w-14 rounded-full bg-primary/50" />
                  <p className="font-mono text-lg font-semibold">{label}</p>
                  <p className="text-xs text-muted-foreground">sha256 linked</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
