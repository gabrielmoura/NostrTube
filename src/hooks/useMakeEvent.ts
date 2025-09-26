import {useMutation} from "@tanstack/react-query";
import {makeEvent,type  makeEventParams} from "@/helper/pow/pow.ts";
import {NDKEvent} from "@nostr-dev-kit/ndk-hooks";
import {nip19} from "nostr-tools";

interface useMakeEventParams extends makeEventParams {
    id: string
}

function useMakeEvent({ndk, event, difficulty, id}: useMakeEventParams) {
    return useMutation({
        mutationKey: [id],
        mutationFn: ({ndk, event, difficulty}: makeEventParams): Promise<NDKEvent> => makeEvent({
            ndk,
            event,
            difficulty
        }),
        onSuccess: async (event: NDKEvent) => {
            await event.publish()
            const nip19Encode = nip19.naddrEncode({
                identifier: event.dTag,
                relays: import.meta.env.PROD ? import.meta.env.VITE_NOSTR_RELAYS?.split(",") : import.meta.env.VITE_NOSTR_DEV_RELAYS?.split(","),
                pubkey: event.pubkey,
                kind: event.kind
            })
            // const encodedEvent = event.encode();
            await navigate({to: "/v/$eventId", params: {eventId: nip19Encode}})
            // router.push(`/v/${encodedEvent}`);
        }
    })
}