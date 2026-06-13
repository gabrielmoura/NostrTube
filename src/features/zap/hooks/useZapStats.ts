import { useNDK, useNDKCurrentUser } from '@nostr-dev-kit/ndk-hooks'
import { useQuery } from '@tanstack/react-query'
import { loadZapDashboard } from '@/features/zap/services/zap-analytics.service'

export function useZapStats() {
  const { ndk } = useNDK()
  const currentUser = useNDKCurrentUser()

  return useQuery({
    queryKey: ['zap-dashboard', currentUser?.pubkey],
    queryFn: async () => loadZapDashboard(ndk!, currentUser!.pubkey),
    enabled: Boolean(ndk && currentUser?.pubkey),
    staleTime: 60_000,
    retry: false,
  })
}
