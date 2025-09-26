import type {NDKFilter} from "@nostr-dev-kit/ndk";
import NDK__default, {NDKKind} from "@nostr-dev-kit/ndk";
import {nip19} from "nostr-tools";
import {NDKSubscriptionCacheUsage} from "@nostr-dev-kit/ndk-hooks";
import {notFound} from "@tanstack/react-router";
import {z} from "zod";

// --> Busca Vídeos por eventId
export type GeVideoByEventIdDataParams = {
    ndk: NDK__default;
    eventId: string;
};

export async function geVideoByEventIdData({ndk, eventId}: GeVideoByEventIdDataParams) {
    if (!eventId) {
        throw new Error("No ID provided");
    }

    if (eventId.length <= 5) {
        throw new Error("ID invalid");
    }

    let filters: NDKFilter[] = [];

    if (eventId.startsWith("n")) {
        const {type, data} = nip19.decode(eventId);

        switch (type) {
            case "note":
                filters = [
                    {
                        ids: [data],
                        limit: 1,
                    },
                ];
                break
            case "naddr":
                filters = [
                    {
                        authors: [data.pubkey],
                        kinds: [data.kind],
                        "#d": [data.identifier],
                        limit: 1,
                    },
                ];
                break
            //{"id":"3f834227bf13befa879719591b4c519d11b4cf46b6122891fe8af7285ced0cb1","relays":["ws://localhost:4869/","ws://localhost:4869/"],"author":"91bea5cd9361504c409aaf459516988f68a2fcd482762fd969a7cdc71df4451c"}
            case "nevent":
                filters = [
                    {
                        ids: [data.id],
                        authors: [data.author],
                        limit: 1,
                    },
                ];
                break
            default:
                throw new Error(`Invalid ID provided: ${type} ${JSON.stringify(data)}`);
        }

    } else if (eventId.length === 64) {
        filters = [
            {
                ids: [eventId],
                limit: 1,
            },
        ];
    } else {
        filters = [
            {
                "#d": [eventId],
                limit: 1,
            },
        ];
    }

    const event = await ndk.fetchEvent(filters, {
        closeOnEose: true,
        cacheUsage: NDKSubscriptionCacheUsage.CACHE_FIRST,
    });
    if (!event) throw notFound();
    return event
}

// --> Busca Eventos por Search ou Tags

export const eventSearchSchema = z.object({
    tag: z.union([z.string(), z.array(z.string())]).optional(),
    search: z.string().optional(),
    nsfw: z.boolean().optional(),
})
export type eventSearchType = z.infer<typeof eventSearchSchema>

export async function getVideosFromSearchData({ndk, search, nsfw, tag}: eventSearchType & { ndk: NDK__default }) {
    const tags = tag
        ? Array.isArray(tag) ? tag.map((t) => ({"#t": [t]})) : {"#t": [tag]}
        : undefined

    const filters: NDKFilter[] = [
        {
            kinds: [NDKKind.Video, NDKKind.HorizontalVideo],
            // limit: 25,
            ...(search ? {search} : {}),
            ...(tags ? tags : {}),
            ...(nsfw ? {"#content-warning": ""} : {}),
        },
    ]
    const events = await ndk.fetchEvents(filters, {
        // closeOnEose: true,
        cacheUsage: NDKSubscriptionCacheUsage.CACHE_FIRST,
    })
    if (!events || events.size === 0) {
        throw notFound()
    }

    return events
}

// --> Busca Eventos e Metadados de um usuário

export type GetVideosFromUserDataParams = {
    ndk: NDK__default;
    userId: string;
};

export async function getVideosFromUserData({ndk, userId}: GetVideosFromUserDataParams) {
    if (!userId) {
        throw new Error("No ID provided");
    }

    if (userId.length <= 5) {
        throw new Error("ID invalid");
    }

    let id: string

    if (userId.startsWith("n")) {
        const {type, data} = nip19.decode(userId);


        if (!["npub", "nprofile"].includes(type)) {
            throw new Error(`Invalid ID provided: ${type}`);
        }
        id = data as string

    } else {
        id = userId
    }
    const filters: NDKFilter[] = [
        {
            authors: [id],
            kinds: [NDKKind.Video, NDKKind.HorizontalVideo],
            limit: 25
        }, {
            authors: [id],
            kinds: [NDKKind.Metadata],
            limit: 1
        }];

    const events = await ndk.fetchEvents(filters, {
        closeOnEose: true,
        cacheUsage: NDKSubscriptionCacheUsage.CACHE_FIRST,

    });
    if (!events) throw notFound();
    if (events.size === 0) throw notFound();
    return events
}
