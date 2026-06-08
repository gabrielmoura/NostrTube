import { useMemo, useState } from "react";
import type { NDKEvent } from "@nostr-dev-kit/ndk";
import { NDKKind, NDKSubscriptionCacheUsage, useSubscribe } from "@nostr-dev-kit/ndk-hooks";
import { t } from "i18next";
import CommentInput from "./CommentInput";
import CommentFeed from "./CommentFeed.tsx";
import { formatCount } from "@/helper/format.ts";
import { ErrorBoundaryVideo } from "@/routes/v/@components/error.tsx";
import Spinner from "@/components/Spinner.tsx";
import { ScrollArea } from "@/components/ui/scroll-area.tsx";

type CommentSectionProps = {
  eventReference: string;
  eventId: string;
  pubkey?: string;
};

export default function CommentSection({
  eventReference,
  eventId,
  pubkey
}: CommentSectionProps) {
  const [optimisticComments, setOptimisticComments] = useState<NDKEvent[]>([]);

  const { events, eose } = useSubscribe([{
    kinds: [NDKKind.Text],
    "#e": [eventId]
  }], {
    closeOnEose: false,
    cacheUsage: NDKSubscriptionCacheUsage.CACHE_FIRST
  }, [eventId, eventReference]);

  const mergedComments = useMemo(() => {
    const merged = new Map<string, NDKEvent>();

    for (const comment of [...events, ...optimisticComments]) {
      merged.set(comment.id, comment);
    }

    return Array.from(merged.values()).sort((a, b) => (a.created_at ?? 0) - (b.created_at ?? 0));
  }, [events, optimisticComments]);

  const handleCommentSubmitted = (event: NDKEvent) => {
    setOptimisticComments((current) => {
      if (current.some((comment) => comment.id === event.id)) {
        return current;
      }

      return [...current, event];
    });
  };

  if (!eose) {
    return <Spinner />;
  }

  return (
    <ScrollArea className="space-y-2.5 py-2">
      <div>
        <div className="flex items-center">
          <h2 className="text-base font-semibold text-foreground">
            {mergedComments.length === 1
              ? "1 Comment"
              : `${formatCount(mergedComments.length || 0)} ${t("comments")}`}
          </h2>
        </div>
      </div>
      <ErrorBoundaryVideo>
        <CommentInput
          initialTags={[
            ["a", eventReference],
            ["e", eventId, "", "reply"],
            ["p", pubkey!]
          ]}
          onSubmitted={handleCommentSubmitted}
        />
      </ErrorBoundaryVideo>
      <ErrorBoundaryVideo>
        <CommentFeed
          comments={mergedComments}
          rootEventId={eventId}
          rootEventReference={eventReference}
          rootPubkey={pubkey}
          onReplySubmitted={handleCommentSubmitted}
        />
      </ErrorBoundaryVideo>
    </ScrollArea>
  );
}
