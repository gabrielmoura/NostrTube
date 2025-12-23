import type { NDKEvent, NDKKind } from "@nostr-dev-kit/ndk";


import { HiHandThumbDown, HiHandThumbUp, HiOutlineHandThumbDown, HiOutlineHandThumbUp } from "react-icons/hi2";
// import {modal} from "@/app/_providers/modal";
// import AuthModal from "@/components/modals/auth";
import { NDKSubscriptionCacheUsage, useNDK, useNDKCurrentPubkey, useSubscribe } from "@nostr-dev-kit/ndk-hooks";
import { Button } from "@/components/button.tsx";
import { makeEvent, type makeEventParams } from "@/helper/pow/pow.ts";
import { formatCount } from "@/helper/format.ts";
import { nostrNow } from "@/helper/date.ts";
import Spinner from "@/components/Spinner.tsx";
import type { likeOptions } from "@/components/LikeToggleButton.tsx";
import { useMutation } from "@tanstack/react-query";

type ReactionButtonsProps = {
  event: NDKEvent;
};
export default function ReactionButtons({ event }: ReactionButtonsProps) {
  const { ndk } = useNDK();
  const currentPubkey = useNDKCurrentPubkey();
  const { events, eose } = useSubscribe([{
    kinds: [7 as NDKKind],
    "#e": [event.id]
  }], {
    closeOnEose: true,
    cacheUsage: NDKSubscriptionCacheUsage.CACHE_FIRST
  }, [event]);

  const makeEventMut = useMutation({
    mutationKey: ["event:generate:new:video"],
    mutationFn: ({ ndk, event, difficulty }: makeEventParams): Promise<NDKEvent> => makeEvent({
      ndk,
      event,
      difficulty
    }),
    onSuccess: async (event: NDKEvent) => {
      await event.publish();
    }
  });

  if (!eose) {
    return <Spinner />;
  }


  async function handleLike(action: likeOptions) {
    await makeEventMut.mutateAsync({
      difficulty: 10,
      ndk: ndk!,
      event: {
        created_at: nostrNow(),
        pubkey: currentPubkey!,
        content: action,
        kind: 7,
        tags: [["e", event.id]]
      }
    });
  }

  const activeReaction = Array.from(events).filter(e => e.pubkey == currentPubkey)[0]?.content as likeOptions;
  const downVotes = Array.from(events)?.filter((e) => e.content === "-").length;
  const upVotes = (events?.size || events?.length) - downVotes;


  return (
    <div className="flex items-center gap-1">
      <Button
        onClick={async () => await handleLike("+")}
        disabled={!currentPubkey}
        size="sm"
        variant="ghost"
        className="gap-x-1.5 px-2"
      >
        {activeReaction == "+" ? (
          <HiHandThumbUp className="h-4 w-4" />
        ) : (
          <HiOutlineHandThumbUp className="h-4 w-4" />
        )}
        {!!upVotes && (
          <span className="text-xs font-bold">{formatCount(upVotes)}</span>
        )}
      </Button>
      <Button
        onClick={async () => await handleLike("-")}
        disabled={!currentPubkey}
        size="sm"
        variant="ghost"
        className="gap-x-1.5 px-2"
      >
        {activeReaction == "-" ? (
          <HiHandThumbDown className="h-4 w-4" />
        ) : (
          <HiOutlineHandThumbDown className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
