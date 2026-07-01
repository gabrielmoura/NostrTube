import { ExternalLink } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { BlossomFileRecord } from '../blossom.types'
import { formatBytes, formatRelativeDate } from '../blossom.utils'

interface BlossomFileDetailsDialogProps {
  file: BlossomFileRecord | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function BlossomFileDetailsDialog({ file, open, onOpenChange }: BlossomFileDetailsDialogProps) {
  if (!file) return null
  const nip94 = file.metadata?.nip94
  const nip94Rows = Array.isArray(nip94) ? nip94.filter((row): row is string[] => Array.isArray(row)) : []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[86svh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="pr-8">{file.name}</DialogTitle>
          <DialogDescription>
            Metadados do arquivo Blossom, incluindo tags NIP-94 quando retornadas via BUD-08.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_260px]">
          <div className="overflow-hidden rounded-2xl border border-border/70 bg-secondary/30">
            <BlossomFilePreview file={file} />
          </div>
          <div className="space-y-3 text-sm">
            <DetailRow label="Tipo" value={file.mimeType} />
            <DetailRow label="Tamanho" value={formatBytes(file.size)} />
            <DetailRow label="Criado" value={formatRelativeDate(file.createdAt)} />
            <DetailRow label="Servidor" value={file.blossomServerUrl} mono />
            <DetailRow label="SHA-256" value={file.hash ?? 'Indisponível'} mono />
            <Button
              type="button"
              variant="glass"
              size="sm"
              className="w-full"
              onClick={() => window.open(file.url, '_blank', 'noopener,noreferrer')}
            >
              <ExternalLink className="size-4" />
              Abrir arquivo
            </Button>
          </div>
        </div>

        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">NIP-94 / BUD-08</h3>
            <Badge variant={nip94Rows.length > 0 ? 'success' : 'glass'}>
              {nip94Rows.length > 0 ? `${nip94Rows.length} tags` : 'sem nip94'}
            </Badge>
          </div>
          {nip94Rows.length > 0 ? (
            <div className="overflow-hidden rounded-2xl border border-border/70">
              {nip94Rows.map((row, index) => (
                <div
                  key={`${row[0]}-${index}`}
                  className="grid gap-2 border-b border-border/50 p-3 text-sm last:border-b-0 sm:grid-cols-[120px_minmax(0,1fr)]"
                >
                  <span className="font-mono text-xs text-muted-foreground">{row[0]}</span>
                  <span className="break-all font-mono text-xs text-foreground">{row.slice(1).join('  ')}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-2xl border border-border/70 bg-card/45 p-4 text-sm text-muted-foreground">
              O servidor retornou apenas o Blob Descriptor BUD-02. Tags NIP-94 são opcionais em BUD-08.
            </p>
          )}
        </section>
      </DialogContent>
    </Dialog>
  )
}

function BlossomFilePreview({ file }: { file: BlossomFileRecord }) {
  if (file.type === 'image') {
    return (
      <img
        src={file.thumbnailUrl || file.url}
        alt={file.metadata?.alt?.toString() || file.name}
        className="max-h-[420px] w-full object-contain"
      />
    )
  }
  if (file.type === 'video') {
    return <video src={file.url} controls className="max-h-[420px] w-full bg-black" />
  }
  if (file.type === 'audio') {
    return (
      <div className="flex min-h-48 items-center p-6">
        <audio src={file.url} controls className="w-full" />
      </div>
    )
  }
  return (
    <div className="flex min-h-48 items-center justify-center p-8 text-center text-sm text-muted-foreground">
      Pré-visualização não disponível para este tipo. Abra o arquivo para inspecionar o conteúdo.
    </div>
  )
}

function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={mono ? 'break-all font-mono text-xs text-foreground' : 'break-words text-foreground'}>{value}</p>
    </div>
  )
}
