import { useMutation } from "@tanstack/react-query";
import { useNDK, useNDKCurrentUser } from "@nostr-dev-kit/ndk-hooks";
import { NDKEvent } from "@nostr-dev-kit/ndk";
import { nip19 } from "nostr-tools";
import { toast } from "sonner";
import { t } from "i18next";
import { makeEvent, type MakeEventParams } from "@/helper/pow/pow.ts";
import { LoggerAgent } from "@/lib/debug.ts";
import { type VideoMetadata } from "@/store/videoUpload/useVideoUploadStore.ts";
import { buildAddressableVideoEvent } from "@/features/upload/services/video-event-builder.service";

const log = LoggerAgent.create("usePublishVideo");

export interface PublishedVideoResult {
  event: NDKEvent;
  naddr: string;
  shareUrl: string;
}

export function usePublishVideo() {
  const { ndk } = useNDK();
  const currentUser = useNDKCurrentUser();

  const mutation = useMutation({
    mutationKey: ["event:generate:new:video"],
    mutationFn: ({ ndk, event, difficulty }: MakeEventParams): Promise<NDKEvent> =>
      makeEvent({ ndk, event, difficulty }),
    onError: (error) => {
      log.error("Um erro encontrado", error);
      toast.error("Um erro encontrado");
    }
  });

  const publish = async (snap: Partial<VideoMetadata>): Promise<PublishedVideoResult | undefined> => {
    if (!ndk || !currentUser) return;
    if (!snap.url || !snap.title) {
      toast.warning(t("missing_fields", "Please fill in all required fields"));
      return;
    }

    try {
      const addressableEvent = buildAddressableVideoEvent({
        draft: snap,
        currentPubkey: currentUser.pubkey
      });

      const event = await mutation.mutateAsync({
        ndk,
        event: {
          ...addressableEvent
        },
        difficulty: 16
      });

      await event.publish();

      const naddr = nip19.naddrEncode({
        identifier: event.dTag!,
        relays: import.meta.env.PROD
          ? import.meta.env.VITE_NOSTR_RELAYS
          : import.meta.env.VITE_NOSTR_DEV_RELAYS,
        pubkey: event.pubkey,
        kind: event.kind!
      });

      const shareUrl = `${import.meta.env.VITE_PUBLIC_ROOT_DOMAIN ?? location.origin}/v/${naddr}`;
      toast.success(t("video_published_successfully", "Video published successfully"));
      return { event, naddr, shareUrl };
    } catch (err) {
      log.error("error publishing event", err);
      toast.error(t("error_publishing_video", "Error publishing video"));
      return undefined;
    }
  };

  return {
    publish,
    isPending: mutation.isPending
  };
}
