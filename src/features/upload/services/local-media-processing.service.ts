import { encode } from 'blurhash'
import { processVideoWithFFmpeg } from '@/features/upload/services/ffmpeg-media-processing.service'

export interface GeneratedThumbnail {
  file: File;
  objectUrl: string;
  width: number;
  height: number;
  duration: number;
}

export interface PreparedVideoUploadAsset {
  uploadFile: File
  thumbnailFile?: File
  thumbnailPreviewUrl?: string
  width?: number
  height?: number
  duration?: number
  mimeType?: string
  strategy: 'original' | 'ffmpeg' | 'html-video'
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Unable to read file as data URL'));
    reader.readAsDataURL(file);
  });
}

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Unable to load image for processing'));
    image.src = src;
  });
}

export async function generateBlurhashFromImageFile(file: File): Promise<string | undefined> {
  if (!file.type.startsWith('image/')) {
    return undefined;
  }

  const dataUrl = await readFileAsDataUrl(file);
  const image = await loadImageElement(dataUrl);
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const context = canvas.getContext('2d');

  if (!context) {
    return undefined;
  }

  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  const { data, width, height } = context.getImageData(0, 0, canvas.width, canvas.height);
  return encode(data, width, height, 4, 3);
}

export async function extractVideoMetadataLocally(file: File): Promise<Pick<GeneratedThumbnail, 'width' | 'height' | 'duration'>> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.src = objectUrl

    const cleanup = () => {
      URL.revokeObjectURL(objectUrl)
      video.pause()
      video.removeAttribute('src')
      video.load()
    }

    video.onerror = () => {
      cleanup()
      reject(new Error('Unable to load video metadata'))
    }

    video.onloadedmetadata = () => {
      const result = {
        width: video.videoWidth,
        height: video.videoHeight,
        duration: Number.isFinite(video.duration) ? video.duration : 0,
      }

      cleanup()
      resolve(result)
    }
  })
}

export async function generateVideoThumbnailLocally(file: File, seekToSeconds = 2): Promise<GeneratedThumbnail> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    video.src = objectUrl;

    const cleanup = () => {
      video.pause();
      video.removeAttribute('src');
      video.load();
    };

    video.onerror = () => {
      cleanup();
      reject(new Error('Unable to load video for thumbnail generation'));
    };

    video.onloadedmetadata = () => {
      const duration = video.duration;
      const target = Number.isFinite(duration) && duration > seekToSeconds ? seekToSeconds : 0;
      window.setTimeout(() => {
        video.currentTime = target;
      }, 200);
    };

    video.onseeked = async () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext('2d');
        if (!context) {
          throw new Error('Unable to create thumbnail canvas context');
        }

        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const blob = await new Promise<Blob>((resolveBlob, rejectBlob) => {
          canvas.toBlob((nextBlob) => {
            if (!nextBlob) {
              rejectBlob(new Error('Unable to export thumbnail blob'));
              return;
            }
            resolveBlob(nextBlob);
          }, 'image/jpeg', 0.85);
        });

        const thumbnailFile = new File([blob], `${file.name.replace(/\.[^.]+$/, '')}-thumbnail.jpg`, {
          type: 'image/jpeg'
        });

        cleanup();
        resolve({
          file: thumbnailFile,
          objectUrl: URL.createObjectURL(blob),
          width: canvas.width,
          height: canvas.height,
          duration: Number.isFinite(video.duration) ? video.duration : 0
        });
      } catch (error) {
        cleanup();
        reject(error instanceof Error ? error : new Error('Unknown thumbnail generation error'));
      }
    };
  });
}

export async function prepareVideoUploadAsset(
  file: File,
  {
    preferCompression = false,
    enableFFmpeg = true,
    generateThumbnail = true,
  }: {
    preferCompression?: boolean
    enableFFmpeg?: boolean
    generateThumbnail?: boolean
  } = {},
): Promise<PreparedVideoUploadAsset> {
  if (!file.type.startsWith('video/')) {
    return {
      uploadFile: file,
      mimeType: file.type,
      strategy: 'original',
    }
  }

  if (enableFFmpeg) {
    const ffmpegResult = await processVideoWithFFmpeg(file, { preferCompression })
    if (ffmpegResult) {
      return {
        uploadFile: ffmpegResult.file ?? file,
        thumbnailFile: generateThumbnail ? ffmpegResult.thumbnailFile : undefined,
        thumbnailPreviewUrl: generateThumbnail ? ffmpegResult.thumbnailPreviewUrl : undefined,
        width: ffmpegResult.width,
        height: ffmpegResult.height,
        duration: ffmpegResult.duration,
        mimeType: ffmpegResult.mimeType ?? file.type,
        strategy: 'ffmpeg',
      }
    }
  }

  const metadata = await extractVideoMetadataLocally(file).catch(() => undefined)

  if (!generateThumbnail) {
    return {
      uploadFile: file,
      width: metadata?.width,
      height: metadata?.height,
      duration: metadata?.duration,
      mimeType: file.type,
      strategy: 'original',
    }
  }

  try {
    const generated = await generateVideoThumbnailLocally(file)
    return {
      uploadFile: file,
      thumbnailFile: generated.file,
      thumbnailPreviewUrl: generated.objectUrl,
      width: generated.width || metadata?.width,
      height: generated.height || metadata?.height,
      duration: generated.duration || metadata?.duration,
      mimeType: file.type,
      strategy: 'html-video',
    }
  } catch {
    return {
      uploadFile: file,
      width: metadata?.width,
      height: metadata?.height,
      duration: metadata?.duration,
      mimeType: file.type,
      strategy: 'original',
    }
  }
}

export async function generateVideoThumbnailFromUrl(url: string, filename = 'external-video', seekToSeconds = 2): Promise<GeneratedThumbnail> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = 'anonymous';
    video.src = url;

    const cleanup = () => {
      video.pause();
      video.removeAttribute('src');
      video.load();
    };

    video.onerror = () => {
      cleanup();
      reject(new Error('Unable to load external video for thumbnail generation'));
    };

    video.onloadedmetadata = () => {
      const duration = video.duration;
      const target = Number.isFinite(duration) && duration > seekToSeconds ? seekToSeconds : 0;
      window.setTimeout(() => {
        video.currentTime = target;
      }, 200);
    };

    video.onseeked = async () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext('2d');
        if (!context) {
          throw new Error('Unable to create thumbnail canvas context');
        }

        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const blob = await new Promise<Blob>((resolveBlob, rejectBlob) => {
          canvas.toBlob((nextBlob) => {
            if (!nextBlob) {
              rejectBlob(new Error('Unable to export thumbnail blob'));
              return;
            }
            resolveBlob(nextBlob);
          }, 'image/jpeg', 0.85);
        });

        const thumbnailFile = new File([blob], `${filename.replace(/\.[^.]+$/, '')}-thumbnail.jpg`, {
          type: 'image/jpeg'
        });

        cleanup();
        resolve({
          file: thumbnailFile,
          objectUrl: URL.createObjectURL(blob),
          width: canvas.width,
          height: canvas.height,
          duration: Number.isFinite(video.duration) ? video.duration : 0
        });
      } catch (error) {
        cleanup();
        reject(error instanceof Error ? error : new Error('Unknown external thumbnail generation error'));
      }
    };
  });
}
