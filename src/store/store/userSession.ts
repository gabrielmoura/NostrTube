import {AgeEnum} from "@/store/store/sessionTypes.ts";
import type {StateCreator} from "zustand/index";
import type {NDKUserProfile} from "@nostr-dev-kit/ndk-hooks";

export interface UserSession {
    session?: {
        profile: NDKUserProfile
        darkTheme: boolean,
        nsfw: boolean,
        age?: AgeEnum,
        mirrors?: string[]
    }
}

interface UserSessionAction {
    clanSession: () => void
    SetProfile: (p: NDKUserProfile) => void
}

export type UserStore = UserSession & UserSessionAction;

export const createUserSlice: StateCreator<
    UserStore,
    [["zustand/devtools", never]],
    []
> = (set, get) => {
    return ({
        session: undefined,
        clanSession: () => set(() => ({session: undefined}), false, "clanSession"),
        SetProfile: (p) => set(() => ({
            session: {
                ...get().session,
                profile: p,
                darkTheme: false,
                nsfw: false
            }
        }), false, "SetProfile")
    });
};
