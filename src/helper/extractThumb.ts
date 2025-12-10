import { LoggerAgent } from "@/lib/debug.ts";

const log = LoggerAgent.create("extractThumb");

/**
 * Interfaces de Configuração
 */
export interface ThumbnailOptions {
  /** Tempo em segundos para capturar o frame (padrão: 1.0) */
  seekTime?: number;
  /** Largura máxima do thumbnail mantendo a proporção (opcional) */
  maxWidth?: number;
  /** Altura máxima do thumbnail mantendo a proporção (opcional) */
  maxHeight?: number;
  /** Qualidade da imagem de 0 a 1 (apenas para image/jpeg e image/webp) */
  quality?: number;
  /** Formato de saída (padrão: 'image/jpeg') */
  outputType?: "image/jpeg" | "image/png" | "image/webp";
}

/**
 * Erros Customizados para melhor tratamento
 */
class VideoThumbnailError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "VideoThumbnailError";
  }
}

/**
 * Gera um thumbnail (Data URL string) a partir de um arquivo de vídeo.
 *
 * @param file - O arquivo de vídeo (File object).
 * @param options - Configurações opcionais de geração.
 * @returns Promise<string> - Retorna uma string base64 do thumbnail.
 */
export const generateVideoThumbnail = (
  file: File,
  options: ThumbnailOptions = {}
): Promise<string> => {
  return new Promise((resolve, reject) => {
    // 1. Validação de Compatibilidade do Navegador
    if (!window.FileReader || !document.createElement) {
      log.warn("Navegador não suporta APIs necessárias.");
      return reject(new VideoThumbnailError("Navegador não suporta APIs necessárias."));
    }

    // 2. Validação do Arquivo
    if (!file) {
      log.error("Arquivo não fornecido.");
      return reject(new VideoThumbnailError("Arquivo não fornecido."));
    }

    if (!file.type.startsWith("video/")) {
      log.error(`O arquivo fornecido não é um vídeo. Tipo recebido: ${file.type}`);
      return reject(new VideoThumbnailError(`O arquivo fornecido não é um vídeo. Tipo recebido: ${file.type}`));
    }

    // Configurações padrão
    const settings: Required<ThumbnailOptions> = {
      seekTime: options.seekTime ?? 1.0, // Pega o frame do segundo 1 para evitar tela preta inicial
      maxWidth: options.maxWidth ?? 0,
      maxHeight: options.maxHeight ?? 0,
      quality: options.quality ?? 0.8,
      outputType: options.outputType ?? "image/jpeg"
    };

    // 3. Setup dos Elementos
    const video = document.createElement("video");
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      log.error("Não foi possível criar o contexto 2D do Canvas.");
      return reject(new VideoThumbnailError("Não foi possível criar o contexto 2D do Canvas."));
    }

    // Otimizações para processamento em background
    video.autoplay = false;
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = "anonymous"; // Boa prática, embora para File local não seja estritamente necessário

    // URL temporária para o arquivo
    const videoUrl = URL.createObjectURL(file);
    video.src = videoUrl;

    // 4. Fluxo de Eventos

    // Quando os metadados carregarem, pulamos para o tempo desejado
    video.addEventListener("loadedmetadata", () => {
      // Garante que não buscamos um tempo maior que a duração do vídeo
      if (settings.seekTime > video.duration) {
        video.currentTime = video.duration / 2; // Pega o meio se o seekTime for inválido
      } else {
        video.currentTime = settings.seekTime;
      }
    });

    // Quando o vídeo terminar de buscar o frame (seeked), desenhamos
    video.addEventListener("seeked", () => {
      try {
        const { videoWidth, videoHeight } = video;
        let finalWidth = videoWidth;
        let finalHeight = videoHeight;

        // Lógica de Redimensionamento (Aspect Ratio)
        if (settings.maxWidth > 0 && finalWidth > settings.maxWidth) {
          const ratio = settings.maxWidth / finalWidth;
          finalWidth = settings.maxWidth;
          finalHeight = finalHeight * ratio;
        }

        if (settings.maxHeight > 0 && finalHeight > settings.maxHeight) {
          const ratio = settings.maxHeight / finalHeight;
          finalHeight = settings.maxHeight;
          finalWidth = finalWidth * ratio;
        }

        // Configura canvas e desenha
        canvas.width = finalWidth;
        canvas.height = finalHeight;

        // Desenha o frame do vídeo no canvas redimensionado
        ctx.drawImage(video, 0, 0, finalWidth, finalHeight);

        // Gera o Data URL
        const dataUrl = canvas.toDataURL(settings.outputType, settings.quality);

        resolve(dataUrl);

      } catch (error) {
        log.error("Erro ao desenhar thumbnail no canvas.", error);
        reject(new VideoThumbnailError("Erro ao desenhar thumbnail no canvas."));
      } finally {
        // 5. Limpeza de Memória (Crucial)
        URL.revokeObjectURL(videoUrl);
        video.remove();
        canvas.remove();
      }
    });

    // Tratamento de erros de carregamento do vídeo
    video.addEventListener("error", (e) => {
      log.error("Erro ao carregar o vídeo. O arquivo pode estar corrompido.", e);
      URL.revokeObjectURL(videoUrl);
      reject(new VideoThumbnailError("Erro ao carregar o vídeo. O arquivo pode estar corrompido."));
    });

    // Inicia o carregamento
    video.load();
  });
};

/**
 * Gera um thumbnail (Data URL string) a partir de uma URL de vídeo.
 * @param url
 * @param options
 */
export function generateVideoThumbnailFromUrl(url: string, options: ThumbnailOptions = {}): Promise<string> {
  return new Promise((resolve, reject) => {
    // 1. Validação de Compatibilidade do Navegador
    if (!document.createElement) {
      log.warn("Navegador não suporta APIs necessárias.");
      return reject(new VideoThumbnailError("Navegador não suporta APIs necessárias."));
    }

    // Configurações padrão
    const settings: Required<ThumbnailOptions> = {
      seekTime: options.seekTime ?? 1.0,
      maxWidth: options.maxWidth ?? 0,
      maxHeight: options.maxHeight ?? 0,
      quality: options.quality ?? 0.8,
      outputType: options.outputType ?? "image/jpeg"
    };

    // 2. Setup dos Elementos
    const video = document.createElement("video");
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      log.error("Não foi possível criar o contexto 2D do Canvas.");
      return reject(new VideoThumbnailError("Não foi possível criar o contexto 2D do Canvas."));
    }

    // Otimizações para processamento em background
    video.autoplay = false;
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = "anonymous"; // Necessário para vídeos de URLs externas

    video.src = url;

    // 3. Fluxo de Eventos

    video.addEventListener("loadedmetadata", () => {
      if (settings.seekTime > video.duration) {
        video.currentTime = video.duration / 2;
      } else {
        video.currentTime = settings.seekTime;
      }
    });

    video.addEventListener("seeked", () => {
      try {
        const { videoWidth, videoHeight } = video;
        let finalWidth = videoWidth;
        let finalHeight = videoHeight;

        if (settings.maxWidth > 0 && finalWidth > settings.maxWidth) {
          const ratio = settings.maxWidth / finalWidth;
          finalWidth = settings.maxWidth;
          finalHeight = finalHeight * ratio;
        }

        if (settings.maxHeight > 0 && finalHeight > settings.maxHeight) {
          const ratio = settings.maxHeight / finalHeight;
          finalHeight = settings.maxHeight;
          finalWidth = finalWidth * ratio;
        }

        canvas.width = finalWidth;
        canvas.height = finalHeight;

        ctx.drawImage(video, 0, 0, finalWidth, finalHeight);

        const dataUrl = canvas.toDataURL(settings.outputType, settings.quality);

        resolve(dataUrl);
      } catch (error) {
        log.error("Erro ao desenhar thumbnail no canvas.", error);
        reject(new VideoThumbnailError("Erro ao desenhar thumbnail no canvas."));
      } finally {
        video.remove();
        canvas.remove();
      }
    });

    video.addEventListener("error", (e) => {
      log.error("Erro ao carregar o vídeo. A URL pode estar incorreta ou o vídeo pode estar inacessível.", e);
      reject(new VideoThumbnailError("Erro ao carregar o vídeo. A URL pode estar incorreta ou o vídeo pode estar inacessível."));
    });

    video.load();
  });
}