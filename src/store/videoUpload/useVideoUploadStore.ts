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
  imetaVariants?: NDKImetaTag[];
  imetaAudioTracks?: NDKImetaTag[];
  imetaThumb: NDKImetaTag;
  imetaImage: NDKImetaTag;
  age: AgeEnum;
  language?: string;
  geohash?: string;
  origin?: {
    platform: string;
    externalId: string;
    originalUrl: string;
    metadata?: string;
  };
}

const DRAFT_KEY = "video-upload-draft";

export interface VideoUploadState {
  videoData: Partial<VideoMetadata>;
  thumbnailPreviewUrl?: string;
  currentStep: 1 | 2 | 3;
  isUploading: boolean;
  uploadProgress: number;
  uploadStage: "idle" | "validating" | "uploading" | "processing" | "mirroring" | "complete" | "error";
  error?: string;
  showEventInput: boolean;
  setVideoData: (data: Partial<VideoMetadata>) => void;
  setCurrentStep: (step: 1 | 2 | 3) => void;
  setIndexers: (indexers: string[]) => void;
  setHashtags: (hashtags: string[]) => void;
  setLanguage: (language?: string) => void;
  setGeohash: (geohash?: string) => void;
  setUploadingState: (isUploading: boolean) => void;
  setUploadProgress: (progress: number) => void;
  setUploadStage: (stage: VideoUploadState["uploadStage"]) => void;
  setError: (error?: string) => void;
  resetForm: () => void;
  setTitle: (title: string) => void;
  setShowEventInput: (show: boolean) => void;
  setUrl: (url: string) => void;
  setThumbnail: (thumbnail: string) => void;
  setThumbnailPreviewUrl: (thumbnailPreviewUrl?: string) => void;
  setSummary: (summary: string) => void;
  setContentWarning: (contentWarning: string) => void;
  setVideoUpload: (data: Partial<VideoMetadata>) => void;
  clearUploadedMedia: () => void;
  saveDraft: () => void;
  loadDraft: () => void;
  clearLocalDraft: () => void;
  getDraftSnapshot: () => { videoData: Partial<VideoMetadata>; currentStep: 1 | 2 | 3; updatedAt: number };
  applyDraftSnapshot: (snapshot: { videoData: Partial<VideoMetadata>; currentStep?: 1 | 2 | 3; updatedAt?: number; thumbnailPreviewUrl?: string }) => void;
}

const initialState = {
  videoData: {},
  currentStep: 1 as const,
  isUploading: false,
  uploadProgress: 0,
  uploadStage: "idle" as const,
  error: undefined,
  showEventInput: false,
  thumbnailPreviewUrl: undefined
};

export const useVideoUploadStore = create<VideoUploadState>()(
  devtools(
    immer((set, get) => ({
      ...initialState,

      setVideoData: (data) =>
        set((state) => {
          state.videoData = { ...state.videoData, ...data };
        }, false, "video/setVideoData"),

      setCurrentStep: (step) =>
        set((state) => {
          state.currentStep = step;
        }, false, "ui/setCurrentStep"),

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

      setGeohash: (geohash) =>
        set((state) => {
          state.videoData.geohash = geohash;
        }, false, "video/setGeohash"),

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

      setThumbnailPreviewUrl: (thumbnailPreviewUrl) =>
        set((state) => {
          state.thumbnailPreviewUrl = thumbnailPreviewUrl;
        }, false, "video/setThumbnailPreviewUrl"),

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

      clearUploadedMedia: () =>
        set((state) => {
          state.videoData.url = undefined;
          state.videoData.fallback = undefined;
          state.videoData.fileType = undefined;
          state.videoData.fileHash = undefined;
          state.videoData.fileSize = undefined;
          state.videoData.duration = undefined;
          state.videoData.dim = undefined;
          state.videoData.mime_type = undefined;
          state.videoData.imetaVideo = undefined;
          state.videoData.imetaVariants = undefined;
          state.videoData.imetaAudioTracks = undefined;
          state.videoData.geohash = undefined;
          state.videoData.origin = undefined;
          state.videoData.thumbnail = undefined;
          state.thumbnailPreviewUrl = undefined;
          state.isUploading = false;
          state.uploadProgress = 0;
          state.uploadStage = "idle";
          state.error = undefined;
          state.showEventInput = false;
          if (state.currentStep > 1) {
            state.currentStep = 1;
          }
        }, false, "video/clearUploadedMedia"),

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

      clearLocalDraft: () => {
        localStorage.removeItem(DRAFT_KEY);
      },

      getDraftSnapshot: () => {
        const { videoData, currentStep } = get();
        return {
          videoData,
          currentStep,
          updatedAt: Date.now()
        };
      },

      applyDraftSnapshot: (snapshot) =>
        set((state) => {
          state.videoData = snapshot.videoData || {};
          state.currentStep = snapshot.currentStep || 1;
          state.thumbnailPreviewUrl = snapshot.thumbnailPreviewUrl ?? snapshot.videoData?.thumbnail;
        }, false, "video/applyDraftSnapshot"),

      saveDraft: () => {
        const { videoData, currentStep, thumbnailPreviewUrl } = get();
        const draft = JSON.stringify({ videoData, currentStep, thumbnailPreviewUrl, updatedAt: Date.now() });
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
              state.currentStep = parsed.currentStep || 1;
              state.thumbnailPreviewUrl = parsed.thumbnailPreviewUrl ?? parsed.videoData?.thumbnail;
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
