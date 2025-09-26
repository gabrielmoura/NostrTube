import type {StateCreator} from "zustand/index";
import type {NDKEvent} from "@nostr-dev-kit/ndk-hooks";
import {extractTag} from "@/helper/extractTag.ts";
import {AgeEnum} from "@/store/store/sessionTypes.ts";

interface VideoSessionAction {
    clanSession: () => void,
    setVideo: (vet: NDKEvent) => void
}
export interface VideoSession {
    session?: {
        event: NDKEvent
        likes?: NDKEvent[],
        comments?: NDKEvent[],
        views?: NDKEvent[],
        title: string,
        summary: string,
        content: string,
        url: string,
        fallbacks?: string[],
        nsfw: boolean,
        age?: AgeEnum,
        identification:string
        image?:string
    }
}
export type VideoStore = VideoSession & VideoSessionAction;

export const createVideoSlice: StateCreator<
    VideoStore,
    [["zustand/devtools", never]],
    []
> = (set) => {
    return ({
        session: undefined,
        clanSession: () => set(() => ({session: undefined}), false, "clanSession"),
        setVideo: (e) => {
            const tEvent = extractTag(e.tags)

            return set(({session}) => ({
                session: {
                    ...session,
                    event: e,
                    title: tEvent.title,
                    summary: tEvent.summary,
                    url: tEvent.url,
                    identification: e.dTag,
                    image: tEvent.image
                }
            }), false, "SetVideo")
        }
    });
};

