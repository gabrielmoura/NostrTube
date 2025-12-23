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

}

const DRAFT_KEY = "video-upload-draft";

export interface VideoUploadState {
  // Dados do vídeo
  videoData: Partial<VideoMetadata>;

  // Estados de UI
  isUploading: boolean;
  uploadProgress: number;
  uploadStage: "idle" | "validating" | "uploading" | "mirroring" | "complete" | "error";
  error?: string;
  showEventInput: boolean; // Usado para importar vídeo de outros eventos

  // Ações
  setVideoData: (data: Partial<VideoMetadata>) => void;
  setIndexers: (indexers: string[]) => void;
  setHashtags: (hashtags: string[]) => void;
  setLanguage: (language?: string) => void;
  setUploadingState: (isUploading: boolean) => void;
  setUploadProgress: (progress: number) => void;
  setUploadStage: (stage: VideoUploadState["uploadStage"]) => void;
  setError: (error?: string) => void;
  resetForm: () => void;
  setTitle: (title: string) => void;
  setShowEventInput: (show: boolean) => void;
  setUrl: (url: string) => void;
  setThumbnail: (thumbnail: string) => void;
  setSummary: (summary: string) => void;
  setContentWarning: (contentWarning: string) => void;
  setVideoUpload: (data: Partial<VideoMetadata>) => void;

  // Ações de Persistência Manual
  saveDraft: () => void;
  loadDraft: () => void;
}

const initialState = {
  videoData: {},
  isUploading: false,
  uploadProgress: 0,
  uploadStage: "idle" as const,
  error: undefined,
  showEventInput: false
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
          state.videoData.indexers = indexers;
        }, false, "video/setIndexers"),

      setHashtags: (hashtags) =>
        set((state) => {
          state.videoData.hashtags = hashtags;
        }, false, "video/setHashtags"),


      setLanguage: (language) =>
        set((state) => {
          state.videoData.language = language;
        }, false, "video/setLanguage"),

      setShowEventInput: (show) =>
        set((state) => {
          state.showEventInput = show;
        }, false, "video/setShowEventInput"),

      setTitle: (title) =>
        set((state) => {
          state.videoData.title = title;
        }, false, "video/setTitle"),

      setUrl: (url) =>
        set((state) => {
          state.videoData.url = url;
        }, false, "video/setUrl"),

      setThumbnail: (thumbnail) =>
        set((state) => {
          state.videoData.thumbnail = thumbnail;
        }, false, "video/setThumbnail"),

      setSummary: (summary) =>
        set((state) => {
          state.videoData.summary = summary;
        }, false, "video/setSummary"),

      setContentWarning: (contentWarning) =>
        set((state) => {
          state.videoData.contentWarning = contentWarning;
        }, false, "video/setContentWarning"),

      setVideoUpload: (data) =>
        set((state) => {
          state.videoData = data;
        }, false, "video/setVideoUpload"),

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
        const { videoData } = get();
        const draft = JSON.stringify({ videoData });
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
              // state.indexers = parsed.indexers || [];
              // state.hashtags = parsed.hashtags || [];
              // state.thumb = parsed.thumb;
              // state.language = parsed.language;
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