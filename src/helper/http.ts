import { generateUrl, type Options } from "@imgproxy/imgproxy-js-core";
import type { ImageProxyMode } from "@/store/useImageProxySettingsStore.ts";

export interface ImageProxyConfig {
  mode: ImageProxyMode;
  imgproxyBaseUrl?: string;
  imageproxyBaseUrl?: string;
}

const envImgproxyBaseUrl = import.meta.env.VITE_APP_IMGPROXY;

function normalizeBaseUrl(url?: string): string {
  return url?.trim().replace(/\/+$/, "") ?? "";
}

function getDefaultImageProxyConfig(): ImageProxyConfig {
  return {
    mode: envImgproxyBaseUrl ? "imgproxy" : "none",
    imgproxyBaseUrl: envImgproxyBaseUrl,
    imageproxyBaseUrl: "",
  };
}

function getImageproxyOptions(width: number | string, customOptions?: Options): string {
  const resize = customOptions?.resize;
  const requestedWidth = Number(resize?.width ?? width);
  const requestedHeight = Number(resize?.height);
  const size = Number.isFinite(requestedWidth) && requestedWidth > 0
    ? Number.isFinite(requestedHeight) && requestedHeight > 0 && requestedHeight !== requestedWidth
      ? `${requestedWidth}x${requestedHeight}`
      : `${requestedWidth}`
    : "x";
  const resizeMode = resize?.resizing_type === "fit" ? "fit" : undefined;

  return [size, resizeMode].filter(Boolean).join(",");
}

// --- Função de Alto Nível (Helper / Wrapper) ---

/**
 * Função utilitária para uso direto nos componentes.
 * Responsabilidade: Decidir SE deve usar o proxy e aplicar defaults.
 */
export function getOptimizedImageSrc(
  src: string,
  width: number | string,
  customOptions?: Options,
  proxyConfig: ImageProxyConfig = getDefaultImageProxyConfig()
): string {
  if (!src){
    return src;
  }

  if (proxyConfig.mode === "none") {
    return src;
  }

  const options: Options = customOptions || {
    resize: {
      resizing_type: "fit",
      width: Number(width),
      height: Number(width)
    }
  };

  if (proxyConfig.mode === "imageproxy") {
    const baseUrl = normalizeBaseUrl(proxyConfig.imageproxyBaseUrl);
    if (!baseUrl) return src;

    return `${baseUrl}/${getImageproxyOptions(width, options)}/${encodeURIComponent(src)}`;
  }

  const baseUrl = normalizeBaseUrl(proxyConfig.imgproxyBaseUrl);
  if (!baseUrl) return src;

  const path = generateUrl({
    type: "plain",
    value: src
  }, options);

  return `${baseUrl}/insecure${path}`;
}
