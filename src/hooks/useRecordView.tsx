import type {NDKEvent} from "@nostr-dev-kit/ndk-hooks";
import type {NDKKind} from "@nostr-dev-kit/ndk";
import {makeEvent} from "@/helper/pow/pow.ts";
import {nostrNow} from "@/helper/date.ts";
import {NostrKind} from "@/helper/type.ts";
import {getTagValue} from "@welshman/util";

export async function RecordView({currentUser, eventIdentifier, ndk}): Promise<NDKEvent> {
    if (!ndk || !currentUser) return;
    try {
        let viewEvent: NDKEvent | null = await ndk.fetchEvent({
            authors: [currentUser.pubkey],
            kinds: [NostrKind.VideoViewer as NDKKind],
            "#a": [eventIdentifier],
        });

        if (!viewEvent) {
            viewEvent = await makeEvent({
                ndk, event: {
                    content: "",
                    kind: NostrKind.VideoViewer as NDKKind,
                    tags: [
                        ["a", eventIdentifier],
                        ["d", eventIdentifier],
                        ["viewed", "0"],
                    ],
                    created_at: nostrNow(),
                    pubkey: currentUser.pubkey
                }
            });
        } else {
            const viewed = getTagValue("viewed", viewEvent.tags)
            let n: number
            if (typeof viewed === "string") {
                n = parseInt(viewed)
            }
            const newValue = n + 1


            viewEvent = await makeEvent({
                ndk, event: {
                    content: "",
                    kind: NostrKind.VideoViewer as NDKKind,
                    tags: [
                        ["a", eventIdentifier],
                        ["d", eventIdentifier],
                        ["viewed", newValue.toString()],
                    ],
                    created_at: nostrNow(),
                    pubkey: currentUser.pubkey
                }
            });
        }

        await viewEvent.publish()
        return viewEvent
    } catch (err) {
        console.log("Error recoring view", err);
    }
}