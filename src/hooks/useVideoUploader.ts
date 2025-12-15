import { useState, useCallback, useRef, useEffect } from "react";
import { useNDK } from "@nostr-dev-kit/ndk-hooks";
import { NDKBlossom } from "@nostr-dev-kit/ndk-blossom";
import type { NDKImetaTag } from "@nostr-dev-kit/ndk";
import { FileUploader } from "@/helper/blossom/BlossomUpload.ts";
import { getEventHash } from "nostr-tools/pure";
import type { UnsignedEvent } from "nostr-tools/core";
import { toast } from "sonner";
import { t } from "i18next";
import { LoggerAgent } from "@/lib/debug.ts";
import useUserStore from "@/store/useUserStore.ts";
import { newVideoStore } from "@/store/videoUploadStore.ts";

const logger = LoggerAgent.create("useVideoUploader");

export function useVideoUploader() {
  const { ndk } = useNDK();
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState<number>(0);
  const [errorCount, setErrorCount] = useState(0);
  const session = useUserStore((state) => state?.session);
  const ndkRef = useRef(ndk);

  useEffect(() => {
    ndkRef.current = ndk;
  }, [ndk]);

  const upload = useCallback(async (file: File) => {
    const ndkInstance = ndkRef.current;
    if (!ndkInstance) return;

    setIsLoading(true);
    setProgress(0);
    setErrorCount(0);

    const myBlossom = new FileUploader();
    // Configuração do Signer
    myBlossom.signer = {
      signEvent: async (draft) => {
        const event: UnsignedEvent = { ...draft, pubkey: ndkInstance.activeUser!.pubkey };
        const sig = await ndkInstance.signer!.sign(event);
        return { ...event, sig, id: getEventHash(event) };
      },
    };

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
      toast.error(`${t("Upload_failed")}: ${err.message}`);
    };

    try {
      const imeta = await blossom.upload(file, {
        fallbackServer: import.meta.env.VITE_NOSTR_BLOSSOM_FALLBACK || undefined,
      });

      // Mirror Logic
      const mirrorSet = new Set<NDKImetaTag>();
      try {
        const mirrors = await myBlossom.mirrorBlob(imeta.url, session?.mirrors || []);
        mirrors.forEach((m) => mirrorSet.add(m.url as NDKImetaTag));
      } catch (e) {
        logger.error("Mirror error", e);
      }

      // Update Store
      const { url, sha256, size, blurhash, dim, m, uploaded, type, owner } = imeta;

      newVideoStore.url = url;
      newVideoStore.title = file.name;
      newVideoStore.fileType = file.type;
      newVideoStore.fileHash = sha256;
      newVideoStore.fileSize = size;
      newVideoStore.blurhash = blurhash || undefined;
      newVideoStore.dim = dim || undefined;
      newVideoStore.mime_type = m || undefined;
      newVideoStore.imetaVideo = {
        ...imeta,
        fallback: Array.from(mirrorSet).map((t) => t.url).filter((u) => u !== url),
      };

      toast.success(t("upload_success", "File uploaded successfully"));
      newVideoStore.showEventInput = false;

    } catch (error) {
      logger.error("Fatal upload error", error);
      toast.error(t("upload_error", "Error during file upload"));
      setErrorCount((prev) => prev + 1);
    } finally {
      setIsLoading(false);
    }
  }, [session?.mirrors]);

  return { upload, isLoading, progress, errorCount };
}