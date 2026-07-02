import { describe, expect, it } from "vitest";
import { buildAddressableVideoEvent } from "@/features/upload/services/video-event-builder.service";
import { buildYouTubeAltTagText, buildYouTubeImetaTag, buildYouTubeVideoDraft } from "./youtube-video-event.service";

describe("youtube-video-event.service", () => {
  it("builds the exact YouTube imeta tag", () => {
    expect(buildYouTubeImetaTag("GHvYoKHmtGU")).toEqual([
      "imeta",
      "url https://www.youtube.com/watch?v=GHvYoKHmtGU",
      "image https://i.ytimg.com/vi/GHvYoKHmtGU/hqdefault.jpg",
      "m image/jpeg",
    ]);
  });

  it("builds the YouTube compatibility alt text", () => {
    expect(buildYouTubeAltTagText("GHvYoKHmtGU")).toBe(
      "Este formato de vídeo não é suportado por todos os players. Assista diretamente em: https://www.youtube.com/watch?v=GHvYoKHmtGU",
    );
  });

  it("preserves the exact YouTube imeta tag in the addressable video event", () => {
    const draft = buildYouTubeVideoDraft({
      videoId: "GHvYoKHmtGU",
      title: "Imported YouTube video",
      summary: "Metadata-only import",
      duration: 120,
      hashtags: ["nostr", "youtube"],
      indexers: ["youtube:GHvYoKHmtGU"],
      language: "en",
    });

    const event = buildAddressableVideoEvent({
      draft,
      currentPubkey: "f".repeat(64),
      identifier: "youtube-import-test",
    });

    expect(event.tags).toContainEqual([
      "imeta",
      "url https://www.youtube.com/watch?v=GHvYoKHmtGU",
      "image https://i.ytimg.com/vi/GHvYoKHmtGU/hqdefault.jpg",
      "m image/jpeg",
      "duration 120",
    ]);
    expect(event.tags).not.toContainEqual(["duration", "120"]);
    expect(event.tags).toContainEqual([
      "alt",
      "Este formato de vídeo não é suportado por todos os players. Assista diretamente em: https://www.youtube.com/watch?v=GHvYoKHmtGU",
    ]);
    expect(event.tags).toContainEqual(["summary", "Metadata-only import"]);
    expect(event.content).toBe("Metadata-only import");
  });
});
