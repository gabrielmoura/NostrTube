import { useEffect, useRef, useState } from "react";
import { useNDK } from "@nostr-dev-kit/ndk-hooks";
import { NDKBlossom } from "@nostr-dev-kit/ndk-blossom";
import type { UnsignedEvent } from "nostr-tools/core";
import { getEventHash } from "nostr-tools/pure";
import { toast } from "sonner";
import { t } from "i18next";

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

    // Configuração do Signer customizado (necessário para alguns fluxos de auth do Blossom)
    blossom.signer = {
      signEvent: async (draft) => {
        const event = { ...draft, pubkey: ndkInstance.activeUser?.pubkey } as UnsignedEvent;
        const sig = await ndkInstance.signer!.sign(event);
        return { ...event, sig, id: getEventHash(event) };
      }
    };

    blossom.onUploadProgress = (p) => {
      const pct = Math.round((p.loaded / p.total) * 100);
      setProgress(pct);
      return "continue";
    };

    try {
      const result = await blossom.upload(file, {
        fallbackServer: import.meta.env.VITE_NOSTR_BLOSSOM_FALLBACK
      });

      toast.success(t("upload_success", "File uploaded successfully"));
      options?.onSuccess?.(result.url);
      return result.url;
    } catch (error: any) {
      console.error("Blossom upload error:", error);
      toast.error(t("upload_error", "Upload failed"));
      options?.onError?.(error);
    } finally {
      setIsUploading(false);
    }
  };

  return { uploadFile, isUploading, progress };
}