import { z } from "zod";
import { ValidateEnv } from "@julr/vite-plugin-validate-env";

// Helper para validar e transformar strings separadas por vírgula em Array
const csvToArray = z.string()
  .transform((str) => str.split(",").map(s => s.trim()).filter(Boolean));

export default function envSchemaValidate() {
  return ValidateEnv({
    validator: "standard",
    schema: {
      VITE_APP_NAME: z.string().min(1),
      VITE_APP_DESCRIPTION: z.string().min(1),

      // Validação de Relays (Transforma a string em Array de URLs)
      VITE_NOSTR_DEV_RELAYS: csvToArray.optional(),
      VITE_NOSTR_RELAYS: csvToArray,
      VITE_NOSTR_SEARCH_RELAYS: csvToArray,

      // Coerção para número (trata "1" como 1)
      ENABLE_EXPERIMENTAL_COREPACK: z.coerce.number().optional(),

      // Validação de URLs
      VITE_NOSTR_BLOSSOM_FALLBACK: z.url(),
      VITE_PUBLIC_ROOT_DOMAIN: z.url(),
      VITE_APP_IMGPROXY: z.url().optional(),
      VITE_DUFFLEPUD_URL: z.url().optional()
    }
  });
}