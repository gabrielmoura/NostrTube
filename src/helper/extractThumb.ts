import { LoggerAgent } from "@/debug.ts";

export function extractThumb(file: File): Promise<string> {
  const log = LoggerAgent.create("extractThumb");
  return new Promise((resolve, reject) => {
    if ("MediaSource" in window && file.type.startsWith("video/")) {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          const maxDim = 100; // Max dimension for thumbnail
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxDim) {
              height *= maxDim / width;
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width *= maxDim / height;
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/png"));
        };
        img.onerror = reject;
        img.src = reader.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    } else {
      log.warn("Unsupported file type for thumbnail extraction:", file.type);
      reject(new Error("Unsupported file type for thumbnail extraction"));
    }
  });

}
export function isMp4Supported(): boolean {
  return MediaSource.isTypeSupported('video/mp4; codecs="avc1.42E01E, mp4a.40.2"')
}