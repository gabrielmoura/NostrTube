import {NDKKind, NDKSubscriptionCacheUsage, useSubscribe} from "@nostr-dev-kit/ndk-hooks";
import {formatNumber, getVideoDetails} from "@/helper/format.ts";
import {relativeTime} from "@/helper/date.ts";
import type {VideoActionsProps} from "@/routes/v/@components/VideoActions.tsx";

export function VideoMeta({event, eventIdentifier}: VideoActionsProps) {
    const {events} = useSubscribe([{
        // authors: [event.pubkey],
        kinds: [34237 as NDKKind],
        "#a": [eventIdentifier!],
    }], {
        cacheUsage: NDKSubscriptionCacheUsage.CACHE_FIRST,
        closeOnEose: true,
    })
    const {publishedAt} = getVideoDetails(event);

    return <div className="flex items-center gap-x-1.5 text-[13px] font-semibold text-foreground">
        <p>{`${formatNumber(events.length)} views`}</p>
        {!!publishedAt && (
            <>
                <span>•</span>
                <p>{relativeTime(new Date(publishedAt * 1000))}</p>
            </>
        )}
    </div>
}