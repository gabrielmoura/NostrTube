import { useMemo } from 'react'
import { useNDK } from '@nostr-dev-kit/ndk-hooks'
import { useQuery } from '@tanstack/react-query'
import { useZapStats } from '@/features/zap/hooks/useZapStats'

export function useTopSupporters() {
  const { ndk } = useNDK()
  const statsQuery = useZapStats()

  const supporterPubkeys = useMemo(() => statsQuery.data?.topSupporters.map((supporter) => supporter.pubkey) ?? [], [statsQuery.data?.topSupporters])

  const profilesQuery = useQuery({
    queryKey: ['zap-top-supporters-profiles', supporterPubkeys],
    enabled: Boolean(ndk && supporterPubkeys.length > 0),
    queryFn: async () => {
      const entries = await Promise.all(
        supporterPubkeys.map(async (pubkey) => {
          try {
            const user = ndk!.getUser({ pubkey })
            const profile = await user.fetchProfile({}, true)
            return [pubkey, profile] as const
          } catch {
            return [pubkey, undefined] as const
          }
        }),
      )

      return Object.fromEntries(entries)
    },
    staleTime: 60_000,
    retry: false,
  })

  return {
    supporters: statsQuery.data?.topSupporters ?? [],
    profiles: profilesQuery.data ?? {},
    isLoading: statsQuery.isLoading || profilesQuery.isLoading,
    isError: statsQuery.isError || profilesQuery.isError,
  }
}
