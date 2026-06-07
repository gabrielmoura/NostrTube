import { getTags } from "@welshman/util";

export interface MediaCandidate {
  url: string;
  mimeType?: string;
  isPrimary: boolean;
}

export interface VideoVariant {
  id: string;
  dimension?: string;
  mimeType?: string;
  bitrate?: number;
  duration?: number;
  hash?: string;
  blurhash?: string;
  posterUrls: string[];
  candidates: MediaCandidate[];
}

export interface AudioTrackVariant {
  id: string;
  language?: string;
  isOriginalVersion: boolean;
  mimeType?: string;
  bitrate?: number;
  duration?: number;
  waveform?: string;
  candidates: MediaCandidate[];
}

export interface VideoAssetSet {
  variants: VideoVariant[];
  audioTracks: AudioTrackVariant[];
}

interface ParsedImetaTag {
  url?: string;
  mimeType?: string;
  dimension?: string;
  blurhash?: string;
  hash?: string;
  duration?: number;
  bitrate?: number;
  waveform?: string;
  language?: string;
  isOriginalVersion: boolean;
  images: string[];
  fallbacks: string[];
}

const STREAM_MIME_PRIORITIES: Record<string, number> = {
  "application/x-mpegurl": 0,
  "application/vnd.apple.mpegurl": 0,
  "video/mp4": 1
};

function parseFloatSafe(value?: string): number | undefined {
  if (!value) return undefined;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseIntSafe(value?: string): number | undefined {
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseLanguage(value?: string): { language?: string; isOriginalVersion: boolean } {
  if (!value) {
    return { language: undefined, isOriginalVersion: false };
  }

  const tokens = value.split(/\s+/).filter(Boolean);
  return {
    language: tokens[0],
    isOriginalVersion: tokens.includes("ov")
  };
}

function parseImetaTag(values: string[]): ParsedImetaTag {
  const parsed: ParsedImetaTag = {
    isOriginalVersion: false,
    images: [],
    fallbacks: []
  };

  for (const value of values) {
    const separatorIndex = value.indexOf(" ");
    if (separatorIndex <= 0) continue;

    const key = value.slice(0, separatorIndex);
    const rawValue = value.slice(separatorIndex + 1).trim();
    if (!rawValue) continue;

    switch (key) {
      case "url":
        parsed.url = rawValue;
        break;
      case "m":
        parsed.mimeType = rawValue.toLowerCase();
        break;
      case "dim":
        parsed.dimension = rawValue;
        break;
      case "image":
        parsed.images.push(rawValue);
        break;
      case "fallback":
        parsed.fallbacks.push(rawValue);
        break;
      case "x":
        parsed.hash = rawValue;
        break;
      case "blurhash":
        parsed.blurhash = rawValue;
        break;
      case "bitrate":
        parsed.bitrate = parseIntSafe(rawValue);
        break;
      case "duration":
        parsed.duration = parseFloatSafe(rawValue);
        break;
      case "waveform":
        parsed.waveform = rawValue;
        break;
      case "l": {
        const languageInfo = parseLanguage(rawValue);
        parsed.language = languageInfo.language;
        parsed.isOriginalVersion = languageInfo.isOriginalVersion;
        break;
      }
    }
  }

  return parsed;
}

function isAudioTrackTag(tag: ParsedImetaTag): boolean {
  return Boolean(
    tag.mimeType?.startsWith("audio/") ||
    tag.language ||
    tag.waveform
  );
}

function createCandidates(tag: ParsedImetaTag): MediaCandidate[] {
  const candidates: MediaCandidate[] = [];

  if (tag.url) {
    candidates.push({
      url: tag.url,
      mimeType: tag.mimeType,
      isPrimary: true
    });
  }

  for (const fallback of tag.fallbacks) {
    candidates.push({
      url: fallback,
      mimeType: tag.mimeType,
      isPrimary: false
    });
  }

  return candidates;
}

function sortVariants(a: VideoVariant, b: VideoVariant): number {
  const aMime = a.mimeType ?? "";
  const bMime = b.mimeType ?? "";
  const aPriority = STREAM_MIME_PRIORITIES[aMime] ?? 9;
  const bPriority = STREAM_MIME_PRIORITIES[bMime] ?? 9;

  if (aPriority !== bPriority) return aPriority - bPriority;

  const aBitrate = a.bitrate ?? 0;
  const bBitrate = b.bitrate ?? 0;
  return bBitrate - aBitrate;
}

export function getDimensionLabel(variant: VideoVariant): string {
  if (variant.dimension) return variant.dimension;
  if (variant.mimeType) return variant.mimeType;
  return "default";
}

export function getPreferredVariant(variants: VideoVariant[]): VideoVariant | null {
  if (variants.length === 0) return null;
  return [...variants].sort(sortVariants)[0] ?? null;
}

export function normalizeVideoEventAssets(tags: string[][]): VideoAssetSet {
  const imetaTags = getTags("imeta", tags);
  const variants: VideoVariant[] = [];
  const audioTracks: AudioTrackVariant[] = [];

  imetaTags.forEach((tag, index) => {
    const parsed = parseImetaTag(tag.slice(1));
    const candidates = createCandidates(parsed);
    if (candidates.length === 0) return;

    if (isAudioTrackTag(parsed)) {
      audioTracks.push({
        id: `audio-${index}`,
        language: parsed.language,
        isOriginalVersion: parsed.isOriginalVersion,
        mimeType: parsed.mimeType,
        bitrate: parsed.bitrate,
        duration: parsed.duration,
        waveform: parsed.waveform,
        candidates
      });
      return;
    }

    variants.push({
      id: `video-${index}`,
      dimension: parsed.dimension,
      mimeType: parsed.mimeType,
      bitrate: parsed.bitrate,
      duration: parsed.duration,
      hash: parsed.hash,
      blurhash: parsed.blurhash,
      posterUrls: parsed.images,
      candidates
    });
  });

  return {
    variants: variants.sort(sortVariants),
    audioTracks
  };
}
