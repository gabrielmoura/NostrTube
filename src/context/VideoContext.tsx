import {createContext, ReactNode, useContext, useEffect} from 'react';
import type {NDKEvent} from "@nostr-dev-kit/ndk-hooks";
import {extractTag} from "@/helper/extractTag.ts";
import useVideoStore from "@/store/videoStore.ts";

export interface VideoContextType {
    title: string
}

// Crie o contexto para o App
// eslint-disable-next-line react-refresh/only-export-components
export const VideoContext = createContext<Partial<VideoContextType>>({});

// Crie o provedor de contexto para o App
export function VideoProvider({children, event}: { children: ReactNode, event: NDKEvent }) {
    const {title} = extractTag(event.tags)
    const setVideo = useVideoStore(s => s.setVideo)

    useEffect(() => {
        document.title = title!
        setVideo(event)
    }, [event, setVideo, title]);
    return <VideoContext.Provider value={{title}}>{children}</VideoContext.Provider>;
}

// Crie um hook personalizado para acessar o contexto do App
// eslint-disable-next-line react-refresh/only-export-components
export function useVideoContext(): Partial<VideoContextType> {
    const context = useContext(VideoContext);
    if (!context) {
        throw new Error('useVideoContext deve ser usado dentro de um VideoProvider');
    }
    return context;
}
