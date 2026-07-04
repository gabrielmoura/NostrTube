import { describe, expect, it } from "vitest";
import { SHORT_VIDEO_EVENT_KINDS } from "@/features/video/services/video-kinds";
import { buildShortsFeedFilter } from "@/features/shorts/services/shorts-query.service";

describe("shorts-query.service", () => {
  it("builds a shorts-only feed filter", () => {
    expect(buildShortsFeedFilter()).toEqual({
      kinds: SHORT_VIDEO_EVENT_KINDS,
      limit: 30,
    });
  });

  it("adds cursor and trimmed search when provided", () => {
    expect(buildShortsFeedFilter({ author: "pubkey", limit: 10, until: 123, search: "  nostr  " })).toEqual({
      authors: ["pubkey"],
      kinds: SHORT_VIDEO_EVENT_KINDS,
      limit: 10,
      until: 123,
      search: "nostr",
    });
  });
});
