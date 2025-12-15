import { nostrNow } from "@/helper/date.ts";
import { nip19 } from "nostr-tools";
import { imetaTagToTag, NDKKind } from "@nostr-dev-kit/ndk";
import { ulid } from "ulid";
import type { VideoMetadata } from "@/store/videoUploadStore.ts";

// --- Tipos ---

export interface GenTagsProps extends Partial<VideoMetadata> {
  currentPubkey: string;
}

interface AppConfig {
  appName: string;
  rootDomain: string;
  relays: string[];
}

// --- Configuração Centralizada ---

const getConfig = (): AppConfig => {
  const relaysString = import.meta.env.PROD
    ? import.meta.env.VITE_NOSTR_RELAYS
    : import.meta.env.VITE_NOSTR_DEV_RELAYS;

  return {
    appName: import.meta.env.VITE_APP_NAME || "NostrTube",
    rootDomain: import.meta.env.VITE_PUBLIC_ROOT_DOMAIN || "https://nostr-tube.com",
    relays: (relaysString || "").split(",").filter(Boolean),
  };
};

// --- Geradores de Tags Específicos (Helpers Puros) ---

/**
 * Gera o identificador único (d-tag) para o vídeo.
 */
function generateIdentifier(appName: string): string {
  return `${appName}-${ulid()}`;
}

/**
 * Gera a tag 'alt' (NIP-31) para clientes que não suportam Kind Video.
 */
function generateAltTag(identifier: string, pubkey: string, config: AppConfig): string[] {
  const naddr = nip19.naddrEncode({
    identifier,
    kind: NDKKind.Video,
    pubkey,
    relays: config.relays,
  });

  return [
    "alt",
    `This is a video event and can be viewed at ${config.rootDomain}/v/${naddr}`,
  ];
}

/**
 * Processa metadados de mídia (NIP-94) e anexa informações de thumbnail/imagem.
 */
function generateImetaTags(videoData: Partial<VideoMetadata>, thumbFallback?: string): string[] | null {
  // Se não houver dados estruturados de imeta, tentamos criar um básico se houver URL
  if (!videoData.imetaVideo) {
    if (videoData.url) {
      return ["imeta", `url ${videoData.url}`];
    }
    return null;
  }

  const imetaTags = imetaTagToTag(videoData.imetaVideo);
  const activeThumb = videoData.thumbnail || thumbFallback;

  // Garante que a thumbnail esteja presente nos metadados do arquivo
  if (activeThumb) {
    // Verifica se já não existe para evitar duplicata (opcional, mas boa prática)
    const hasThumb = imetaTags.some(t => t.startsWith("thumb "));
    if (!hasThumb) imetaTags.push(`thumb ${activeThumb}`);

    const hasImage = imetaTags.some(t => t.startsWith("image "));
    if (!hasImage) imetaTags.push(`image ${activeThumb}`);
  }

  // Indica compatibilidade com fluxo de upload NIP-96
  imetaTags.push("service nip96");

  return imetaTags;
}

/**
 * Gera tags de categorização e busca (Hashtags, Indexers, Idioma, Idade).
 */
function generateCategoryTags(props: GenTagsProps): string[][] {
  const tags: string[][] = [];

  // Hashtags (t)
  if (props.hashtags) {
    props.hashtags.forEach((t) => tags.push(["t", t]));
  }

  // Indexers (i) - ex: imdb, mal
  if (props.indexers) {
    props.indexers.forEach((i) => tags.push(["i", i]));
  }

  // Idioma (l)
  if (props.language) {
    tags.push(["l", props.language, "ISO-639-1"]);
  }

  // Classificação Etária (age)
  if (props.age) {
    tags.push(["age", props.age]);
  }

  // Aviso de Conteúdo (content-warning)
  if (props.contentWarning) {
    tags.push(["content-warning", props.contentWarning]);
  }

  return tags;
}

// --- Função Principal ---

/**
 * Gera a lista completa de tags para um evento de vídeo Nostr (Kind 1063).
 * Função pura: Input -> Output determinístico.
 */
export function generateVideoTags(props: GenTagsProps): string[][] {
  const { currentPubkey, title, thumbnail, summary, ...videoData } = props;

  // Validação Fail-Fast
  if (!currentPubkey || !title) {
    console.error("[generateVideoTags] Missing required fields: pubkey or title");
    throw new Error("Missing required fields to generate video tags");
  }

  const config = getConfig();
  const dTagValue = generateIdentifier(config.appName);
  const tags: string[][] = [];

  // 1. Tags Identificadoras e Descritivas Básicas
  tags.push(
    ["d", dTagValue],
    ["title", title],
    ["summary", summary || ""],
    ["published_at", nostrNow().toString()]
  );

  // 2. Thumbnail Global (nível do evento)
  if (thumbnail) {
    tags.push(["thumb", thumbnail]);
    tags.push(["image", thumbnail]);
  }

  // 3. Imeta (Metadados do arquivo de vídeo)
  const imetaTag = generateImetaTags({ ...videoData, thumbnail }, thumbnail);
  if (imetaTag) {
    tags.push(imetaTag);
  }

  // 4. Tags de Categoria e Metadados (Hashtags, Language, etc)
  tags.push(...generateCategoryTags(props));

  // 5. Acessibilidade / Retrocompatibilidade (Alt Tag)
  tags.push(generateAltTag(dTagValue, currentPubkey, config));

  return tags;
}