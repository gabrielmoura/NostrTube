import { mapImetaTag, type NDKEvent } from '@nostr-dev-kit/ndk'
import { useEffect, useMemo, useState } from 'react'
import { extractTag } from '@/helper/extractTag.ts'
import { getOptimizedImageSrc, type ImageProxyConfig } from '@/helper/http.ts'
import { getTags, type NostrTag } from '@/helper/nostrTags'
import useImageProxySettingsStore from '@/store/useImageProxySettingsStore.ts'

export interface UseNostrImageOptions {
  width?: number | string
  height?: number | string
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function extractImetaField(tag: NostrTag, field: 'image' | 'url'): string | undefined {
  const prefix = `${field} `
  const value = tag.find((item) => item.startsWith(prefix))?.slice(prefix.length)

  return isNonEmptyString(value) ? value : undefined
}

function getFirstImetaField(tags: NostrTag[], field: 'image' | 'url'): string | undefined {
  for (const tag of tags) {
    const mapped = mapImetaTag(tag) as Partial<Record<'image' | 'url', unknown>>
    const mappedValue = mapped[field]

    if (isNonEmptyString(mappedValue)) {
      return mappedValue
    }

    const extractedValue = extractImetaField(tag, field)
    if (extractedValue) {
      return extractedValue
    }
  }

  return undefined
}

function canUseProxyForDerivedThumbnail(proxyConfig: ImageProxyConfig): boolean {
  if (proxyConfig.mode === 'none') {
    return false
  }

  if (proxyConfig.mode === 'imgproxy') {
    return Boolean(proxyConfig.imgproxyBaseUrl?.trim())
  }

  if (proxyConfig.mode === 'imageproxy') {
    return Boolean(proxyConfig.imageproxyBaseUrl?.trim())
  }

  return false
}

/**
 * Hook customizado para processamento e gestão de mídia em eventos Nostr.
 * * Este hook centraliza a lógica de extração de metadados, resolução de hierarquia
 * de URLs (thumbnail > imeta > url) e controle de estado de carregamento de imagem.
 * * @param {NDKEvent} event - O evento Nostr contendo as tags de mídia (Kind 1, 20, 30063, etc).
 * * @returns {Object} Objeto contendo estados de carregamento e dados da imagem.
 * @returns {string | null} optimized - URL da imagem processada e otimizada para o componente.
 * @returns {string | undefined} title - Título ou descrição extraída das tags para uso em `alt`.
 * @returns {boolean} isNSFW - Indica se o evento possui tags de conteúdo sensível (`content-warning` ou `nsfw`).
 * @returns {boolean} loading - Estado de carregamento da imagem (gerenciado via handlers).
 * @returns {boolean} error - Indica se houve falha ao carregar a URL final da imagem.
 * @returns {Object} handlers - Callbacks para serem injetados diretamente no elemento `<img>`.
 * @returns {Function} handlers.onLoad - Handler para definir `loading` como falso.
 * @returns {Function} handlers.onError - Handler para tratar falhas e definir `error` como verdadeiro.
 * * @example
 * const { optimized, handlers, loading } = useNostrImage(event);
 * * return (
 * <div className={loading ? 'animate-pulse' : ''}>
 * {optimized && <img src={optimized} onLoad={handlers.onLoad} onError={handlers.onError} />}
 * </div>
 * );
 */
export function useNostrImage(event: NDKEvent, options?: UseNostrImageOptions) {
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)
  const imageProxy = useImageProxySettingsStore((state) => state.imageProxy)
  const width = options?.width ?? 480
  const height = options?.height ?? width

  const imageSpecs = useMemo(() => {
    const { image, thumb, title, url: directUrl } = extractTag(event.tags)
    const imetaTags = getTags('imeta', event.tags)
    const imetaImage = getFirstImetaField(imetaTags, 'image')
    const imetaUrl = getFirstImetaField(imetaTags, 'url')
    const canUseProxyUrlCandidate = canUseProxyForDerivedThumbnail(imageProxy)

    const candidates = [
      thumb,
      image,
      imetaImage,
      canUseProxyUrlCandidate ? directUrl : undefined,
      canUseProxyUrlCandidate ? imetaUrl : undefined,
    ].filter(isNonEmptyString)
    const source = candidates[0]

    // Otimização
    const optimized = source
      ? getOptimizedImageSrc(source, width, {
          resize: {
            resizing_type: 'fit',
            width: Number(width),
            height: Number(height),
          },
          format: 'webp',
        }, imageProxy)
      : null

    const isNSFW = event.tags.some((t) => t[0] === 'content-warning' || t[0] === 'nsfw')

    return { optimized, title, isNSFW }
  }, [event.tags, imageProxy, width, height])

  useEffect(() => {
    setLoading(Boolean(imageSpecs.optimized))
    setError(false)
  }, [imageSpecs.optimized])

  return {
    ...imageSpecs,
    loading,
    error,
    handlers: {
      onLoad: () => setLoading(false),
      onError: () => {
        setLoading(false)
        setError(true)
      },
    },
  }
}
