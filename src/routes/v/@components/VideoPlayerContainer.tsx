import { useEffect, useMemo, useState } from 'react'
import { VideoPlayer } from '@/components/videoPlayer'
import type { VideoAssetSet, VideoVariant } from '@/features/video/services/video-imeta.service'
import { getPreferredVariant } from '@/features/video/services/video-imeta.service'
import { VideoPlaybackError } from '@/routes/v/@components/VideoPlaybackError'
import { VideoVariantSelector } from '@/routes/v/@components/VideoVariantSelector'

interface VideoPlayerContainerProps {
  title: string
  image?: string
  assetSet: VideoAssetSet
  fallbackUrl?: string
  onCanPlay?: () => void
  className?: string
}

const NO_SOURCE_MESSAGE = 'Nao foi possivel reproduzir este video com nenhuma das fontes disponiveis.'

function buildFallbackVariant(fallbackUrl?: string, image?: string): VideoVariant | null {
  if (!fallbackUrl) return null
  return {
    id: 'legacy-fallback',
    posterUrls: image ? [image] : [],
    candidates: [{ url: fallbackUrl, isPrimary: true }],
  }
}

export function VideoPlayerContainer({
  title,
  image,
  assetSet,
  fallbackUrl,
  onCanPlay,
  className,
}: VideoPlayerContainerProps) {
  const variants = useMemo(() => {
    if (assetSet.variants.length > 0) return assetSet.variants
    const legacyVariant = buildFallbackVariant(fallbackUrl, image)
    return legacyVariant ? [legacyVariant] : []
  }, [assetSet.variants, fallbackUrl, image])

  const defaultVariant = useMemo(() => getPreferredVariant(variants), [variants])
  const [selectedVariantId, setSelectedVariantId] = useState(defaultVariant?.id ?? '')
  const [activeCandidateIndex, setActiveCandidateIndex] = useState(0)
  const [unavailableVariantIds, setUnavailableVariantIds] = useState<Set<string>>(new Set())
  const [playbackError, setPlaybackError] = useState<string | null>(null)

  useEffect(() => {
    setSelectedVariantId(defaultVariant?.id ?? '')
    setActiveCandidateIndex(0)
    setUnavailableVariantIds(new Set())
    setPlaybackError(defaultVariant ? null : NO_SOURCE_MESSAGE)
  }, [defaultVariant])

  const selectedVariant = useMemo(
    () => variants.find((variant) => variant.id === selectedVariantId) ?? defaultVariant ?? null,
    [defaultVariant, selectedVariantId, variants],
  )

  const activeCandidate = selectedVariant?.candidates[activeCandidateIndex] ?? null
  const activePoster = selectedVariant?.posterUrls[0] ?? image

  const handleVariantChange = (variantId: string) => {
    setSelectedVariantId(variantId)
    setActiveCandidateIndex(0)
    setPlaybackError(null)
  }

  const handlePlaybackError = () => {
    if (!selectedVariant) {
      setPlaybackError(NO_SOURCE_MESSAGE)
      return
    }

    const nextCandidateIndex = activeCandidateIndex + 1
    if (nextCandidateIndex < selectedVariant.candidates.length) {
      setActiveCandidateIndex(nextCandidateIndex)
      return
    }

    setUnavailableVariantIds((previous) => {
      const next = new Set(previous)
      next.add(selectedVariant.id)
      return next
    })

    const nextVariant = variants.find(
      (variant) => variant.id !== selectedVariant.id && !unavailableVariantIds.has(variant.id),
    )
    if (nextVariant) {
      setSelectedVariantId(nextVariant.id)
      setActiveCandidateIndex(0)
      setPlaybackError(null)
      return
    }

    setPlaybackError(NO_SOURCE_MESSAGE)
  }

  if (!activeCandidate) {
    return <VideoPlaybackError message={playbackError ?? NO_SOURCE_MESSAGE} />
  }

  return (
    <div className="space-y-2">
      <VideoVariantSelector
        variants={variants}
        value={selectedVariant?.id ?? ''}
        unavailableVariantIds={unavailableVariantIds}
        onChange={handleVariantChange}
      />
      {playbackError ? <VideoPlaybackError message={playbackError} /> : null}
      <VideoPlayer
        key={`${selectedVariant?.id ?? 'none'}:${activeCandidateIndex}`}
        src={activeCandidate.url}
        sourceMimeType={activeCandidate.mimeType}
        image={activePoster ?? ''}
        title={title}
        onCanPlay={onCanPlay}
        onPlaybackError={handlePlaybackError}
        className={className}
      />
    </div>
  )
}
