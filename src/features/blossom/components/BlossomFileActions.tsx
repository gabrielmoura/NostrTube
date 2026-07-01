import {
  Copy,
  Download,
  ExternalLink,
  FileCode2,
  FileText,
  Film,
  ImageIcon,
  MoreHorizontal,
  Music,
  Search,
  Trash2,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import type { BlossomFileKind, BlossomFileRecord } from '../blossom.types'
import { getFileExtension } from '../blossom.utils'

const kindIcons = {
  video: Film,
  image: ImageIcon,
  document: FileText,
  json: FileCode2,
  audio: Music,
  other: FileText,
}

export function getBlossomFileIcon(type: BlossomFileKind) {
  return kindIcons[type]
}

export function BlossomFileTypeBadge({ file }: { file: BlossomFileRecord }) {
  return (
    <Badge
      variant={
        file.type === 'video' ? 'relay' : file.type === 'image' ? 'success' : file.type === 'json' ? 'zap' : 'glass'
      }
    >
      {getFileExtension(file)}
    </Badge>
  )
}

export function BlossomFileActions({
  file,
  onCopyUrl,
  onCopyHash,
  onViewDetails,
  onRemoveLocal,
}: {
  file: BlossomFileRecord
  onCopyUrl: () => void
  onCopyHash: () => void
  onViewDetails: () => void
  onRemoveLocal: () => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={`Ações para ${file.name}`}>
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={onViewDetails}>
          <Search className="size-4" />
          Ver conteúdo
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onCopyUrl}>
          <Copy className="size-4" />
          Copiar URL
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => window.open(file.url, '_blank', 'noopener,noreferrer')}>
          <ExternalLink className="size-4" />
          Abrir arquivo
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => downloadFile(file)}>
          <Download className="size-4" />
          Baixar
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onCopyHash} disabled={!file.hash}>
          <Copy className="size-4" />
          Copiar hash
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onRemoveLocal} className="text-destructive focus:text-destructive">
          <Trash2 className="size-4" />
          Remover da lista local
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function downloadFile(file: BlossomFileRecord) {
  const link = document.createElement('a')
  link.href = file.url
  link.download = file.name
  link.rel = 'noreferrer'
  document.body.appendChild(link)
  link.click()
  link.remove()
}
