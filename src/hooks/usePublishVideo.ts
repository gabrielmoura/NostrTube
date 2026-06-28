import { useMutation } from "@tanstack/react-query";
import { useNDK, useNDKCurrentUser } from "@nostr-dev-kit/ndk-hooks";
import { NDKEvent } from "@nostr-dev-kit/ndk";
import { nip19 } from "nostr-tools";
import { toast } from "sonner";
import { t } from "i18next";
import { makeEvent, type MakeEventParams } from "@/helper/pow/pow.ts";
import { LoggerAgent } from "@/lib/debug.ts";
import { type VideoMetadata, useVideoUploadStore } from "@/store/videoUpload/useVideoUploadStore.ts";
import { buildAddressableVideoEvent } from "@/features/upload/services/video-event-builder.service";
import { uploadToConfiguredBlossomServers } from "@/features/upload/services/blossom-server.service";
import {
  generateVideoThumbnailFromUrl,
  generateBlurhashFromImageFile,
  prepareVideoUploadAsset
} from "@/features/upload/services/local-media-processing.service";

const log = LoggerAgent.create("usePublishVideo");

export interface PublishedVideoResult {
  event: NDKEvent;
  naddr: string;
  shareUrl: string;
}

function isTemporaryUrl(url?: string) {
  return Boolean(url?.startsWith("blob:") || url?.startsWith("data:"));
}

function isValidImageUrl(url?: string) {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function applyThumbnailToDraft(draft: Partial<VideoMetadata>, thumbnailUrl: string, blurhash?: string): Partial<VideoMetadata> {
  const withImage = <T extends object | undefined>(imeta: T): T =>
    imeta
      ? ({
          ...imeta,
          image: thumbnailUrl,
          blurhash: blurhash ?? (imeta as { blurhash?: string }).blurhash,
          duration: draft.duration ? String(draft.duration) : (imeta as { duration?: string }).duration
        } as T)
      : imeta;

  return {
    ...draft,
    thumbnail: thumbnailUrl,
    blurhash: blurhash ?? draft.blurhash,
    imetaVideo: withImage(draft.imetaVideo),
    imetaVariants: draft.imetaVariants?.map((variant) => withImage(variant)),
  };
}

export function usePublishVideo() {
  const { ndk } = useNDK();
  const currentUser = useNDKCurrentUser();

  const mutation = useMutation({
    mutationKey: ["event:generate:new:video"],
    mutationFn: ({ ndk, event, difficulty }: MakeEventParams): Promise<NDKEvent> =>
      makeEvent({ ndk, event, difficulty }),
    onError: (error) => {
      log.error("Um erro encontrado", error);
      toast.error("Um erro encontrado");
    }
  });

  const resolveThumbnailBeforePublish = async (snap: Partial<VideoMetadata>): Promise<Partial<VideoMetadata>> => {
    const store = useVideoUploadStore.getState();
    const { thumbnailState, sourceVideoFile } = store;
    let thumbnailFile = thumbnailState.file;
    let thumbnailUrl = thumbnailState.remoteUrl || snap.thumbnail;
    let blurhash = snap.blurhash;

    if (thumbnailState.mode === "url") {
      const inputUrl = thumbnailState.inputUrl?.trim();
      if (!isValidImageUrl(inputUrl)) {
        throw new Error(t("invalid_thumbnail_url", "Enter a valid thumbnail URL before publishing."));
      }
      thumbnailUrl = inputUrl;
      store.setThumbnailRemoteUrl(inputUrl);
    }

    if (thumbnailState.mode === "auto" && !thumbnailFile && !thumbnailUrl && sourceVideoFile) {
      store.setThumbnailGenerating(true);
      store.setThumbnailError(undefined);
      try {
        const prepared = await prepareVideoUploadAsset(sourceVideoFile, {
          enableFFmpeg: true,
          generateThumbnail: true,
          thumbnailGenerationMode: "local",
        });
        thumbnailFile = prepared.thumbnailFile;
        if (prepared.duration && !snap.duration) {
          snap = { ...snap, duration: prepared.duration };
        }
        if (prepared.thumbnailPreviewUrl) {
          store.setThumbnailFile(thumbnailFile, prepared.thumbnailPreviewUrl);
        }
      } finally {
        store.setThumbnailGenerating(false);
      }
    }

    if (thumbnailState.mode === "auto" && !thumbnailFile && !thumbnailUrl && snap.url) {
      store.setThumbnailGenerating(true);
      store.setThumbnailError(undefined);
      try {
        const generated = await generateVideoThumbnailFromUrl(snap.url, snap.title || "video-thumbnail");
        thumbnailFile = generated.file;
        if (generated.duration && !snap.duration) {
          snap = { ...snap, duration: generated.duration };
        }
        store.setThumbnailFile(generated.file, generated.objectUrl);
      } catch (error) {
        const message = error instanceof Error ? error.message : t("thumbnail_generation_failed", "Could not generate a thumbnail automatically.");
        store.setThumbnailError(message);
        throw new Error(message);
      } finally {
        store.setThumbnailGenerating(false);
      }
    }

    if (thumbnailFile) {
      if (!ndk) throw new Error("NDK is required to upload thumbnail");
      store.setThumbnailUploading(true);
      const thumbnailUpload = await uploadToConfiguredBlossomServers({
        ndk,
        file: thumbnailFile,
        label: "thumbnail-upload-before-publish",
      });
      thumbnailUrl = thumbnailUpload.url;
      blurhash = await generateBlurhashFromImageFile(thumbnailFile) ?? blurhash;
      store.setThumbnailRemoteUrl(thumbnailUrl);
      store.setThumbnailUploading(false);
    }

    if (isTemporaryUrl(thumbnailUrl)) {
      throw new Error(t("temporary_thumbnail_url_error", "Thumbnail is still local. Upload it or use a public URL before publishing."));
    }

    if (!thumbnailUrl) {
      throw new Error(t("missing_thumbnail", "Resolve a thumbnail before publishing."));
    }

    return applyThumbnailToDraft(snap, thumbnailUrl, blurhash);
  };

  const publish = async (snap: Partial<VideoMetadata>): Promise<PublishedVideoResult | undefined> => {
    if (!ndk || !currentUser) return;
    if (!snap.url || !snap.title) {
      toast.warning(t("missing_fields", "Please fill in all required fields"));
      return;
    }

    try {
      const publishableSnap = await resolveThumbnailBeforePublish(snap);
      const addressableEvent = buildAddressableVideoEvent({
        draft: publishableSnap,
        currentPubkey: currentUser.pubkey
      });

      const event = await mutation.mutateAsync({
        ndk,
        event: {
          ...addressableEvent
        },
        difficulty: Number(import.meta.env.VITE_MIN_VIDEO_POW ?? 16)
      });

      await event.publish();

      const naddr = nip19.naddrEncode({
        identifier: event.dTag!,
        relays: import.meta.env.PROD
          ? import.meta.env.VITE_NOSTR_RELAYS
          : import.meta.env.VITE_NOSTR_DEV_RELAYS,
        pubkey: event.pubkey,
        kind: event.kind!
      });

      const shareUrl = `${import.meta.env.VITE_PUBLIC_ROOT_DOMAIN ?? location.origin}/v/${naddr}`;
      toast.success(t("video_published_successfully", "Video published successfully"));
      return { event, naddr, shareUrl };
    } catch (err) {
      log.error("error publishing event", err);
      const message = err instanceof Error ? err.message : t("error_publishing_video", "Error publishing video");
      useVideoUploadStore.getState().setThumbnailUploading(false);
      useVideoUploadStore.getState().setThumbnailGenerating(false);
      toast.error(message);
      return undefined;
    }
  };

  return {
    publish,
    isPending: mutation.isPending
  };
}
