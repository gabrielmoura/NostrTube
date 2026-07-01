import { ValidateEnv } from '@julr/vite-plugin-validate-env'
import { z } from 'zod'
import { DEFAULT_FEEDBACK_RECIPIENT_NPUB } from './src/config/feedback.const'

// Helper para validar e transformar strings separadas por vírgula em Array
const csvToArray = z.string().transform((str) =>
  str
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
)

const imageProxyMode = z.enum(['none', 'imgproxy', 'nostube-imgproxy', 'imageproxy'])

export default function envSchemaValidate() {
  return ValidateEnv({
    validator: 'standard',
    schema: {
      VITE_APP_NAME: z.string().min(1),
      VITE_APP_DESCRIPTION: z.string().min(1),

      // Validação de Relays (Transforma a string em Array de URLs)
      VITE_NOSTR_DEV_RELAYS: csvToArray.optional(),
      VITE_NOSTR_RELAYS: csvToArray,
      VITE_NOSTR_SEARCH_RELAYS: csvToArray,

      // Coerção para número (trata "1" como 1)
      ENABLE_EXPERIMENTAL_COREPACK: z.coerce.number().optional(),

      // Validação de URLs e integrações opcionais
      VITE_NOSTR_BLOSSOM_FALLBACK: z.url(),
      VITE_PUBLIC_ROOT_DOMAIN: z.url(),
      VITE_BASE_URL: z.url().optional(),
      VITE_APP_IMGPROXY: z.url().optional(),
      VITE_APP_NOSTUBE_IMGPROXY: z.url().optional(),
      VITE_APP_IMAGE_PROXY_MODE: imageProxyMode.optional(),
      VITE_DUFFLEPUD_URL: z.url().optional(),
      VITE_BEACON_URL: z.url().optional(),
      VITE_SENTRY_DSN: z.string().optional(),
      VITE_NEXUS_P2P_RELAY_URL: z.url().optional(),
      VITE_NEXUS_P2P_ENABLED: z.string().optional(),
      VITE_BUILD_SOURCEMAP: z.string().optional(),
      VITE_APP_VERSION: z.string().optional(),

      // Coerção para número com valor padrão (Proof of Work)
      VITE_MIN_VIDEO_POW: z.coerce.number().optional().default(16),
      VITE_MIN_COMMENT_POW: z.coerce.number().optional().default(10),
      VITE_MIN_PLAYLIST_POW: z.coerce.number().optional().default(10),
      VITE_NOSTR_FEEDBACK_RECIPIENT_NPUB: z.string().optional().default(DEFAULT_FEEDBACK_RECIPIENT_NPUB),
      VITE_NOSTR_DEVELOPER_PUBKEY: z.string().optional(),
    },
  })
}
