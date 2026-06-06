import { mapImetaTag } from "@nostr-dev-kit/ndk";
import type { NDKEvent } from "@nostr-dev-kit/ndk";
import { getTagValue, getTagValues, getTags } from "@welshman/util";
import type { VideoMetadata } from "@/store/videoUpload/useVideoUploadStore";

export function extractEditableVideoDraft(event: NDKEvent): Partial<VideoMetadata> & { identifier?: string } {
  const imetaTags = getTags("imeta", event.tags).map((tag) => mapImetaTag(tag));
  const primaryImeta = imetaTags[0];

  return {
    title: getTagValue("title", event.tags) || getTagValue("name", event.tags) || "",
    summary: getTagValue("summary", event.tags) || event.content || "",
    thumbnail: primaryImeta?.image ? (Array.isArray(primaryImeta.image) ? primaryImeta.image[0] : primaryImeta.image) : getTagValue("thumb", event.tags) || getTagValue("image", event.tags) || "",
    url: primaryImeta?.url || getTagValue("url", event.tags) || "",
    hashtags: getTagValues("t", event.tags),
    indexers: getTagValues("i", event.tags),
    contentWarning: getTagValue("content-warning", event.tags) || "",
    language: getTagValue("l", event.tags) || undefined,
    duration: Number(primaryImeta?.duration || getTagValue("duration", event.tags) || 0) || undefined,
    mime_type: primaryImeta?.m,
    fileHash: primaryImeta?.x,
    fallback: primaryImeta?.fallback,
    imetaVideo: primaryImeta as never,
    imetaVariants: imetaTags as never,
    identifier: event.dTag || getTagValue("d", event.tags) || undefined
  };
}

export function applyDraftToImeta(draft: Partial<VideoMetadata>) {
  const variants = draft.imetaVariants?.length ? draft.imetaVariants : draft.imetaVideo ? [draft.imetaVideo] : [];

  if (!variants.length && draft.url) {
    return [{ url: draft.url, image: draft.thumbnail, fallback: draft.fallback, m: draft.mime_type, x: draft.fileHash }];
  }

  return variants.map((variant, index) => {
    if (index > 0) return variant;
    return {
      ...variant,
      url: draft.url || variant.url,
      image: draft.thumbnail || variant.image,
      fallback: draft.fallback || variant.fallback,
      m: draft.mime_type || variant.m,
      x: draft.fileHash || variant.x
    };
  });
}
