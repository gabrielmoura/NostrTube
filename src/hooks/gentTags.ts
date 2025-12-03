import { nostrNow } from "@/helper/date.ts";
import { nip19 } from "nostr-tools";
import { imetaTagToTag, NDKKind } from "@nostr-dev-kit/ndk";
import { ulid } from "ulid";
import type { VideoMetadata } from "@/routes/new/@components/VideoUpload.tsx";
import type { AgeEnum } from "@/store/store/sessionTypes.ts";

// --- Tipos e Interfaces ---

export interface GenTagsProps {
  videoData: Partial<VideoMetadata>;
  currentPubkey: string;
  hashtags?: string[];
  indexers?: string[];
  language?: string;
  thumb?: string;
  age?: AgeEnum;
}

// --- Configurações e Constantes ---

const CONFIG = {
  APP_NAME: import.meta.env.VITE_APP_NAME || "NostrTube",
  ROOT_DOMAIN: import.meta.env.VITE_PUBLIC_ROOT_DOMAIN || "https://nostr-tube.com",
  RELAYS: import.meta.env.PROD
    ? import.meta.env.VITE_NOSTR_RELAYS
    : import.meta.env.VITE_NOSTR_DEV_RELAYS
};

// --- Funções Auxiliares (Helpers) ---

/**
 * Gera a tag 'alt' para acessibilidade e retrocompatibilidade (NIP-31).
 */
function generateAltTag(identifier: string, pubkey: string, relays: string): string[] {
  const naddr = nip19.naddrEncode({
    identifier,
    kind: NDKKind.Video,
    pubkey,
    relays: relays.split(",")
  });

  return [
    "alt",
    `This is a video event and can be viewed at ${CONFIG.ROOT_DOMAIN}/v/${naddr}`
  ];
}

/**
 * Processa a tag 'imeta' (NIP-94/NIP-96), adicionando thumbnails se necessário.
 */
function generateImetaTag(videoData: Partial<VideoMetadata>, thumbFallback?: string): string[] | null {
  if (!videoData.imetaVideo) return null;

  const imetaTags = imetaTagToTag(videoData.imetaVideo);
  const activeThumb = videoData.thumbnail || thumbFallback;

  if (activeThumb) {
    // Adiciona thumb dentro do imeta para contexto do arquivo
    imetaTags.push(`thumb ${activeThumb}`);
    imetaTags.push(`image ${activeThumb}`);
  }

  // Marca explicitamente como serviço NIP-96 se aplicável
  imetaTags.push("service nip96");

  return imetaTags;
}

/**
 * Gera as tags padrão de identificação e metadados básicos.
 */
function generateBasicTags(d: string, videoData: Partial<VideoMetadata>): string[][] {
  const tags: string[][] = [
    ["d", `${CONFIG.APP_NAME}-${d}`],
    ["title", videoData.title || ""],
    ["summary", videoData.summary || ""],
    ["published_at", nostrNow().toString()]
  ];

  if (videoData.url && !videoData.imetaVideo) {
    tags.push(["imeta", `url ${videoData.url}`]);
  }

  return tags;
}

// --- Função Principal ---

/**
 * Gera a lista completa de tags para um evento de vídeo.
 * Esta é uma Pure Function, não necessita de Hooks do React.
 */
export function generateVideoTags({
                                    videoData,
                                    currentPubkey,
                                    hashtags = [],
                                    indexers = [],
                                    language,
                                    thumb,
                                    age
                                  }: GenTagsProps): string[][] {
  // Validações iniciais (Fail Fast)
  if (!currentPubkey || !videoData?.title) {
    console.warn("generateVideoTags: Missing required fields (pubkey or title)");
    return [];
  }

  const d = ulid();
  const tags: string[][] = [];

  // 1. Tags Básicas (d, title, summary, published_at)
  tags.push(...generateBasicTags(d, videoData));

  // 2. Alt Tag
  tags.push(generateAltTag(d, currentPubkey, CONFIG.RELAYS));

  // 3. Thumbnails (Tags de nível superior)
  const activeThumb = videoData.thumbnail || thumb;
  if (activeThumb) {
    tags.push(["thumb", activeThumb], ["image", activeThumb]);
  }

  // 4. Content Warning
  if (videoData.contentWarning) {
    tags.push(["content-warning", videoData.contentWarning]);
  }

  // 5. Hashtags e Indexadores
  hashtags.forEach((t) => tags.push(["t", t]));
  indexers.forEach((i) => tags.push(["i", i]));

  // 6. Imeta (NIP-94/NIP-96)
  const imetaTag = generateImetaTag(videoData, thumb);
  if (imetaTag) {
    tags.push(imetaTag);
  }

  // 7. Idioma
  const activeLanguage = language || videoData.language;
  if (activeLanguage) {
    tags.push(["l", activeLanguage, "ISO-639-1"]);
  }

  // 8. Idade Recomendável
  if (age) {
    tags.push(["age", age]);
  }

  return tags;
}