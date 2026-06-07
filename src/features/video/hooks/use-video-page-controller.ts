import { useState } from "react";
import { useNDK, useNDKCurrentUser } from "@nostr-dev-kit/ndk-hooks";
import { useRecordView } from "@/hooks/useRecordView";
import { useVideoContext } from "@/context/VideoContext";
import { recordWatchHistory } from "@/features/recommendations/services/watch-history.service";

export function useVideoPageController() {
  const [shouldRecordView, setShouldRecordView] = useState(true);
  const currentUser = useNDKCurrentUser();
  const { ndk } = useNDK();
  const { video, assets } = useVideoContext();
  const { markView } = useRecordView();

  const handleCanPlay = async () => {
    if (!shouldRecordView || !currentUser || !ndk || !video?.identification) {
      return;
    }

    const viewEvent = await markView({
      eventIdentifier: video.identification,
      ndk,
      pubKey: currentUser.pubkey
    });

    if (!viewEvent) {
      return;
    }

    await viewEvent.publish();
    if (video.event) {
      recordWatchHistory(video.event);
    }
    setShouldRecordView(false);
  };

  return {
    video,
    assets: assets ?? { variants: [], audioTracks: [] },
    handleCanPlay
  };
}
