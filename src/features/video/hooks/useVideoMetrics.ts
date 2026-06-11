import { useQuery } from "@tanstack/react-query";
import type NDK from "@nostr-dev-kit/ndk";
import type { NDKEvent } from "@nostr-dev-kit/ndk";
import { getVideoMetrics } from "@/features/video/services/video-metrics.service";

export function useVideoMetrics({
  ndk,
  event,
  enabled
}: {
  ndk: NDK | undefined;
  event: NDKEvent | undefined;
  enabled: boolean;
}) {
  return useQuery({
    queryKey: ["video-metrics", event?.id, event?.tagValue("d")],
    enabled: Boolean(enabled && ndk && event),
    queryFn: async () => getVideoMetrics(ndk!, event!),
    staleTime: 30_000
  });
}
