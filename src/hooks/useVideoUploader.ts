import { useCallback, useEffect, useRef, useState } from "react";
import { useNDK } from "@nostr-dev-kit/ndk-hooks";
import { NDKBlossom } from "@nostr-dev-kit/ndk-blossom";
import { toast } from "sonner";
import { t } from "i18next";
import { LoggerAgent } from "@/lib/debug.ts";
import { useVideoUploadStore } from "@/store/videoUpload/useVideoUploadStore.ts";
import { generateBlurhashFromImageFile, generateVideoThumbnailLocally } from "@/features/upload/services/local-media-processing.service";
import { requestDvmThumbnails } from "@/features/upload/services/dvm-thumbnail.service";


const logger = LoggerAgent.create("useVideoUploader");

export function useVideoUploader() {
  const { ndk } = useNDK();
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState<number>(0);
  const [errorCount, setErrorCount] = useState(0);
  const ndkRef = useRef(ndk);

  const setVideoUpload = useVideoUploadStore((s) => s.setVideoUpload);
  const setShowEventInput = useVideoUploadStore((s) => s.setShowEventInput);

  useEffect(() => {
    ndkRef.current = ndk;
  }, [ndk]);

  const upload = useCallback(async (file: File) => {
    const ndkInstance = ndkRef.current;
    if (!ndkInstance) return;

    setIsLoading(true);
    setProgress(0);
    setErrorCount(0);

    const blossom = new NDKBlossom(ndkInstance);
    blossom.debug = import.meta.env.DEV;

    // Configuração de Callbacks
    blossom.onUploadProgress = (p) => {
      const percentage = Math.round((p.loaded / p.total) * 100);
      setProgress(percentage);
      return "continue";
    };

    blossom.onUploadFailed = (err) => {
      logger.error("Upload failed", err);
      setErrorCount((prev) => prev + 1);
      toast.error(`${t("Upload_failed")}: ${String(err)}`);
    };

    try {
      const imeta = await blossom.upload(file, {
        fallbackServer: import.meta.env.VITE_NOSTR_BLOSSOM_FALLBACK || undefined
      });

      let thumbnailUrl: string | undefined;
      let blurhash = imeta.blurhash || undefined;
      let dim = imeta.dim || undefined;
      let duration = imeta.duration || undefined;

      if (file.type.startsWith("video/")) {
        try {
          const generated = await generateVideoThumbnailLocally(file);
          const thumbnailUpload = await blossom.upload(generated.file, {
            fallbackServer: import.meta.env.VITE_NOSTR_BLOSSOM_FALLBACK || undefined
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
        title: file.name,
        fileType: file.type,
        fileHash: imeta.sha256 as string,
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

      toast.success(t("upload_success", "File uploaded successfully"));
      setShowEventInput(false);

    } catch (error) {
      logger.error("Fatal upload error", error);
      toast.error(t("upload_error", "Error during file upload"));
      setErrorCount((prev) => prev + 1);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { upload, isLoading, progress, errorCount };
}
