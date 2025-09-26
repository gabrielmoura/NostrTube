import {create} from "zustand";
import {createJSONStorage, devtools, persist} from "zustand/middleware";
import type {UserStore} from "@/store/store/userSession.ts";
import {createUserSlice} from "@/store/store/userSession.ts";

const _user_store_name = "user-session"

const useUserStore = create<UserStore>()(
    devtools(
        persist(
            (...a) => ({
                ...createUserSlice(...a),
            }),
            {
                name: _user_store_name,
                storage: createJSONStorage(() => sessionStorage),
            }
        ), {
            name: _user_store_name,
            trace: import.meta.env.DEV,
            enabled: import.meta.env.DEV,
        })
)

export default useUserStore;