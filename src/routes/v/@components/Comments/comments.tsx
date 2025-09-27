import CommentInput from "./CommentInput";
import CommentFeed from "./CommentFeed.tsx";
import {formatCount} from "@/helper/format.ts";
import {NDKKind, NDKSubscriptionCacheUsage, useSubscribe} from "@nostr-dev-kit/ndk-hooks";
import {ErrorBoundaryVideo} from "@/routes/v/@components/error.tsx";
import {t} from "i18next";

type CommentSectionProps = {
    eventReference: string;
    eventId: string;
    pubkey?: string;
};

export default function CommentSection({
                                           eventReference,
                                           eventId,
                                           pubkey,
                                       }: CommentSectionProps) {
    const {events} = useSubscribe([{
        kinds: [NDKKind.Text],
        "#a": [eventReference],
    }], {
        closeOnEose: true,
        cacheUsage: NDKSubscriptionCacheUsage.CACHE_FIRST,
    })

    return (
        <section className="space-y-2.5 py-2">
            {/* Comments Section */}
            <div className="">
                <div className="flex items-center">
                    <h2 className="text-base font-semibold text-foreground">
                        {events.length === 1
                            ? "1 Comment"
                            : `${formatCount(events?.length)} ${t('comments')}`}
                    </h2>
                </div>
            </div>
            <ErrorBoundaryVideo>
                <CommentInput
                    initialTags={[
                        ["a", eventReference],
                        ["e", eventId, "", "reply"],
                        ["p", pubkey!],
                    ]}
                />
            </ErrorBoundaryVideo>
            <ErrorBoundaryVideo>
                <CommentFeed comments={events}/>
            </ErrorBoundaryVideo>
        </section>
    );
}
