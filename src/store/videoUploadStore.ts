import { proxy } from "valtio";
import { devtools } from "valtio/utils";
import type { NDKImetaTag } from "@nostr-dev-kit/ndk-hooks";
import { AgeEnum } from "@/store/store/sessionTypes.ts";

export interface VideoMetadata {
  url: string;
  fallback: string[];
  title: string;
  summary: string;
  thumbnail: string;
  fileType: string;
  fileHash: string;
  fileSize: number;
  duration: number;
  hashtags: string[];
  indexers: string[];
  contentWarning: string;
  blurhash: string;
  dim: string;
  mime_type: string;
  imetaVideo: NDKImetaTag;
  imetaThumb: NDKImetaTag;
  imetaImage: NDKImetaTag;
  age: AgeEnum;
  language?: string;
  showEventInput: boolean; // Usado para importar vídeo de outros eventos
}

const initialState: Partial<VideoMetadata> = {
  showEventInput: false
};

export const newVideoStore = proxy<Partial<VideoMetadata>>(initialState);
devtools(newVideoStore, { name: "newVideoStore", enabled: import.meta.env.DEV });


export const resetVideoStore = () => {
  Object.keys(newVideoStore).forEach((key) => {
    if (!(key in initialState)) {
      delete (newVideoStore as any)[key];
    }
  });

  // Restaura os valores padrão
  Object.assign(newVideoStore, initialState);
};
