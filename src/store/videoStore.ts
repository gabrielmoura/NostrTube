import {create} from "zustand/index";
import {devtools} from "zustand/middleware";
import type {VideoStore} from "@/store/store/videoSession.ts";
import {createVideoSlice} from "@/store/store/videoSession.ts";

const _video_store_name = "video-session"

const useVideoStore = create<VideoStore>()(
    devtools(
        (...a) => ({
            ...createVideoSlice(...a),
        })
        , {
            name: _video_store_name,
            trace: import.meta.env.DEV,
            enabled: import.meta.env.DEV,
        })
)


export const {setVideo}: VideoStore = useVideoStore.getState()
export default useVideoStore;