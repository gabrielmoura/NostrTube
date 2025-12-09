import { makeEvent } from "@/helper/pow/pow.ts";
import { nostrNow } from "@/helper/date.ts";
import NDK__default, { type NDKEvent, NDKKind } from "@nostr-dev-kit/ndk";

export interface reportVideoActionProps {
  id: string;
  description?: string;
  category: string;
  pubkey: string;
  ndk: NDK__default;
}

export async function reportVideoAction({
                                          id,
                                          description,
                                          ndk,
                                          pubkey,
                                          category
                                        }: reportVideoActionProps): Promise<NDKEvent> {
  const reportEvent = await makeEvent({
    difficulty: 10,
    event: {
      created_at: nostrNow(),
      kind: NDKKind.Report,
      content: description || "",
      tags: [
        ["alt", `Report for ${category}`],
        ["e", id, category]
      ],
      pubkey
    },
    ndk
  });
  await reportEvent.sign();
  await reportEvent.publish();
  return reportEvent;
}