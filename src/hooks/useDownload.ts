import { LoggerAgent } from "@/debug.ts";

const log = LoggerAgent.create("useDownload");

export function useDownload() {
  const downloadString = (filename: string, content: string) => {
    const element = document.createElement("a");
    const file = new Blob([content], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element); // Required for this to work in FireFox
    element.click();
    document.body.removeChild(element);
  };
  const downloadFile = (url: string, filename: string) => {
    fetch(url)
      .then((response) => response.blob())
      .then((blob) => {
        const element = document.createElement("a");
        element.href = URL.createObjectURL(blob);
        element.download = filename;
        document.body.appendChild(element); // Required for this to work in FireFox
        element.click();
        document.body.removeChild(element);
      })
      .catch((error) => {
        log.error("Error downloading file:", error);
      });
  };
  const downloadBlob = (filename: string, blob: Blob) => {
    const element = document.createElement("a");
    element.href = URL.createObjectURL(blob);
    element.download = filename;
    document.body.appendChild(element); // Required for this to work in FireFox
    element.click();
    document.body.removeChild(element);
  };

  return { downloadBlob, downloadFile, downloadString };
}