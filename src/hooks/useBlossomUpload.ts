import { useEffect, useRef, useState } from "react";
import { useNDK } from "@nostr-dev-kit/ndk-hooks";
import { NDKBlossom } from "@nostr-dev-kit/ndk-blossom";
import { toast } from "sonner";
import { t } from "i18next";
import { generateBlurhashFromImageFile } from "@/features/upload/services/local-media-processing.service";

interface UseBlossomUploadOptions {
  onSuccess?: (url: string) => void;
  onError?: (error: Error) => void;
}

export function useBlossomUpload(options?: UseBlossomUploadOptions) {
  const { ndk } = useNDK();
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  // Referência estável para evitar recriação do NDK durante upload
  const ndkRef = useRef(ndk);
  useEffect(() => {
    ndkRef.current = ndk;
  }, [ndk]);

  const uploadFile = async (file: File) => {
    const ndkInstance = ndkRef.current;
    if (!ndkInstance) {
      toast.error("NDK not initialized");
      return;
    }

    setIsUploading(true);
    setProgress(0);

    const blossom = new NDKBlossom(ndkInstance);

    blossom.onUploadProgress = (p) => {
      const pct = Math.round((p.loaded / p.total) * 100);
      setProgress(pct);
      return "continue";
    };

    try {
      const blurhash = await generateBlurhashFromImageFile(file);
      const result = await blossom.upload(file, {
        fallbackServer: import.meta.env.VITE_NOSTR_BLOSSOM_FALLBACK
      });

      toast.success(t("upload_success", "File uploaded successfully"));
      if (result.url) {
        options?.onSuccess?.(result.url);
      }
      return { ...result, blurhash };
    } catch (error) {
      console.error("Blossom upload error:", error);
      toast.error(t("upload_error", "Upload failed"));
      options?.onError?.(error instanceof Error ? error : new Error("Upload failed"));
    } finally {
      setIsUploading(false);
    }
  };

  return { uploadFile, isUploading, progress };
}
