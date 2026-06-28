import { create } from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

export type ImageProxyMode = "none" | "imgproxy" | "nostube-imgproxy" | "imageproxy";
export type CorsProxyMode = "none" | "custom" | "corsproxy_io";

export interface ImageProxySettings {
  mode: ImageProxyMode;
  imgproxyBaseUrl: string;
  nostubeImgproxyBaseUrl: string;
  imageproxyBaseUrl: string;
}

export interface CorsProxySettings {
  mode: CorsProxyMode;
  customBaseUrl: string;
}

interface ImageProxySettingsState {
  imageProxy: ImageProxySettings;
  corsProxy: CorsProxySettings;
}

interface ImageProxySettingsActions {
  setImageProxyMode: (mode: ImageProxyMode) => void;
  setImgproxyBaseUrl: (url: string) => void;
  setNostubeImgproxyBaseUrl: (url: string) => void;
  setImageproxyBaseUrl: (url: string) => void;
  setCorsProxyMode: (mode: CorsProxyMode) => void;
  setCorsProxyCustomBaseUrl: (url: string) => void;
}

export type ImageProxySettingsStore = ImageProxySettingsState & ImageProxySettingsActions;

const STORE_NAME = "image-proxy-settings";
const defaultImgproxyBaseUrl = import.meta.env.VITE_APP_IMGPROXY ?? "";
const defaultNostubeImgproxyBaseUrl = import.meta.env.VITE_APP_NOSTUBE_IMGPROXY ?? "";
const defaultImageProxyMode = resolveDefaultImageProxyMode(import.meta.env.VITE_APP_IMAGE_PROXY_MODE);

function isImageProxyMode(value: unknown): value is ImageProxyMode {
  return value === "none" || value === "imgproxy" || value === "nostube-imgproxy" || value === "imageproxy";
}

function resolveDefaultImageProxyMode(mode?: string): ImageProxyMode {
  if (isImageProxyMode(mode)) {
    return mode === "nostube-imgproxy" && !defaultNostubeImgproxyBaseUrl ? "none" : mode;
  }

  return defaultNostubeImgproxyBaseUrl ? "nostube-imgproxy" : "none";
}

export const useImageProxySettingsStore = create<ImageProxySettingsStore>()(
  devtools(
    persist(
      immer((set) => ({
        imageProxy: {
          mode: defaultImageProxyMode,
          imgproxyBaseUrl: defaultImgproxyBaseUrl,
          nostubeImgproxyBaseUrl: defaultNostubeImgproxyBaseUrl,
          imageproxyBaseUrl: "",
        },
        corsProxy: {
          mode: "none",
          customBaseUrl: "",
        },

        setImageProxyMode: (mode) =>
          set(
            (state) => {
              state.imageProxy.mode = mode;
            },
            false,
            "imageProxy/setMode",
          ),

        setImgproxyBaseUrl: (url) =>
          set(
            (state) => {
              state.imageProxy.imgproxyBaseUrl = url;
            },
            false,
            "imageProxy/setImgproxyBaseUrl",
          ),

        setNostubeImgproxyBaseUrl: (url) =>
          set(
            (state) => {
              state.imageProxy.nostubeImgproxyBaseUrl = url;
            },
            false,
            "imageProxy/setNostubeImgproxyBaseUrl",
          ),

        setImageproxyBaseUrl: (url) =>
          set(
            (state) => {
              state.imageProxy.imageproxyBaseUrl = url;
            },
            false,
            "imageProxy/setImageproxyBaseUrl",
          ),

        setCorsProxyMode: (mode) =>
          set(
            (state) => {
              state.corsProxy.mode = mode;
            },
            false,
            "corsProxy/setMode",
          ),

        setCorsProxyCustomBaseUrl: (url) =>
          set(
            (state) => {
              state.corsProxy.customBaseUrl = url;
            },
            false,
            "corsProxy/setCustomBaseUrl",
          ),
      })),
      {
        name: STORE_NAME,
        storage: createJSONStorage(() => localStorage),
      },
    ),
    {
      name: STORE_NAME,
      enabled: import.meta.env.DEV,
    },
  ),
);

export default useImageProxySettingsStore;
