import type { BlossomFileRecord, BlossomServerStatus, BlossomStorageSummary } from './blossom.types'

const now = Date.now()

export const MOCK_BLOSSOM_FILES: BlossomFileRecord[] = [
  {
    id: 'bls-file-001',
    name: 'nostrtube-trailer.mp4',
    type: 'video',
    mimeType: 'video/mp4',
    size: 2_480_000_000,
    createdAt: now - 1000 * 60 * 18,
    url: 'https://blossom.primal.net/7f9d4a-trailer',
    hash: '7f9d4a8c1b3e2f901d645e0b81fd1f2b8a3c67c2122fdce0e8ab19f79c8a52f2',
    blossomServerUrl: 'https://blossom.primal.net',
    pathLabel: 'videos/publicados',
  },
  {
    id: 'bls-file-002',
    name: 'cover-art.webp',
    type: 'image',
    mimeType: 'image/webp',
    size: 3_600_000,
    createdAt: now - 1000 * 60 * 72,
    url: 'https://cdn.satellite.earth/5a1d-cover',
    hash: '5a1d340b839fd1c852f7338ae11b8bb418c11b2a74818cbb51aaf0025e52fe91',
    blossomServerUrl: 'https://cdn.satellite.earth',
    pathLabel: 'imagens/capas',
  },
  {
    id: 'bls-file-003',
    name: 'creator-kit.pdf',
    type: 'document',
    mimeType: 'application/pdf',
    size: 18_900_000,
    createdAt: now - 1000 * 60 * 60 * 8,
    url: 'https://nostr.download/creator-kit',
    hash: 'aa12f8de90b11ea5bbbfba9008c56f0fda4b7cb261a2a0ed437e84cc1724dd09',
    blossomServerUrl: 'https://nostr.download',
    pathLabel: 'documentos/guias',
  },
  {
    id: 'bls-file-004',
    name: 'playlist-metadata.json',
    type: 'json',
    mimeType: 'application/json',
    size: 42_000,
    createdAt: now - 1000 * 60 * 60 * 26,
    url: 'https://blossom.band/playlist-metadata',
    hash: 'c81209bb42fcb19228aeb2107ab1f6153e740c3c62dc0193d60f802a6ba9a277',
    blossomServerUrl: 'https://blossom.band',
    pathLabel: 'metadata/playlists',
  },
  {
    id: 'bls-file-005',
    name: 'thumbnail-snapshot.png',
    type: 'image',
    mimeType: 'image/png',
    size: 1_280_000,
    createdAt: now - 1000 * 60 * 60 * 54,
    url: 'https://blossom.primal.net/thumb-snapshot',
    hash: 'd320d6f03f065700c2c9a65ea209f8c958d800f44eb9240f2f521110ec842385',
    blossomServerUrl: 'https://blossom.primal.net',
    pathLabel: 'imagens/thumbnails',
  },
]

export const MOCK_BLOSSOM_STORAGE_SUMMARY: BlossomStorageSummary = {
  usedBytes: 12.4 * 1024 ** 3,
  totalBytes: 50 * 1024 ** 3,
  filesCount: 248,
  connectedServers: 6,
  onlineServers: 6,
  byType: [
    { type: 'video', label: 'Vídeos', bytes: 8.6 * 1024 ** 3 },
    { type: 'image', label: 'Imagens', bytes: 2.1 * 1024 ** 3 },
    { type: 'document', label: 'Documentos', bytes: 1.1 * 1024 ** 3 },
    { type: 'other', label: 'Outros', bytes: 0.6 * 1024 ** 3 },
  ],
}

export const MOCK_BLOSSOM_SERVER_STATUSES: BlossomServerStatus[] = [
  { url: 'https://blossom.primal.net', online: true, latencyMs: 84, isDefault: true },
  { url: 'https://cdn.satellite.earth', online: true, latencyMs: 141 },
  { url: 'https://nostr.download', online: true, latencyMs: 203 },
  { url: 'https://blossom.band', online: true, latencyMs: 178 },
]
