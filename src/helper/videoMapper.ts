import type { NDKEvent } from "@nostr-dev-kit/ndk";
import { mapImetaTag } from "@nostr-dev-kit/ndk";
import { getTags, getTagValue } from "@welshman/util";
import { extractTag } from "@/helper/extractTag.ts";
import type { VideoMetaTypes } from "@/store/store/videoSession.ts";

export function mapEventToVideoMeta(event: NDKEvent): Partial<VideoMetaTypes> {
  const tEvent = extractTag(event.tags);
  const imetaTags = getTags("imeta", event.tags);

  let url = tEvent.url ?? getTagValue("src", event.tags);
  let image = tEvent.image;
  let fallbacks: string[] | undefined;

  // Prioriza dados do imeta se existirem
  if (imetaTags.length > 0) {
    imetaTags.forEach((tag) => {
      const imeta = mapImetaTag(tag);
      if (imeta.url) url = imeta.url;
      if (imeta.image) image = imeta.image;
      if (imeta.fallback) fallbacks = imeta.fallback;
    });
  }

  return {
    event,
    title: tEvent.title,
    summary: tEvent.summary,
    url,
    identification: event.dTag,
    image,
    fallbacks,
  };
}