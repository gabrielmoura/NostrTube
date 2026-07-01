import type { LucideIcon } from 'lucide-react'

export type BlossomFileKind = 'video' | 'image' | 'document' | 'json' | 'audio' | 'other'

export type BlossomFileTypeFilter = BlossomFileKind | 'all'

export type BlossomFileSort = 'newest' | 'oldest' | 'largest' | 'smallest' | 'name'

export type BlossomViewMode = 'table' | 'grid'

export type BlossomUploadStatus = 'idle' | 'drag-active' | 'uploading' | 'success' | 'error'

export interface BlossomFileRecord {
  id: string
  name: string
  type: BlossomFileKind
  mimeType: string
  size: number
  createdAt: number
  url: string
  hash?: string
  blurhash?: string
  thumbnailUrl?: string
  blossomServerUrl: string
  pathLabel?: string
  metadata?: Record<string, unknown>
}

export interface BlossomServerCapabilities {
  uploadRequirements: 'supported' | 'unsupported' | 'unknown'
  mediaOptimization: 'supported' | 'unsupported' | 'unknown'
  reporting: 'supported' | 'unsupported' | 'unknown'
}

export interface BlossomServerStatus {
  url: string
  online: boolean
  listStatus?: 'pending' | 'success' | 'error'
  latencyMs?: number
  isDefault?: boolean
  error?: string
  source?: 'bud03' | 'local' | 'fallback'
  capabilities?: BlossomServerCapabilities
  filesCount?: number
}

export interface BlossomStorageSummary {
  usedBytes: number
  totalBytes?: number
  filesCount: number
  connectedServers: number
  onlineServers: number
  byType: Array<{
    type: BlossomFileKind
    label: string
    bytes: number
  }>
}

export interface BlossomBenefit {
  title: string
  description: string
  icon: LucideIcon
}

export interface BlossomMetric {
  title: string
  value: string
  description: string
  icon: LucideIcon
  progress?: number
}

export interface BlossomUploadResult {
  file: BlossomFileRecord
  fallbackUrls: string[]
}

export interface BlossomFilesLoadResult {
  files: BlossomFileRecord[]
  servers: BlossomServerStatus[]
  serverErrors: Array<{ url: string; message: string }>
  source: 'real' | 'empty'
}
