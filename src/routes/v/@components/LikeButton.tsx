import type {NDKEvent} from "@nostr-dev-kit/ndk-hooks";
import {NDKSubscriptionCacheUsage, useNDK, useNDKCurrentPubkey, useSubscribe} from "@nostr-dev-kit/ndk-hooks";
import LikeToggleButton, {type likeOptions} from "@/components/LikeToggleButton.tsx";
import Spinner from "@/components/Spinner.tsx";
import type {NDKKind} from "@nostr-dev-kit/ndk";
import {makeEvent, type makeEventParams} from "@/helper/pow/pow.ts";
import {nostrNow} from "@/helper/date.ts";
import {useMutation} from "@tanstack/react-query";

type LikeButtonProps = {
    contentEvent: NDKEvent;
};
export default function LikeButton({contentEvent}: LikeButtonProps) {
    const {ndk} = useNDK()
    const currentPubkey = useNDKCurrentPubkey()


    const makeEventMut = useMutation({
        mutationKey: ['event:generate:new:video'],
        mutationFn: ({ndk, event, difficulty}: makeEventParams): Promise<NDKEvent> => makeEvent({
            ndk,
            event,
            difficulty
        }),
        onSuccess: async (event: NDKEvent) => {
            await event.publish()
        }
    })

    const {events, eose} = useSubscribe([{
        kinds: [7 as NDKKind],
        "#e": [contentEvent.id],
    }], {
        closeOnEose: true,
        cacheUsage: NDKSubscriptionCacheUsage.CACHE_FIRST,
    }, [contentEvent])

    async function handleLike(action: string) {
        await makeEventMut.mutateAsync({
            difficulty: 10,
            ndk: ndk!,
            event: {
                created_at: nostrNow(),
                pubkey: currentPubkey!,
                content: action,
                kind: 7,
                tags: [["e", contentEvent.id]],
            }
        })
    }


    const activeReaction = Array.from(events).filter(e => e.pubkey == currentPubkey)[0]?.content as likeOptions
    const upVotes = Array.from(events)?.filter((e) => e.content === "+").length;
    const downVotes = (events?.size || events?.length) - upVotes;


    if (!eose) {
        return <Spinner/>
    }


    return (
        <LikeToggleButton
            active={activeReaction}
            likeCount={upVotes}
            unLikeCount={downVotes}
            onClick={async (action) => await handleLike(action)}
        />
    );
}