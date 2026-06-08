import { useCallback, useEffect, useRef } from "react";
import { useNDK } from "@nostr-dev-kit/ndk-hooks";
import { toast } from "sonner";
import { t } from "i18next";
import { LoggerAgent } from "@/lib/debug.ts";
import { useVideoUploadStore } from "@/store/videoUpload/useVideoUploadStore.ts";
import { generateBlurhashFromImageFile, generateVideoThumbnailLocally } from "@/features/upload/services/local-media-processing.service";
import { requestDvmThumbnails } from "@/features/upload/services/dvm-thumbnail.service";
import { uploadToConfiguredBlossomServers } from "@/features/upload/services/blossom-server.service";

const logger = LoggerAgent.create("useVideoUploader");

export function useVideoUploader() {
  const { ndk } = useNDK();
  const ndkRef = useRef(ndk);

  const setVideoUpload = useVideoUploadStore((s) => s.setVideoUpload);
  const setShowEventInput = useVideoUploadStore((s) => s.setShowEventInput);
  const setUploadingState = useVideoUploadStore((s) => s.setUploadingState);
  const setUploadProgress = useVideoUploadStore((s) => s.setUploadProgress);
  const setUploadStage = useVideoUploadStore((s) => s.setUploadStage);
  const setError = useVideoUploadStore((s) => s.setError);
  const isLoading = useVideoUploadStore((s) => s.isUploading);
  const progress = useVideoUploadStore((s) => s.uploadProgress);
  const uploadStage = useVideoUploadStore((s) => s.uploadStage);

  useEffect(() => {
    ndkRef.current = ndk;
  }, [ndk]);

  const upload = useCallback(async (file: File) => {
    const ndkInstance = ndkRef.current;
    if (!ndkInstance) return;

    setUploadingState(true);
    setUploadProgress(0);
    setUploadStage("validating");
    setError(undefined);

    const handleProgress = (p: { loaded: number; total: number }) => {
      const percentage = Math.round((p.loaded / p.total) * 100);
      setUploadStage("uploading");
      setUploadProgress(percentage);
    };

    try {
      const imeta = await uploadToConfiguredBlossomServers({
        ndk: ndkInstance,
        file,
        onProgress: handleProgress,
        onMirroringStart: () => setUploadStage("mirroring"),
        label: "video-upload"
      });

      let thumbnailUrl: string | undefined;
      let blurhash = imeta.blurhash || undefined;
      let dim = imeta.dim || undefined;
      let duration = imeta.duration || undefined;

      if (file.type.startsWith("video/")) {
        try {
          setUploadStage("processing");
          const generated = await generateVideoThumbnailLocally(file);
          const thumbnailUpload = await uploadToConfiguredBlossomServers({
            ndk: ndkInstance,
            file: generated.file,
            onMirroringStart: () => setUploadStage("mirroring"),
            label: "thumbnail-upload"
          });
          thumbnailUrl = thumbnailUpload.url;
          blurhash = await generateBlurhashFromImageFile(generated.file);
          dim = `${generated.width}x${generated.height}`;
          duration = String(generated.duration || duration || "");
        } catch (error) {
          logger.error("Local thumbnail generation failed", error);
          try {
            const dvmResult = await requestDvmThumbnails({
              ndk: ndkInstance,
              videoUrl: imeta.url!,
              requesterPubkey: ndkInstance.activeUser!.pubkey
            });
            thumbnailUrl = dvmResult?.thumbnails[0];
            dim = dvmResult?.dim || dim;
            duration = dvmResult?.duration || duration;
          } catch (dvmError) {
            logger.error("DVM thumbnail generation failed", dvmError);
          }
        }
      }

      const fallbackUrls = imeta.fallback ?? [];

      setVideoUpload({
        url: imeta.url,
        fallback: fallbackUrls,
        title: file.name,
        fileType: file.type,
        fileHash: (imeta.sha256 || imeta.x) as string,
        fileSize: imeta.size ? parseInt(imeta.size) : undefined,
        blurhash,
        dim,
        duration: duration ? Number(duration) : undefined,
        mime_type: imeta.m || undefined,
        thumbnail: thumbnailUrl,
        imetaVideo: {
          ...imeta,
          image: thumbnailUrl,
          blurhash,
          dim,
          duration,
          fallback: fallbackUrls
        },
        imetaVariants: [{
          ...imeta,
          image: thumbnailUrl,
          blurhash,
          dim,
          duration,
          fallback: fallbackUrls
        }]
      });

      setUploadStage("complete");
      setUploadProgress(100);
      toast.success(t("upload_success", "File uploaded successfully"));
      setShowEventInput(false);
    } catch (error) {
      logger.error("Fatal upload error", error);
      setUploadStage("error");
      setError(error instanceof Error ? error.message : String(error));
      toast.error(t("upload_error", "Error during file upload"));
    } finally {
      setUploadingState(false);
    }
  }, [setError, setShowEventInput, setUploadProgress, setUploadStage, setUploadingState, setVideoUpload]);

  return { upload, isLoading, progress, uploadStage };
}
