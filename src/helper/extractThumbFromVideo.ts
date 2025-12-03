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
      return reject(new VideoThumbnailError("Navegador não suporta APIs necessárias."));
    }

    // 2. Validação do Arquivo
    if (!file) {
      return reject(new VideoThumbnailError("Arquivo não fornecido."));
    }

    if (!file.type.startsWith("video/")) {
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
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
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
      URL.revokeObjectURL(videoUrl);
      reject(new VideoThumbnailError("Erro ao carregar o vídeo. O arquivo pode estar corrompido."));
    });

    // Inicia o carregamento
    video.load();
  });
};
