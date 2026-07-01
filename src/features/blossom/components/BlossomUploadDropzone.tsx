import { CheckCircle2, UploadCloud, XCircle } from 'lucide-react'
import { type DragEvent, type KeyboardEvent, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import type { BlossomUploadStatus } from '../blossom.types'

interface BlossomUploadDropzoneProps {
  status: BlossomUploadStatus
  isUploading: boolean
  progress?: number
  error?: string | null
  disabled?: boolean
  onFilesSelected: (files: File[]) => void
}

export function BlossomUploadDropzone({
  status,
  isUploading,
  progress = 0,
  error,
  disabled,
  onFilesSelected,
}: BlossomUploadDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const isActive = isDragging || status === 'drag-active'

  const openPicker = () => {
    if (!disabled && !isUploading) inputRef.current?.click()
  }
  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(false)
    if (disabled || isUploading) return
    onFilesSelected(Array.from(event.dataTransfer.files))
  }
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      openPicker()
    }
  }

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label="Selecionar arquivos para upload no Blossom"
      aria-disabled={disabled || isUploading}
      onClick={openPicker}
      onKeyDown={handleKeyDown}
      onDragOver={(event) => {
        event.preventDefault()
        setIsDragging(true)
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={cn(
        'group flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed p-6 text-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70',
        isActive
          ? 'border-primary bg-primary/12 shadow-[0_0_0_1px_color-mix(in_oklab,var(--primary)_30%,transparent)]'
          : 'border-primary/45 bg-card/55 hover:bg-primary/8',
        (disabled || isUploading) && 'cursor-not-allowed opacity-70',
      )}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        className="sr-only"
        onChange={(event) => onFilesSelected(Array.from(event.target.files ?? []))}
        disabled={disabled || isUploading}
      />
      <div className="rounded-3xl border border-primary/25 bg-primary/10 p-4 text-primary">
        {status === 'success' ? (
          <CheckCircle2 className="size-8" />
        ) : status === 'error' ? (
          <XCircle className="size-8" />
        ) : (
          <UploadCloud className="size-8" />
        )}
      </div>
      <h3 className="mt-4 text-lg font-semibold text-foreground">Arraste e solte arquivos aqui</h3>
      <p className="mt-1 text-sm text-muted-foreground">ou clique para selecionar</p>
      <p className="mt-3 text-xs text-muted-foreground">Até 4GB por arquivo • Qualquer tipo</p>
      {isUploading ? (
        <div className="mt-5 w-full max-w-sm space-y-2">
          <Progress value={progress} />
          <p className="text-xs text-muted-foreground">{progress}% enviado</p>
        </div>
      ) : null}
      {error ? <p className="mt-4 max-w-md text-sm text-destructive">{error}</p> : null}
      {disabled ? (
        <Button type="button" variant="glass" className="mt-5" disabled>
          Configure ou entre na sessão Nostr
        </Button>
      ) : null}
    </div>
  )
}
