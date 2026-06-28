import type { NDKEvent } from "@nostr-dev-kit/ndk";
import { formatDuration } from "@/helper/date";
import { extractTag } from "@/helper/extractTag";
import { normalizeVideoEventAssets } from "@/features/video/services/video-imeta.service";

export function getVideoDurationSeconds(event: NDKEvent): number | undefined {
  const tagData = extractTag(event.tags);

  if (typeof tagData.duration === "number") {
    return tagData.duration;
  }

  const imetaDuration = tagData.imeta.find((meta) => typeof meta.duration === "number")?.duration;
  if (typeof imetaDuration === "number") {
    return imetaDuration;
  }

  const assetSet = normalizeVideoEventAssets(event.tags);
  return assetSet.variants.find((variant) => typeof variant.duration === "number")?.duration;
}

export function getFormattedVideoDuration(event: NDKEvent): string | null {
  return formatDuration(getVideoDurationSeconds(event));
}
