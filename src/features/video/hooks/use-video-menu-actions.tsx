import { Share } from '@capacitor/share'
import type { NDKEvent } from '@nostr-dev-kit/ndk'
import { useNDK, useNDKCurrentPubkey } from '@nostr-dev-kit/ndk-hooks'
import { useNavigate } from '@tanstack/react-router'
import {
  Bookmark,
  Download,
  ExternalLink,
  FileJson,
  ListPlus,
  Pencil,
  Send,
  Share2,
  ShieldAlert,
  UserX,
  VideoOff,
  Wrench,
} from 'lucide-react'
import * as React from 'react'
import { toast } from 'sonner'
import { modal } from '@/components/modal_v2/modal-manager'
import { isInWatchLater, toggleWatchLater } from '@/features/library/services/watch-later.service'
import { addMuteListItem } from '@/features/nostr/services/mute-list.service'
import { copyText, getVideoDetails } from '@/helper/format'
import { useDownload } from '@/hooks/useDownload'
import AddToPlaylistModal from '@/routes/v/@components/AddToPlaylistModal'
import { ReportContentModal, ReportTechnicalModal } from '@/routes/v/@components/ReportVideoModal'

export function useVideoMenuActions(event: NDKEvent) {
  const navigate = useNavigate()
  const { ndk } = useNDK()
  const currentPubkey = useNDKCurrentPubkey()
  const naddr = event.encode()
  const dTag = event.dTag
  const { downloadFile } = useDownload()

  return React.useMemo(() => {
    const rawEvent = event.rawEvent()
    const { url, title, summary } = getVideoDetails(event)

    const handleDownload = () => {
      const promise = downloadFile(url, title)
      toast.promise(promise, {
        success: 'Video has been downloaded',
        error: 'Video download fail',
      })
    }

    const handleShare = () => {
      const shareUrl = `${import.meta.env.VITE_PUBLIC_ROOT_DOMAIN ?? 'https://nostrtube.com'}/v/${dTag || naddr}`

      if ((navigator as Navigator).share) {
        Share.share({
          title,
          text: title,
          url: shareUrl,
        }).catch(console.log)
        return
      }

      copyText(shareUrl).then(() => toast.success('Link copied!'))
    }

    const handleMuteVideo = async () => {
      if (!ndk || !currentPubkey) {
        toast.error('Faça login para atualizar sua mute list.')
        return
      }

      const result = await addMuteListItem({
        ndk,
        pubkey: currentPubkey,
        item: { tagName: 'e', value: event.id },
      })
      toast.success(result.alreadyMuted ? 'Vídeo já estava na mute list.' : 'Vídeo adicionado à mute list.')
    }

    const handleMuteAuthor = async () => {
      if (!ndk || !currentPubkey) {
        toast.error('Faça login para atualizar sua mute list.')
        return
      }

      if (event.pubkey === currentPubkey) {
        toast.error('Você não pode mutar seu próprio perfil.')
        return
      }

      const result = await addMuteListItem({
        ndk,
        pubkey: currentPubkey,
        item: { tagName: 'p', value: event.pubkey },
      })
      toast.success(result.alreadyMuted ? 'Autor já estava na mute list.' : 'Autor adicionado à mute list.')
    }

    return [
      {
        label: 'Share video',
        icon: <Share2 className="size-4" />,
        action: handleShare,
      },
      {
        label: 'Add to Playlist',
        icon: <ListPlus className="size-4" />,
        action: () => {
          const dTagId = event.tagValue('d') || event.dTag || event.tagId()
          if (!dTagId) {
            toast.error('Não foi possível identificar a tag d deste vídeo.')
            return
          }
          modal.show(<AddToPlaylistModal eventIdTag={`${event.kind}:${event.pubkey}:${dTagId}`} />)
        },
      },
      {
        label: isInWatchLater(event.id) ? 'Remove from Watch Later' : 'Save to Watch Later',
        icon: <Bookmark className="size-4" />,
        action: () => {
          const saved = toggleWatchLater(event)
          toast.success(saved ? 'Saved to Watch Later' : 'Removed from Watch Later')
        },
      },
      {
        label: 'Download video',
        icon: <Download className="size-4" />,
        action: handleDownload,
      },
      {
        label: 'Mute video',
        icon: <VideoOff className="size-4 text-amber-500" />,
        action: () => {
          toast.promise(handleMuteVideo(), {
            loading: 'Atualizando mute list...',
            error: 'Não foi possível atualizar a mute list.',
          })
        },
      },
      {
        label: 'Mute author',
        icon: <UserX className="size-4 text-amber-500" />,
        action: () => {
          toast.promise(handleMuteAuthor(), {
            loading: 'Atualizando mute list...',
            error: 'Não foi possível atualizar a mute list.',
          })
        },
      },
      {
        label: 'Copy raw event',
        icon: <FileJson className="size-4" />,
        action: () => copyText(JSON.stringify(rawEvent)).then(() => toast.success('Copied event')),
      },
      ...(currentPubkey === event.author.pubkey
        ? [
            {
              label: 'Edit Event',
              icon: <Pencil className="size-4" />,
              action: async () => {
                await navigate({
                  to: '/v/$eventId/edit',
                  params: { eventId: event.encode() },
                })
              },
            },
          ]
        : []),
      {
        label: 'Notificar problema técnico',
        icon: <Wrench className="size-4 text-amber-500" />,
        action: () =>
          modal.show(
            <ReportTechnicalModal
              data={{
                title: title || summary[0],
                id: event.id,
                authorPubkey: event.pubkey,
                relayUrls: import.meta.env.VITE_NOSTR_RELAYS,
              }}
            />,
          ),
      },
      {
        label: 'Reportar violação de conteúdo',
        icon: <ShieldAlert className="size-4 text-red-500" />,
        action: () =>
          modal.show(
            <ReportContentModal
              data={{
                title: title || summary[0],
                id: event.id,
                authorPubkey: event.pubkey,
                relayUrls: import.meta.env.VITE_NOSTR_RELAYS,
              }}
            />,
          ),
      },
      {
        label: 'View on NJump',
        icon: <ExternalLink className="size-4" />,
        action: () => window.open(`https://njump.me/${event.id}`, '_blank'),
      },
      {
        label: 'Open Native',
        icon: <Send className="size-4" />,
        action: () => window.open(`nostr://${naddr}`),
      },
    ]
  }, [currentPubkey, dTag, event, naddr, navigate, downloadFile, ndk])
}
