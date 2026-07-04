import { t } from 'i18next'
import { AlertCircle, CircleDotDashed, ImagePlus, UploadCloud } from 'lucide-react'
import { type ReactNode, useCallback } from 'react'
import { type Accept, useDropzone } from 'react-dropzone'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card.tsx'
import { Progress } from '@/components/ui/progress.tsx'
import { cn } from '@/helper/format.ts'
import { useBlossomUpload } from '@/hooks/useBlossomUpload.ts'
import { AddTagButton } from '@/routes/new/@components/BoxAddToModal.tsx'

interface ButtonUploadThumbProps {
  children?: ReactNode
  setUrl: (url?: string) => void
  url?: string
  accept: Accept
}

export function ButtonUploadThumb({ children, url, setUrl, accept }: ButtonUploadThumbProps) {
  // 1. Integração com o Hook de Lógica
  const { uploadFile, isUploading, progress, error } = useBlossomUpload({
    onSuccess: (uploadedUrl) => setUrl(uploadedUrl),
    onError: () => setUrl(undefined), // Limpa se falhar
  })

  // 2. Manipulação do Dropzone
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        uploadFile(acceptedFiles[0])
      }
    },
    [uploadFile],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    multiple: false,
    disabled: isUploading,
    onDropRejected: () => toast.error(t('invalid_file_type', 'Invalid file type')),
  })

  // 3. Renderização: Estado de Upload (Loading)
  if (isUploading) {
    return (
      <Card className="relative flex min-h-[150px] w-full flex-col items-center justify-center overflow-hidden rounded-lg p-6">
        <CardContent className="flex flex-col items-center justify-center p-0 text-center w-full">
          <CircleDotDashed className="h-8 w-8 text-primary animate-spin mb-3" />
          <p className="text-sm font-medium mb-2">
            {t('uploading', 'Uploading')}... {progress}%
          </p>
          <p className="mb-3 text-xs text-muted-foreground">
            {t('thumbnail_upload_hint', 'Keep this tab open while we send the image to Blossom.')}
          </p>
          <Progress value={progress} className="w-[80%] h-2" />
        </CardContent>
      </Card>
    )
  }

  // 4. Renderização: Estado com Imagem Já Carregada (Preview)
  if (url) {
    return (
      <div className="relative group w-full overflow-hidden rounded-xl border bg-muted">
        <img src={url} alt="Thumbnail preview" className="w-full h-auto object-cover max-h-[300px]" />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent px-4 py-4 text-white">
          <p className="text-sm font-medium">{t('thumbnail_ready', 'Thumbnail ready')}</p>
          <p className="text-xs text-white/80">
            {t('thumbnail_ready_hint', 'You can keep it or replace it with another cover.')}
          </p>
        </div>
        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
          <div {...getRootProps()}>
            <input {...getInputProps()} />
            <button
              type="button"
              className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-foreground shadow-sm"
            >
              <ImagePlus className="h-4 w-4" />
              {t('replace', 'Replace')}
            </button>
          </div>
          <button
            type="button"
            onClick={() => setUrl(undefined)}
            className="cursor-pointer rounded-lg bg-destructive px-3 py-1.5 text-sm text-white hover:bg-destructive/90"
          >
            {t('remove', 'Remove')}
          </button>
        </div>
      </div>
    )
  }

  // 5. Renderização: Estado Inicial (Dropzone + URL Input)
  return (
    <div className="flex flex-col gap-3">
      <div
        {...getRootProps()}
        className={cn(
          'cursor-pointer flex flex-col items-center justify-center rounded-lg border border-dashed p-6 text-center transition-colors',
          isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:bg-muted/50',
          error && 'border-destructive/50 bg-destructive/5',
          !children && 'min-h-[120px]',
        )}
      >
        <input {...getInputProps()} />

        {children ? (
          children
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <UploadCloud className="h-8 w-8" />
            <p className="text-sm font-medium">
              {isDragActive ? t('drop_here', 'Drop file here') : t('drag_drop_click', 'Click or drag file here')}
            </p>
            <p className="max-w-xs text-xs text-muted-foreground/80">
              {t('thumbnail_dropzone_hint', 'Use a clear landscape image so the video card stays readable in feeds.')}
            </p>
          </div>
        )}
      </div>

      {error ? (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{error}</p>
        </div>
      ) : null}

      <div className="flex items-center gap-2">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground font-medium uppercase">{t('or', 'OR')}</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <div className="flex justify-center">
        <AddTagButton
          onAdd={setUrl}
          label="URL"
          placeholder="https://example.com/image.jpg"
          regex={/^https?:\/\/.+/i}
        />
      </div>
    </div>
  )
}
