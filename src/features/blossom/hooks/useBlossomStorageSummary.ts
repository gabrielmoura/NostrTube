import { useMemo } from 'react'
import type { BlossomFileRecord, BlossomStorageSummary } from '../blossom.types'
import { BLOSSOM_TYPE_LABELS } from '../blossom.utils'

export function useBlossomStorageSummary(
  files: BlossomFileRecord[],
  serverStats: { connectedServers: number; onlineServers: number },
): BlossomStorageSummary {
  return useMemo(() => {
    const bytesByType = files.reduce<Record<string, number>>((acc, file) => {
      acc[file.type] = (acc[file.type] ?? 0) + file.size
      return acc
    }, {})

    return {
      usedBytes: files.reduce((total, file) => total + file.size, 0),
      totalBytes: undefined,
      filesCount: files.length,
      connectedServers: serverStats.connectedServers,
      onlineServers: serverStats.onlineServers,
      byType: (['video', 'image', 'document', 'json', 'audio', 'other'] as const).map((type) => ({
        type,
        label: BLOSSOM_TYPE_LABELS[type],
        bytes: bytesByType[type] ?? 0,
      })),
    }
  }, [files, serverStats.connectedServers, serverStats.onlineServers])
}
