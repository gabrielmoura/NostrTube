import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
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

const DRAFT_KEY = "video-upload-draft";

interface VideoUploadState {
  // Dados do vídeo
  videoData: Partial<VideoMetadata>;
  indexers: string[];
  hashtags: string[];
  thumb?: string;
  language?: string;

  // Estados de UI
  isUploading: boolean;
  uploadProgress: number;
  uploadStage: "idle" | "validating" | "uploading" | "mirroring" | "complete" | "error";
  error?: string;

  // Ações
  setVideoData: (data: Partial<VideoMetadata>) => void;
  setIndexers: (indexers: string[]) => void;
  setHashtags: (hashtags: string[]) => void;
  setThumb: (thumb?: string) => void;
  setLanguage: (language?: string) => void;
  setUploadingState: (isUploading: boolean) => void;
  setUploadProgress: (progress: number) => void;
  setUploadStage: (stage: VideoUploadState["uploadStage"]) => void;
  setError: (error?: string) => void;
  resetForm: () => void;

  // Ações de Persistência Manual
  saveDraft: () => void;
  loadDraft: () => void;
}

const initialState = {
  videoData: {},
  indexers: [],
  hashtags: [],
  thumb: undefined,
  language: undefined,
  isUploading: false,
  uploadProgress: 0,
  uploadStage: "idle" as const,
  error: undefined
};

export const useVideoUploadStore = create<VideoUploadState>()(
  devtools(
    immer((set, get) => ({
      ...initialState,

      setVideoData: (data) =>
        set((state) => {
          state.videoData = { ...state.videoData, ...data };
        }, false, "video/setVideoData"),

      setIndexers: (indexers) =>
        set((state) => {
          state.indexers = indexers;
        }, false, "video/setIndexers"),

      setHashtags: (hashtags) =>
        set((state) => {
          state.hashtags = hashtags;
        }, false, "video/setHashtags"),

      setThumb: (thumb) =>
        set((state) => {
          state.thumb = thumb;
        }, false, "video/setThumb"),

      setLanguage: (language) =>
        set((state) => {
          state.language = language;
        }, false, "video/setLanguage"),

      setUploadingState: (isUploading) =>
        set((state) => {
          state.isUploading = isUploading;
        }, false, "ui/setUploadingState"),

      setUploadProgress: (progress) =>
        set((state) => {
          state.uploadProgress = progress;
        }, false, "ui/setUploadProgress"),

      setUploadStage: (stage) =>
        set((state) => {
          state.uploadStage = stage;
        }, false, "ui/setUploadStage"),

      setError: (error) =>
        set((state) => {
          state.error = error;
        }, false, "ui/setError"),

      resetForm: () => {
        localStorage.removeItem(DRAFT_KEY);
        set((state) => {
          Object.assign(state, initialState);
        }, false, "video/resetForm");
      },

      saveDraft: () => {
        const { videoData, indexers, hashtags, thumb, language } = get();
        const draft = JSON.stringify({ videoData, indexers, hashtags, thumb, language });
        localStorage.setItem(DRAFT_KEY, draft);
        console.log("Rascunho salvo com sucesso!");
      },

      loadDraft: () => {
        const draft = localStorage.getItem(DRAFT_KEY);
        if (draft) {
          try {
            const parsed = JSON.parse(draft);
            set((state) => {
              state.videoData = parsed.videoData || {};
              state.indexers = parsed.indexers || [];
              state.hashtags = parsed.hashtags || [];
              state.thumb = parsed.thumb;
              state.language = parsed.language;
            }, false, "video/loadDraft");
          } catch (e) {
            console.error("Falha ao carregar rascunho:", e);
          }
        }
      }
    })),
    { name: "VideoUploadStore" }
  )
);