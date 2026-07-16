import { type NDKEvent, NDKKind, type NDKUserProfile } from '@nostr-dev-kit/ndk'
import { useNDK } from '@nostr-dev-kit/ndk-hooks'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { Network, UsersRound } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { fetchEventsCached } from '@/features/nostr/services/ndk-query.service'

interface SocialGraphTabProps {
  pubkey: string
  profileTitle: string
  profilePicture?: string
}

interface GraphProfile {
  pubkey: string
  profile?: NDKUserProfile
}

function getInitials(name?: string) {
  return name?.slice(0, 2).toUpperCase() || 'U'
}

function parseFollowPubkeys(contactEvent?: NDKEvent) {
  if (!contactEvent) return []
  return Array.from(new Set(contactEvent.tags.filter((tag) => tag[0] === 'p' && tag[1]).map((tag) => tag[1])))
}

function parseProfile(event: NDKEvent): NDKUserProfile | undefined {
  try {
    return JSON.parse(event.content) as NDKUserProfile
  } catch {
    return undefined
  }
}

function getProfileLabel(node: GraphProfile) {
  return node.profile?.displayName || node.profile?.name || node.profile?.nip05 || `${node.pubkey.slice(0, 10)}...`
}

export function SocialGraphTab({ pubkey, profileTitle, profilePicture }: SocialGraphTabProps) {
  const { t } = useTranslation('pages')
  const { ndk } = useNDK()

  const graphQuery = useQuery({
    queryKey: ['nostr-social-graph', pubkey],
    enabled: Boolean(ndk && pubkey),
    queryFn: async () => {
      const graphEvents = await fetchEventsCached(
        ndk!,
        [
          { authors: [pubkey], kinds: [NDKKind.Contacts], limit: 1 },
          { kinds: [NDKKind.Contacts], '#p': [pubkey], limit: 100 },
        ],
        { mode: 'parallel' },
      )

      const contactEvent = Array.from(graphEvents)
        .filter((event) => event.kind === NDKKind.Contacts && event.pubkey === pubkey)
        .sort((a, b) => (b.created_at ?? 0) - (a.created_at ?? 0))[0]
      const follows = parseFollowPubkeys(contactEvent)
      const followers = Array.from(
        new Set(
          Array.from(graphEvents)
            .filter((event) => event.kind === NDKKind.Contacts && event.pubkey !== pubkey)
            .map((event) => event.pubkey),
        ),
      )
      const visiblePubkeys = Array.from(new Set([...follows.slice(0, 36), ...followers.slice(0, 24)]))

      const metadataEvents = visiblePubkeys.length
        ? await fetchEventsCached(
            ndk!,
            { kinds: [NDKKind.Metadata], authors: visiblePubkeys, limit: visiblePubkeys.length },
            { mode: 'parallel' },
          )
        : new Set<NDKEvent>()
      const profiles = new Map<string, NDKUserProfile>()
      metadataEvents.forEach((event) => {
        const profile = parseProfile(event)
        if (profile) profiles.set(event.pubkey, profile)
      })

      return {
        follows,
        followers,
        nodes: visiblePubkeys.map((nodePubkey) => ({ pubkey: nodePubkey, profile: profiles.get(nodePubkey) })),
      }
    },
  })

  const follows = graphQuery.data?.follows ?? []
  const followers = graphQuery.data?.followers ?? []
  const nodes = graphQuery.data?.nodes ?? []
  const mutuals = useMemo(() => follows.filter((follow) => followers.includes(follow)).length, [followers, follows])

  if (graphQuery.isLoading) {
    return (
      <Card>
        <div className="p-6 text-sm text-muted-foreground">Carregando rede social...</div>
      </Card>
    )
  }

  if (!graphQuery.data || nodes.length === 0) {
    return (
      <Card>
        <div className="flex flex-col items-center justify-center px-6 py-16 text-center text-muted-foreground">
          <Network className="mb-4 size-10 opacity-30" />
          <p className="text-sm">{t('user_social_empty')}</p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <GraphMetric label={t('user_social_following')} value={follows.length} />
        <GraphMetric label={t('user_social_followers')} value={followers.length} />
        <GraphMetric label={t('user_social_mutual_connections')} value={mutuals} />
      </div>

      <Card>
        <div className="grid gap-0 lg:grid-cols-[280px_1fr]">
          <div className="border-b border-border/70 p-5 lg:border-b-0 lg:border-r">
            <div className="flex items-center gap-3">
              <Avatar className="size-14 border border-border">
                <AvatarImage src={profilePicture} alt={profileTitle} />
                <AvatarFallback>{getInitials(profileTitle)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate font-semibold">{profileTitle}</p>
                <p className="font-mono text-xs text-muted-foreground">{pubkey.slice(0, 12)}...</p>
              </div>
            </div>
            <div className="mt-5 rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2 text-foreground">
                <UsersRound className="size-4" />
                <span className="font-medium">{t('user_social_connected_nodes')}</span>
              </div>
              <p className="mt-2">{t('user_social_nodes_count', { count: nodes.length })}</p>
            </div>
          </div>

          <div className="p-5">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {nodes.map((node) => {
                const label = getProfileLabel(node)
                const isMutual = follows.includes(node.pubkey) && followers.includes(node.pubkey)
                const relation = isMutual
                  ? t('user_mutual')
                  : follows.includes(node.pubkey)
                    ? t('user_follows')
                    : t('user_follower')

                return (
                  <Link
                    key={node.pubkey}
                    to="/u/$userId"
                    params={{ userId: node.pubkey }}
                    className="rounded-lg border bg-muted/30 p-3 transition-colors hover:border-primary/40 hover:bg-secondary/40"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="size-10 border border-border">
                        <AvatarImage src={node.profile?.picture || node.profile?.image} alt={label} />
                        <AvatarFallback>{getInitials(label)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{label}</p>
                        <p className="truncate font-mono text-xs text-muted-foreground">{node.pubkey}</p>
                      </div>
                      <Badge variant={isMutual ? 'default' : 'secondary'} className="shrink-0 text-[10px]">
                        {relation}
                      </Badge>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

function GraphMetric({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <div className="p-5">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-2 text-2xl font-semibold">{value}</p>
      </div>
    </Card>
  )
}
