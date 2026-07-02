import type { VideoMetadata } from "@/store/videoUpload/useVideoUploadStore";
import { buildYouTubeThumbnailUrl, buildYouTubeWatchUrl } from "./youtube-url.service";

export interface BuildYouTubeVideoDraftParams {
  videoId: string;
  title: string;
  summary?: string;
  duration?: number;
  hashtags?: string[];
  indexers?: string[];
  contentWarning?: string;
  language?: string;
  geohash?: string;
}

export function buildYouTubeImetaTag(videoId: string, duration?: number): string[] {
  const canonicalUrl = buildYouTubeWatchUrl(videoId);
  const thumbnailUrl = buildYouTubeThumbnailUrl(videoId);

  const tag = [
    "imeta",
    `url ${canonicalUrl}`,
    `image ${thumbnailUrl}`,
    "m image/jpeg",
  ];

  if (duration && Number.isFinite(duration) && duration > 0) {
    tag.push(`duration ${duration}`);
  }

  return tag;
}

export function buildYouTubeAltTagText(videoId: string): string {
  return `Este formato de vídeo não é suportado por todos os players. Assista diretamente em: ${buildYouTubeWatchUrl(videoId)}`;
}

export function buildYouTubeVideoDraft({
  videoId,
  title,
  summary,
  duration,
  hashtags,
  indexers,
  contentWarning,
  language,
  geohash,
}: BuildYouTubeVideoDraftParams): Partial<VideoMetadata> {
  const canonicalUrl = buildYouTubeWatchUrl(videoId);
  const thumbnailUrl = buildYouTubeThumbnailUrl(videoId);

  return {
    url: canonicalUrl,
    title,
    summary,
    alt: buildYouTubeAltTagText(videoId),
    thumbnail: thumbnailUrl,
    mime_type: "image/jpeg",
    hashtags,
    indexers,
    contentWarning,
    language,
    geohash,
    rawImetaTags: [buildYouTubeImetaTag(videoId, duration)],
    // origin: {
    //   platform: "youtube",
    //   externalId: videoId,
    //   originalUrl: canonicalUrl,
    //   metadata: "metadata-only",
    // },
  };
}
