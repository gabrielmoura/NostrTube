/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_NOSTR_RELAYS: string;
  readonly VITE_NOSTR_SEARCH_RELAYS: string;
  readonly VITE_NOSTR_DEV_RELAYS: string;
  readonly VITE_APP_NAME: string;
  readonly VITE_APP_DESCRIPTION: string;
  readonly VITE_APP_IMGPROXY?: string;
  readonly VITE_PUBLIC_ROOT_DOMAIN: string;
  readonly VITE_NOSTR_BLOSSOM_FALLBACK?: string;
  readonly VITE_BEACON_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}