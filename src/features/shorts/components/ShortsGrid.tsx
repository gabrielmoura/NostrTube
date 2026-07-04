import type { NDKUserProfile } from '@nostr-dev-kit/ndk'
import { Link } from '@tanstack/react-router'
import { Clock, Play, UserRound } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { ShortVideoViewModel } from '@/features/shorts/services/shorts-media.service'
import { getFormattedVideoDuration } from '@/features/video/services/video-duration.service'
import { getLettersPlain, getNameToShow } from '@/helper/format'

interface ShortsGridProps {
  profiles: Record<string, NDKUserProfile | undefined>
  shorts: ShortVideoViewModel[]
}

export function ShortsGrid({ profiles, shorts }: ShortsGridProps) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
      {shorts.map((short) => (
        <ShortsGridCard key={short.id} profile={profiles[short.event.pubkey]} short={short} />
      ))}
    </div>
  )
}

function ShortsGridCard({ profile, short }: { profile?: NDKUserProfile; short: ShortVideoViewModel }) {
  const npub = short.event.author.npub
  const authorName = getNameToShow({ npub, profile })
  const duration = getFormattedVideoDuration(short.event)

  return (
    <Link
      to="/short/$eventId"
      params={{ eventId: short.routeReference }}
      search={
        {
          author: short.event.pubkey,
          video: short.id,
        } as never
      }
      className="group min-w-0 focus-visible:outline-none"
    >
      <article className="overflow-hidden rounded-xl border border-border/70 bg-card/80 shadow-sm transition-colors hover:border-primary/40 hover:bg-card">
        <div className="relative aspect-[9/16] overflow-hidden bg-black">
          {short.poster ? (
            <img
              src={short.poster}
              alt={short.title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-white/60">
              <Play className="size-10" />
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/86 via-black/14 to-transparent opacity-92" />

          <div className="absolute left-2 top-2 rounded-full bg-black/62 px-2 py-1 text-[11px] font-semibold text-white backdrop-blur">
            Short
          </div>

          {duration ? (
            <div className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/62 px-2 py-1 text-[11px] font-medium text-white backdrop-blur">
              <Clock className="size-3" />
              {duration}
            </div>
          ) : null}

          <div className="absolute inset-x-0 bottom-0 space-y-2 p-3">
            <h2 className="line-clamp-2 text-sm font-semibold leading-snug text-white">{short.title}</h2>
            <div className="flex min-w-0 items-center gap-2 text-white/82">
              <Avatar className="size-6 border border-white/25">
                <AvatarImage src={profile?.picture || profile?.image} alt={authorName} />
                <AvatarFallback>
                  {getLettersPlain(profile?.name || authorName) || <UserRound className="size-3" />}
                </AvatarFallback>
              </Avatar>
              <span className="truncate text-xs font-medium">{authorName}</span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  )
}
