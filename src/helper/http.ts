import { generateUrl, type Options } from '@imgproxy/imgproxy-js-core'
import type { ImageProxyMode } from '@/store/useImageProxySettingsStore.ts'

export interface ImageProxyConfig {
  mode: ImageProxyMode
  imgproxyBaseUrl?: string
  nostubeImgproxyBaseUrl?: string
  imageproxyBaseUrl?: string
}

const envImgproxyBaseUrl = import.meta.env.VITE_APP_IMGPROXY
const envNostubeImgproxyBaseUrl = import.meta.env.VITE_APP_NOSTUBE_IMGPROXY
const envImageProxyMode = import.meta.env.VITE_APP_IMAGE_PROXY_MODE

function normalizeBaseUrl(url?: string): string {
  return url?.trim().replace(/\/+$/, '') ?? ''
}

function isImageProxyMode(value: unknown): value is ImageProxyMode {
  return value === 'none' || value === 'imgproxy' || value === 'nostube-imgproxy' || value === 'imageproxy'
}

function getDefaultImageProxyMode(): ImageProxyMode {
  if (isImageProxyMode(envImageProxyMode)) {
    return envImageProxyMode === 'nostube-imgproxy' && !envNostubeImgproxyBaseUrl ? 'none' : envImageProxyMode
  }

  return envNostubeImgproxyBaseUrl ? 'nostube-imgproxy' : 'none'
}

function getDefaultImageProxyConfig(): ImageProxyConfig {
  return {
    mode: getDefaultImageProxyMode(),
    imgproxyBaseUrl: envImgproxyBaseUrl,
    nostubeImgproxyBaseUrl: envNostubeImgproxyBaseUrl,
    imageproxyBaseUrl: '',
  }
}

function getImageproxyOptions(width: number | string, customOptions?: Options): string {
  const resize = customOptions?.resize
  const requestedWidth = Number(resize?.width ?? width)
  const requestedHeight = Number(resize?.height)
  const size =
    Number.isFinite(requestedWidth) && requestedWidth > 0
      ? Number.isFinite(requestedHeight) && requestedHeight > 0 && requestedHeight !== requestedWidth
        ? `${requestedWidth}x${requestedHeight}`
        : `${requestedWidth}`
      : 'x'
  const resizeMode = resize?.resizing_type === 'fit' ? 'fit' : undefined

  return [size, resizeMode].filter(Boolean).join(',')
}

function getNostubeImgproxyResizeOptions(width: number | string, customOptions?: Options) {
  const resize = customOptions?.resize
  const requestedWidth = Number(resize?.width ?? width)
  const requestedHeight = Number(resize?.height ?? requestedWidth)
  const resizeType = resize?.resizing_type ?? 'fit'
  const safeWidth = Number.isFinite(requestedWidth) && requestedWidth > 0 ? Math.round(requestedWidth) : ''
  const safeHeight = Number.isFinite(requestedHeight) && requestedHeight > 0 ? Math.round(requestedHeight) : ''

  return `rs:${resizeType}:${safeWidth}:${safeHeight}`
}

function getNostubeImgproxyUrl(baseUrl: string, src: string, width: number | string, customOptions?: Options) {
  const format = customOptions?.format ? `f:${customOptions.format}` : 'f:webp'
  const quality = customOptions?.quality ? `q:${customOptions.quality}` : undefined
  const resize = getNostubeImgproxyResizeOptions(width, customOptions)
  const directives = [format, quality, resize].filter(Boolean).join('/')

  return `${baseUrl}/insecure/${directives}/plain/${encodeURIComponent(src)}`
}

// --- Função de Alto Nível (Helper / Wrapper) ---

/**
 * Função utilitária para uso direto nos componentes.
 * Responsabilidade: Decidir SE deve usar o proxy e aplicar defaults.
 */
export function getOptimizedImageSrc(
  src: string,
  width: number | string,
  customOptions?: Options,
  proxyConfig: ImageProxyConfig = getDefaultImageProxyConfig(),
): string {
  if (!src) {
    return src
  }

  if (proxyConfig.mode === 'none') {
    return src
  }

  const options: Options = customOptions || {
    resize: {
      resizing_type: 'fit',
      width: Number(width),
      height: Number(width),
    },
  }

  if (proxyConfig.mode === 'imageproxy') {
    const baseUrl = normalizeBaseUrl(proxyConfig.imageproxyBaseUrl)
    if (!baseUrl) return src

    return `${baseUrl}/${getImageproxyOptions(width, options)}/${encodeURIComponent(src)}`
  }

  if (proxyConfig.mode === 'nostube-imgproxy') {
    const baseUrl = normalizeBaseUrl(proxyConfig.nostubeImgproxyBaseUrl)
    if (!baseUrl) return src

    return getNostubeImgproxyUrl(baseUrl, src, width, options)
  }

  const baseUrl = normalizeBaseUrl(proxyConfig.imgproxyBaseUrl)
  if (!baseUrl) return src

  const path = generateUrl(
    {
      type: 'plain',
      value: src,
    },
    options,
  )

  return `${baseUrl}/insecure${path}`
}
