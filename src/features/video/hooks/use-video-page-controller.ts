import { useState } from "react";
import { useNDK, useNDKCurrentUser } from "@nostr-dev-kit/ndk-hooks";
import { useRecordView } from "@/hooks/useRecordView";
import { useVideoContext } from "@/context/VideoContext";

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
    setShouldRecordView(false);
  };

  return {
    video,
    assets: assets ?? { variants: [], audioTracks: [] },
    handleCanPlay
  };
}
