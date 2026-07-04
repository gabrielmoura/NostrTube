import '@vidstack/react/player/styles/base.css'

import {
  isDASHProvider,
  isHLSProvider,
  MediaPlayer,
  type MediaPlayerInstance,
  MediaProvider,
  type MediaProviderAdapter,
  Poster,
} from '@vidstack/react'
import { useEffect, useRef } from 'react'
import { getOptimizedImageSrc } from '@/helper/http'
import { cn } from '@/lib/utils'
import useImageProxySettingsStore from '@/store/useImageProxySettingsStore'
import useUserStore from '@/store/useUserStore'

interface ShortsPlayerProps {
  active: boolean
  preload?: boolean
  src: string
  mimeType?: string
  poster?: string
  title: string
}

export function ShortsPlayer({ active, preload, src, mimeType, poster, title }: ShortsPlayerProps) {
  const playerRef = useRef<MediaPlayerInstance | null>(null)
  const persistedMuted = useUserStore((state) => state.session?.videoMuted ?? true)
  const setVideoMuted = useUserStore((state) => state.setVideoMuted)
  const imageProxy = useImageProxySettingsStore((state) => state.imageProxy)

  useEffect(() => {
    const player = playerRef.current
    if (!player) return

    if (active) {
      void player.play().catch(() => undefined)
      return
    }

    void player.pause()
  }, [active])

  useEffect(() => {
    const player = playerRef.current
    if (!player) return
    player.muted = persistedMuted
  }, [persistedMuted])

  useEffect(() => {
    const player = playerRef.current
    if (!player) return

    return player.subscribe(({ muted }) => {
      if (typeof muted === 'boolean' && muted !== persistedMuted) {
        setVideoMuted(muted)
      }
    })
  }, [persistedMuted, setVideoMuted])

  function onProviderChange(provider: MediaProviderAdapter | null) {
    if (!provider) return
    if (isHLSProvider(provider)) {
      provider.config = {
        backBufferLength: 0,
        lowLatencyMode: false,
      }
    }
    if (isDASHProvider(provider)) {
      provider.config = {}
    }
  }

  return (
    <MediaPlayer
      ref={playerRef}
      className={cn(
        'group absolute inset-0 h-full w-full overflow-hidden bg-black text-white ring-media-focus data-[focus]:ring-4',
        '[&_[data-media-provider]]:h-full [&_[data-media-provider]]:w-full [&_video]:h-full [&_video]:w-full [&_video]:object-cover',
      )}
      title={title}
      src={src}
      viewType="video"
      streamType="on-demand"
      preload={active || preload ? 'auto' : 'metadata'}
      playsInline
      autoplay={active}
      muted={persistedMuted}
      loop
      logLevel="warn"
      onProviderChange={onProviderChange}
    >
      <MediaProvider>
        <source src={src} type={mimeType ?? 'video/mp4'} />
        {poster ? (
          <Poster
            className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity data-[visible]:opacity-100"
            src={getOptimizedImageSrc(poster, '700', undefined, imageProxy)}
            alt={title}
          />
        ) : null}
      </MediaProvider>
    </MediaPlayer>
  )
}
