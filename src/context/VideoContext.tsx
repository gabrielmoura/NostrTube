import {createContext, ReactNode, useContext, useEffect, useState} from 'react';
import type {NDKEvent} from "@nostr-dev-kit/ndk-hooks";
import {useNDK} from "@nostr-dev-kit/ndk-hooks";
import {extractTag} from "@/helper/extractTag.ts";
import {useParams} from "@tanstack/react-router";
import {geVideoByEventIdData, GeVideoByEventIdDataParams} from "@/helper/nostr.ts";
import useVideoStore from "@/store/videoStore.ts";
import {NotFoundVideo} from "@/routes/v/@components/NotFoundVideo.tsx";

export interface VideoContextType {
    eventId: string,
    event: NDKEvent
}

// Crie o contexto para o App
// eslint-disable-next-line react-refresh/only-export-components
export const VideoContext = createContext<Partial<VideoContextType>>({});

// Crie o provedor de contexto para o App
export function VideoProvider({children, event}: { children: ReactNode, event?: NDKEvent }) {
    const {ndk} = useNDK()
    const {eventId} = useParams({from: "/v/$eventId"})
    const setVideo = useVideoStore(s => s.setVideo!)
    const [isNotFound, setNotFound] = useState(false)


    useEffect(() => {
        if (event) {
            const {title} = extractTag(event.tags)
            document.title = title!
            setVideo(event)
        } else {
            geVideoByEventIdData({eventId, ndk} as GeVideoByEventIdDataParams)
                .then((event) => {
                    const {title} = extractTag(event.tags)
                    document.title = title!
                    setVideo(event)
                })
                .catch(e => {
                    if (import.meta.env.DEV) {
                        console.error("Erro ao buscar evento manualmente", e)
                    }
                    if (e.isNotFound) {
                        setNotFound(e.isNotFound)
                    }
                })
        }
    }, [event, eventId, ndk, setVideo]);
    if (isNotFound) {
        return <NotFoundVideo/>
    }

    return <VideoContext.Provider
        value={{eventId: eventId as string, event}}>{children}</VideoContext.Provider>;
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
