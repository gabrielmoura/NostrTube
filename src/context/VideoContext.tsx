import { createContext, type ReactNode, useContext, useEffect, useState } from "react";
import type { NDKEvent } from "@nostr-dev-kit/ndk-hooks";
import { useNDK } from "@nostr-dev-kit/ndk-hooks";
import { extractTag } from "@/helper/extractTag.ts";
import { useParams } from "@tanstack/react-router";
import { NotFoundVideo } from "@/routes/v/@components/NotFoundVideo.tsx";
import type { VideoMetaTypes } from "@/store/store/videoSession.ts";
import { getTags, getTagValue } from "@welshman/util";
import { mapImetaTag } from "@nostr-dev-kit/ndk";
import { geVideoByEventIdData, type GeVideoByEventIdDataParams } from "@/helper/loaders/geVideoByEventIdData.ts";

export interface VideoContextType {
  eventId: string,
  event: NDKEvent,
  video: Partial<VideoMetaTypes>
}

// Crie o contexto para o App
// eslint-disable-next-line react-refresh/only-export-components
export const VideoContext = createContext<Partial<VideoContextType>>({});

function wrapSetVideo(setVideoState: (value: (((prevState: Partial<VideoMetaTypes>) => Partial<VideoMetaTypes>) | Partial<VideoMetaTypes>)) => void) {
  return (event: NDKEvent) => {
    const tEvent = extractTag(event.tags);
    let url: string;
    let image: string | undefined;
    let fallbacks: string[] | undefined;


    if (getTags("imeta", event.tags).length > 0) {
      getTags("imeta", event.tags).forEach((imetaTag) => {
        const imeta = mapImetaTag(imetaTag);
        if (imeta.url) {
          url = imeta.url;
        }
        if (imeta.image) {
          image = imeta.image;
        }
        if (imeta.fallback) {
          fallbacks = imeta.fallback;
        }
      });
    } else {
      url = tEvent.url ?? getTagValue("src", event.tags)!;
    }

    setVideoState({
      event: event,
      title: tEvent.title,
      summary: tEvent.summary,
      url: url,
      identification: event.dTag,
      image: tEvent.image || image,
      fallbacks: fallbacks
    });
  };
}

// Crie o provedor de contexto para o App
export function VideoProvider({ children, event }: {
  children: ReactNode,
  event?: NDKEvent,
  video?: Partial<VideoMetaTypes>
}) {
  const { ndk } = useNDK();
  const { eventId } = useParams({ from: "/v/$eventId" });

  const [isNotFound, setNotFound] = useState(false);
  const [video, setVideoState] = useState<Partial<VideoMetaTypes>>(null);

  useEffect(() => {
    if (event) {
      wrapSetVideo(setVideoState)(event);
    } else {
      geVideoByEventIdData({ eventId, ndk } as GeVideoByEventIdDataParams)
        .then((event) => {
          wrapSetVideo(setVideoState)(event);
        })
        .catch(e => {
          if (import.meta.env.DEV) {
            console.error("Erro ao buscar evento manualmente", e);
          }
          if (e.isNotFound) {
            setNotFound(e.isNotFound);
          }
        });

    }
  }, [event, eventId, ndk]);
  if (isNotFound) {
    return <NotFoundVideo />;
  }

  return <VideoContext.Provider
    value={{ eventId: eventId as string, event, video }}>{children}</VideoContext.Provider>;
}

// Crie um hook personalizado para acessar o contexto do App
// eslint-disable-next-line react-refresh/only-export-components
export function useVideoContext(): Partial<VideoContextType> {
  const context = useContext(VideoContext);
  if (!context) {
    throw new Error("useVideoContext deve ser usado dentro de um VideoProvider");
  }
  return context;
}
