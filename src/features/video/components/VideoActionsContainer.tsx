import type { NDKEvent, NDKUserProfile } from "@nostr-dev-kit/ndk-hooks";
import { NDKSubscriptionCacheUsage, useFollows } from "@nostr-dev-kit/ndk-hooks";
import { useEffect, useState } from "react";
import { getVideoDetails } from "@/helper/format";
import { VideoActionsView } from "@/features/video/components/VideoActionsView";

interface VideoActionsContainerProps {
  event: NDKEvent;
}

export function VideoActionsContainer({ event }: VideoActionsContainerProps) {
  const [profile, setProfile] = useState<NDKUserProfile | undefined>();
  const follows = useFollows();
  const { summary, title } = getVideoDetails(event);

  useEffect(() => {
    event.author.fetchProfile({ cacheUsage: NDKSubscriptionCacheUsage.CACHE_FIRST }, true).then((nextProfile) => {
      if (nextProfile) {
        setProfile(nextProfile);
      }
    });
  }, [event.author]);

  return (
    <VideoActionsView
      event={event}
      profile={profile}
      summary={Array.isArray(summary) ? summary.join(" ") : summary}
      title={Array.isArray(title) ? title[0] ?? "Untitled" : title}
      followerCount={follows.size}
    />
  );
}
