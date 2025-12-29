import { createContext, type ReactNode, useContext } from "react";
import { Route } from "@/routes/v/$eventId.tsx"; // Importa a rota para tipagem e loader
import { mapEventToVideoMeta } from "@/helper/videoMapper.ts";
import type { NDKEvent } from "@nostr-dev-kit/ndk";
import type { VideoMetaTypes } from "@/store/store/videoSession.ts";

// eslint-disable-next-line react-refresh/only-export-components
export const VideoContext = createContext<VideoContextType | null>(null);

export function VideoProvider({ children, event: overrideEvent }: {
  children: ReactNode;
  event?: NDKEvent // Caso você ainda precise injetar um evento manualmente (ex: Modais)
}) {
  // Hook do TanStack Router que pega os dados já resolvidos pelo loader
  const loaderData = Route.useLoaderData();

  // Se houver um overrideEvent (prop), re-mapeamos, senão usamos o do loader
  const value: VideoContextType = {
    eventId: loaderData.eventId,
    video: overrideEvent ? mapEventToVideoMeta(overrideEvent) : loaderData.video,
    event: overrideEvent || loaderData.event
  };

  return (
    <VideoContext.Provider value={value}>
      {children}
    </VideoContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useVideoContext() {
  const context = useContext(VideoContext);
  if (!context) {
    throw new Error("useVideoContext deve ser usado dentro de um VideoProvider");
  }
  return context;
}

/**
 * Interface que representa o estado consolidado do vídeo no contexto.
 */
export interface VideoContextType {
  /** ID do evento extraído da URL ou da rota */
  eventId: string;

  /** O evento original do Nostr (NDK), útil para ações como reações ou zaps */
  event: NDKEvent;

  /** * Metadados processados e limpos para uso na UI (título, url, fallbacks, etc).
   * Usamos VideoMetaTypes para garantir consistência com o restante do app.
   */
  video: VideoMetaTypes;
}

/**
 * Interface auxiliar caso você precise lidar com estados de carregamento
 * fora do loader do TanStack Router (opcional)
 */
export interface VideoStateContextType extends VideoContextType {
  isLoading: boolean;
  error: Error | null;
}