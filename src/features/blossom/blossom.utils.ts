import type { BlossomFileKind, BlossomFileRecord, BlossomFileSort, BlossomFileTypeFilter } from './blossom.types'

export const BLOSSOM_MAX_FILE_SIZE_BYTES = 4 * 1024 * 1024 * 1024

export const BLOSSOM_TYPE_LABELS: Record<BlossomFileKind, string> = {
  video: 'Vídeos',
  image: 'Imagens',
  document: 'Documentos',
  json: 'JSON',
  audio: 'Áudio',
  other: 'Outros',
}

export function isValidBlossomUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' || parsed.protocol === 'http:'
  } catch {
    return false
  }
}

export function getFileKind(mimeType: string, fileName = ''): BlossomFileKind {
  const lowerName = fileName.toLowerCase()
  if (mimeType.startsWith('video/')) return 'video'
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('audio/')) return 'audio'
  if (mimeType === 'application/json' || lowerName.endsWith('.json')) return 'json'
  if (mimeType.includes('pdf') || mimeType.includes('document') || /\.(pdf|docx?|txt|md)$/i.test(lowerName)) {
    return 'document'
  }
  return 'other'
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`
}

export function formatRelativeDate(timestamp: number): string {
  const diffMs = Date.now() - timestamp
  const minutes = Math.floor(diffMs / 60_000)
  if (minutes < 1) return 'agora'
  if (minutes < 60) return `${minutes} min atrás`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} h atrás`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} d atrás`
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(timestamp)
}

export function getFileExtension(file: BlossomFileRecord): string {
  const extension = file.name.split('.').pop()
  if (extension && extension !== file.name) return extension.toUpperCase()
  return file.mimeType.split('/').pop()?.toUpperCase() || BLOSSOM_TYPE_LABELS[file.type].toUpperCase()
}

export function filterAndSortBlossomFiles(
  files: BlossomFileRecord[],
  search: string,
  typeFilter: BlossomFileTypeFilter,
  sort: BlossomFileSort,
): BlossomFileRecord[] {
  const normalizedSearch = search.trim().toLowerCase()
  return files
    .filter((file) => {
      const matchesType = typeFilter === 'all' || file.type === typeFilter
      const matchesSearch =
        !normalizedSearch ||
        file.name.toLowerCase().includes(normalizedSearch) ||
        file.pathLabel?.toLowerCase().includes(normalizedSearch) ||
        file.blossomServerUrl.toLowerCase().includes(normalizedSearch)
      return matchesType && matchesSearch
    })
    .sort((first, second) => {
      if (sort === 'oldest') return first.createdAt - second.createdAt
      if (sort === 'largest') return second.size - first.size
      if (sort === 'smallest') return first.size - second.size
      if (sort === 'name') return first.name.localeCompare(second.name)
      return second.createdAt - first.createdAt
    })
}

export async function calculateSha256(file: File): Promise<string | undefined> {
  if (!globalThis.crypto?.subtle) return undefined
  const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer())
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}
