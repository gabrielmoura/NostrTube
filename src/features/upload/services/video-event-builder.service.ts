import { imetaTagToTag } from "@nostr-dev-kit/ndk";
import { ulid } from "ulid";
import { nostrNow } from "@/helper/date";
import type { VideoMetadata } from "@/store/videoUpload/useVideoUploadStore";

export interface BuildAddressableVideoEventParams {
  draft: Partial<VideoMetadata>;
  currentPubkey: string;
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
  return [...videoVariants, ...audioTracks].map((imeta) => imetaTagToTag(imeta));
}

export function buildAddressableVideoEvent({
  draft,
  currentPubkey
}: BuildAddressableVideoEventParams) {
  if (!draft.title) {
    throw new Error("Title is required to publish a video event");
  }

  const appName = import.meta.env.VITE_APP_NAME || "NostrTube";
  const publishedAt = nostrNow();
  const identifier = buildIdentifier(appName);
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
