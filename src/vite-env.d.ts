/// <reference types="vite/client" />

declare global {
  interface ImportMetaEnv {
    readonly VITE_NOSTR_RELAYS: string[]
    readonly VITE_NOSTR_SEARCH_RELAYS: string[]
    readonly VITE_NOSTR_DEV_RELAYS: string[]
    readonly VITE_APP_NAME: string
    readonly VITE_APP_DESCRIPTION: string
    readonly VITE_APP_IMAGE_PROXY_MODE?: 'none' | 'imgproxy' | 'nostube-imgproxy' | 'imageproxy'
    readonly VITE_APP_IMGPROXY?: string
    readonly VITE_APP_NOSTUBE_IMGPROXY?: string
    readonly VITE_BASE_URL?: string
    readonly VITE_PUBLIC_ROOT_DOMAIN: string
    readonly VITE_NOSTR_BLOSSOM_FALLBACK?: string
    readonly VITE_BEACON_URL?: string
    readonly VITE_SENTRY_DSN?: string
    readonly VITE_DUFFLEPUD_URL?: string
    readonly VITE_BUILD_SOURCEMAP?: string
    readonly VITE_MIN_VIDEO_POW?: number
    readonly VITE_MIN_COMMENT_POW?: number
    readonly VITE_MIN_PLAYLIST_POW?: number
    readonly VITE_NOSTR_FEEDBACK_RECIPIENT_NPUB?: string
    readonly VITE_NOSTR_DEVELOPER_PUBKEY?: string
    readonly VITE_APP_VERSION?: string
    readonly VITE_NEXUS_P2P_RELAY_URL?: string
    readonly VITE_NEXUS_P2P_ENABLED?: string
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv
  }
}

export {}
