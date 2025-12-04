import type { NDKEvent } from "@nostr-dev-kit/ndk";

export async function downloadVideo(url: string, filename?: string) {
  let name = filename || "video";
  const splitUrl = url.split(".");
  if (splitUrl.length > 1) {
    name += `.${splitUrl.at(-1)}`;
  }
  const video = await fetch(url);
  const videoBlob = await video.blob();
  const videoURL = URL.createObjectURL(videoBlob);
  const link = document.createElement("a");
  link.href = videoURL;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function downloadJsonl(
  data: NDKEvent[],
  filename: string = "data.jsonl"
) {
  const jsonlData = data.map((item) => JSON.stringify(item.rawEvent())).join("\n");
  const blob = new Blob([jsonlData], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}