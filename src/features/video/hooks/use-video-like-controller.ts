import type { NDKEvent } from "@nostr-dev-kit/ndk-hooks";
import { NDKSubscriptionCacheUsage, useNDK, useNDKCurrentPubkey, useSubscribe } from "@nostr-dev-kit/ndk-hooks";
import { useMutation } from "@tanstack/react-query";
import { makeEvent, type MakeEventParams } from "@/helper/pow/pow";
import { buildLikeEventDraft } from "@/features/video/services/video-interactions.service";
import type { likeOptions } from "@/components/LikeToggleButton";

export function useVideoLikeController(contentEvent: NDKEvent) {
  const { ndk } = useNDK();
  const currentPubkey = useNDKCurrentPubkey();

  const mutation = useMutation({
    mutationKey: ["event:generate:new:video-like", contentEvent.id],
    mutationFn: ({ ndk, event, difficulty }: MakeEventParams): Promise<NDKEvent> =>
      makeEvent({
        ndk,
        event,
        difficulty
      }),
    onSuccess: async (event: NDKEvent) => {
      await event.publish();
    }
  });

  const { events, eose } = useSubscribe([
    {
      kinds: [7],
      "#e": [contentEvent.id]
    }
  ], {
    closeOnEose: true,
    cacheUsage: NDKSubscriptionCacheUsage.CACHE_FIRST
  }, [contentEvent]);

  const activeReaction = Array.from(events).find((event) => event.pubkey === currentPubkey)?.content as likeOptions;
  const upVotes = Array.from(events).filter((event) => event.content === "+").length;
  const downVotes = events.length - upVotes;

  const toggleLike = async (action: string) => {
    if (!ndk || !currentPubkey) return;

    await mutation.mutateAsync({
      difficulty: Number(import.meta.env.VITE_MIN_COMMENT_POW ?? 10),
      ndk,
      event: buildLikeEventDraft({
        contentEvent,
        pubkey: currentPubkey,
        action
      })
    });
  };

  return {
    eose,
    activeReaction,
    upVotes,
    downVotes,
    toggleLike
  };
}
