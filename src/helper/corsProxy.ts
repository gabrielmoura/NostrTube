import type { CorsProxySettings } from '@/store/useImageProxySettingsStore.ts'

function normalizeHttpsBaseUrl(url: string): string {
  const trimmed = url.trim()
  if (!trimmed) return ''
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
  return withProtocol.replace(/\/+$/, '')
}

export function getCorsProxiedUrl(url: string, settings: CorsProxySettings): string {
  if (!url || settings.mode === 'none') return url

  if (settings.mode === 'corsproxy_io') {
    return `https://corsproxy.io/?url=${encodeURIComponent(url)}`
  }

  const baseUrl = normalizeHttpsBaseUrl(settings.customBaseUrl)
  if (!baseUrl) return url

  return `${baseUrl}/${url}`
}
