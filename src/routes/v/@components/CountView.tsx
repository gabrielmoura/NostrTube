import {useEffect} from "react";
import {NDKEvent, useNDK, useNDKCurrentPubkey} from "@nostr-dev-kit/ndk-hooks";
import {NostrKind} from "@/helper/type.ts";
import type {NDKKind} from "@nostr-dev-kit/ndk";
import {makeEvent} from "@/helper/pow/pow.ts";
import {nostrNow} from "@/helper/date.ts";
import {getTagValue} from "@welshman/util";

interface CountViewProps {
    eventIdentifier: string
}

export default function CountView({eventIdentifier}: CountViewProps) {
    const {ndk} = useNDK()
    const currentPubkey = useNDKCurrentPubkey()


    const handleView = async () => {
        if (!ndk || !currentPubkey) return;
        let viewEvent: NDKEvent | null = await ndk.fetchEvent({
            authors: [currentPubkey],
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
                    pubkey: currentPubkey
                },
                difficulty: 0,
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
                    pubkey: currentPubkey
                },
                difficulty: 0,
            });
        }
        await viewEvent.publish()
    }


    useEffect(() => {
        handleView()
            .catch(console.error)
    }, [handleView]);
    return ""
}