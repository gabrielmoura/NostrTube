import { useMemo } from 'react'
import { useZapStats } from '@/features/zap/hooks/useZapStats'

export function useZapActivity() {
  const query = useZapStats()
  const activity = useMemo(() => query.data?.activity ?? [], [query.data?.activity])

  return {
    ...query,
    activity,
  }
}
