import type { NDKUserProfile } from '@nostr-dev-kit/ndk'
import { Link } from '@tanstack/react-router'
import { Heart, MessageCircle, Share2, Zap } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import type { ShortVideoViewModel } from '@/features/shorts/services/shorts-media.service'
import { getLettersPlain, getNameToShow } from '@/helper/format'

interface ShortsOverlayProps {
  short: ShortVideoViewModel
  profile?: NDKUserProfile
}

export function ShortsOverlay({ short, profile }: ShortsOverlayProps) {
  const npub = short.event.author.npub
  const authorName = getNameToShow({ npub, profile })
  const tags = short.event.tags
    .filter((tag) => tag[0] === 't' && tag[1])
    .map((tag) => tag[1])
    .slice(0, 4)

  const share = async () => {
    const url = `${location.origin}/short/${short.routeReference}`
    if (navigator.share) {
      await navigator.share({ title: short.title, url }).catch(() => undefined)
      return
    }
    await navigator.clipboard.writeText(url).catch(() => undefined)
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex items-end justify-between gap-4 bg-gradient-to-t from-black/78 via-black/20 to-black/12 p-4 text-white sm:p-5">
      <div className="min-w-0 flex-1 space-y-3">
        <Link
          to="/u/$userId"
          params={{ userId: npub }}
          className="pointer-events-auto inline-flex max-w-full items-center gap-2 rounded-full bg-black/26 px-2 py-1.5 backdrop-blur"
        >
          <Avatar className="size-8 border border-white/25">
            <AvatarImage src={profile?.picture || profile?.image} alt={authorName} />
            <AvatarFallback>{getLettersPlain(profile?.name || authorName) || 'NT'}</AvatarFallback>
          </Avatar>
          <span className="truncate text-sm font-semibold">{authorName}</span>
        </Link>

        <div className="space-y-1.5">
          <Link
            to="/short/$eventId"
            params={{ eventId: short.routeReference }}
            className="pointer-events-auto line-clamp-2 text-base font-semibold leading-tight hover:underline"
          >
            {short.title}
          </Link>
          {short.summary ? <p className="line-clamp-3 text-sm leading-5 text-white/82">{short.summary}</p> : null}
          {tags.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span key={tag} className="rounded-full bg-white/14 px-2 py-0.5 text-xs text-white/88">
                  #{tag}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div className="pointer-events-auto flex shrink-0 flex-col items-center gap-3">
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="rounded-full bg-black/30 text-white hover:bg-white/20 hover:text-white"
          aria-label="Curtir short"
        >
          <Heart className="size-5" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="rounded-full bg-black/30 text-white hover:bg-white/20 hover:text-white"
          aria-label="Enviar zap"
        >
          <Zap className="size-5" />
        </Button>
        <Link
          to="/short/$eventId"
          params={{ eventId: short.routeReference }}
          className="inline-flex size-10 items-center justify-center rounded-full bg-black/30 text-white transition-colors hover:bg-white/20"
          aria-label="Abrir comentarios"
        >
          <MessageCircle className="size-5" />
        </Link>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="rounded-full bg-black/30 text-white hover:bg-white/20 hover:text-white"
          aria-label="Compartilhar short"
          onClick={() => void share()}
        >
          <Share2 className="size-5" />
        </Button>
      </div>
    </div>
  )
}
