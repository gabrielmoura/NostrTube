import { imetaTagToTag } from "@nostr-dev-kit/ndk";
import { ulid } from "ulid";
import { nostrNow } from "@/helper/date";
import type { VideoMetadata } from "@/store/videoUpload/useVideoUploadStore";

export interface BuildAddressableVideoEventParams {
  draft: Partial<VideoMetadata>;
  currentPubkey: string;
  identifier?: string;
}

const ADDRESSABLE_VIDEO_KIND = 34235;

function normalizeTagValues(values?: string[]): string[] {
  if (!values) return [];
  return values.map((value) => value.trim()).filter(Boolean);
}

function buildIdentifier(appName: string): string {
  return `${appName}-video-${ulid()}`;
}

function buildImetaTags(draft: Partial<VideoMetadata>): string[][] {
  const videoVariants = draft.imetaVariants?.length
    ? draft.imetaVariants
    : draft.imetaVideo
      ? [draft.imetaVideo]
      : [];

  const audioTracks = draft.imetaAudioTracks ?? [];

  const imetas = [...videoVariants, ...audioTracks];
  if (imetas.length > 0) {
    return imetas.map((imeta) => imetaTagToTag(imeta));
  }

  if (!draft.url) {
    return [];
  }

  const syntheticImeta = {
    url: draft.url,
    m: draft.mime_type || draft.fileType || guessMimeTypeFromUrl(draft.url),
    x: draft.fileHash,
    image: draft.thumbnail,
    fallback: draft.fallback,
    duration: draft.duration ? String(draft.duration) : undefined,
    dim: draft.dim,
    size: draft.fileSize ? String(draft.fileSize) : undefined,
    blurhash: draft.blurhash
  };

  return [imetaTagToTag(syntheticImeta as never)];
}

function guessMimeTypeFromUrl(url: string): string | undefined {
  const normalized = url.toLowerCase();
  if (normalized.endsWith(".m3u8")) return "application/vnd.apple.mpegurl";
  if (normalized.endsWith(".mpd")) return "application/dash+xml";
  if (normalized.endsWith(".webm")) return "video/webm";
  if (normalized.endsWith(".mov")) return "video/quicktime";
  if (normalized.endsWith(".mp4")) return "video/mp4";
  return undefined;
}

export function buildAddressableVideoEvent({
  draft,
  currentPubkey,
  identifier: providedIdentifier
}: BuildAddressableVideoEventParams) {
  if (!draft.title) {
    throw new Error("Title is required to publish a video event");
  }

  const appName = import.meta.env.VITE_APP_NAME || "NostrTube";
  const publishedAt = nostrNow();
  const identifier = providedIdentifier || buildIdentifier(appName);
  const imetaTags = buildImetaTags(draft);

  if (imetaTags.length === 0) {
    throw new Error("At least one imeta tag is required to publish a video event");
  }

  const tags: string[][] = [
    ["d", identifier],
    ["title", draft.title],
    ["published_at", String(publishedAt)]
  ];

  if (draft.summary) {
    tags.push(["alt", draft.summary]);
  }

  tags.push(...imetaTags);

  const duration = draft.duration ?? draft.imetaVariants?.[0]?.duration ?? draft.imetaVideo?.duration;
  if (duration) {
    tags.push(["duration", String(duration)]);
  }

  if (draft.contentWarning) {
    tags.push(["content-warning", draft.contentWarning]);
  }

  if (draft.language) {
    tags.push(["l", draft.language, "ISO-639-1"]);
  }

  normalizeTagValues(draft.hashtags).forEach((tag) => {
    tags.push(["t", tag]);
  });

  normalizeTagValues(draft.indexers).forEach((indexer) => {
    tags.push(["i", indexer]);
  });

  if (draft.origin) {
    tags.push([
      "origin",
      draft.origin.platform,
      draft.origin.externalId,
      draft.origin.originalUrl,
      draft.origin.metadata ?? ""
    ]);
  }

  return {
    kind: ADDRESSABLE_VIDEO_KIND,
    content: draft.summary ?? "",
    created_at: publishedAt,
    pubkey: currentPubkey,
    tags,
    identifier
  };
}

export { ADDRESSABLE_VIDEO_KIND };
