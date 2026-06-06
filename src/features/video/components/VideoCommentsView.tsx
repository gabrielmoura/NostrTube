import type { NDKEvent } from "@nostr-dev-kit/ndk-hooks";
import { formatCount } from "@/helper/format";
import { t } from "i18next";
import Spinner from "@/components/Spinner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ErrorBoundaryVideo } from "@/routes/v/@components/error";
import CommentInput from "@/routes/v/@components/Comments/CommentInput";
import CommentFeed from "@/routes/v/@components/Comments/CommentFeed";

interface VideoCommentsViewProps {
  comments: NDKEvent[];
  eose: boolean;
  eventReference: string;
  eventId: string;
  pubkey?: string;
}

export function VideoCommentsView({
  comments,
  eose,
  eventReference,
  eventId,
  pubkey
}: VideoCommentsViewProps) {
  if (!eose) {
    return <Spinner />;
  }

  return (
    <ScrollArea className="space-y-2.5 py-2">
      <div>
        <div className="flex items-center">
          <h2 className="text-base font-semibold text-foreground">
            {comments.length === 1 ? "1 Comment" : `${formatCount(comments.length || 0)} ${t("comments")}`}
          </h2>
        </div>
      </div>
      <ErrorBoundaryVideo>
        <CommentInput
          initialTags={[
            ["a", eventReference],
            ["e", eventId, "", "reply"],
            ["p", pubkey || ""]
          ]}
        />
      </ErrorBoundaryVideo>
      <ErrorBoundaryVideo>
        <CommentFeed comments={comments} />
      </ErrorBoundaryVideo>
    </ScrollArea>
  );
}
