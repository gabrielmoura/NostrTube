import { useMutation } from "@tanstack/react-query";
import { useNDK, useNDKCurrentUser } from "@nostr-dev-kit/ndk-hooks";
import { NDKEvent, NDKKind } from "@nostr-dev-kit/ndk";
import { nip19 } from "nostr-tools";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
import { t } from "i18next";
import { makeEvent, type MakeEventParams } from "@/helper/pow/pow.ts";
import { generateVideoTags } from "@/hooks/gentTags.ts";
import { nostrNow } from "@/helper/date.ts";

import { LoggerAgent } from "@/lib/debug.ts";
import { useVideoUploadStore, type VideoMetadata } from "@/store/videoUpload/useVideoUploadStore.ts";

const log = LoggerAgent.create("usePublishVideo");

export function usePublishVideo() {
  const navigate = useNavigate();
  const { ndk } = useNDK();
  const currentUser = useNDKCurrentUser();
  const resetForm = useVideoUploadStore((s) => s.resetForm);

  const mutation = useMutation({
    mutationKey: ["event:generate:new:video"],
    mutationFn: ({ ndk, event, difficulty }: MakeEventParams): Promise<NDKEvent> =>
      makeEvent({ ndk, event, difficulty }),
    onSuccess: async (event: NDKEvent) => {
      try {
        await event.publish();
        const nip19Encode = nip19.naddrEncode({
          identifier: event.dTag!,
          relays: import.meta.env.PROD
            ? import.meta.env.VITE_NOSTR_RELAYS
            : import.meta.env.VITE_NOSTR_DEV_RELAYS,
          pubkey: event.pubkey,
          kind: event.kind!
        });

        toast.success(t("video_published_successfully", "Video published successfully"));
        await navigate({
          to: "/v/$eventId",
          params: { eventId: nip19Encode }
        }).catch(e => log.info("Fail to redirect", e, nip19Encode)).then(() => {
          resetForm();
        });
      } catch (err) {
        log.error("error publishing event", err);
        toast.error(t("error_publishing_video", "Error publishing video"));
      }
    },
    onError: (e) => {
      log.error("Um erro encontrado", e);
      toast.error("Um erro encontrado");
    }
  });

  const publish = (snap: Partial<VideoMetadata>) => {
    if (!ndk || !currentUser) return;
    if (!snap.url || !snap.title) {
      toast.warning(t("missing_fields", "Please fill in all required fields"));
      return;
    }

    try {
      const tags = generateVideoTags({
        ...snap,
        currentPubkey: currentUser.pubkey
      });

      mutation.mutate({
        ndk,
        event: {
          tags,
          pubkey: currentUser.pubkey,
          kind: NDKKind.Video,
          content: snap.summary ?? "",
          created_at: nostrNow()
        },
        difficulty: 16
      });
    } catch (err) {
      log.error("error preparing event", err);
      toast.error("Error preparing event");
    }
  };

  return {
    publish,
    isPending: mutation.isPending
  };
}