// @vidstack/react
import "@vidstack/react/player/styles/base.css";

import {
  isDASHProvider,
  isHLSProvider,
  MediaPlayer,
  type MediaPlayerInstance,
  MediaProvider,
  type MediaProviderAdapter,
  Poster
} from "@vidstack/react";

import { useEffect, useRef } from "react";
import type { DataVideo } from "./types.ts";
import { VideoLayout } from "./layout.tsx";
import { getOptimizedImageSrc } from "@/helper/http.ts";
import { cn } from "@/helper/format.ts";
import useImageProxySettingsStore from "@/store/useImageProxySettingsStore.ts";
import useUserStore from "@/store/useUserStore.ts";

interface VideoPlayerParams extends DataVideo {
  onCanPlay?: () => void;
  onPlaybackError?: () => void;
  className?: string;
}

export function VideoPlayer({
                              image,
                              src,
                              sourceMimeType,
                              title,
                              onCanPlay,
                              onPlaybackError,
                              className
                             }: VideoPlayerParams) {
  const playerRef = useRef<MediaPlayerInstance | null>(null);
  const handledErrorForSourceRef = useRef<string | null>(null);
  const persistedMuted = useUserStore((state) => state.session?.videoMuted ?? true);
  const setVideoMuted = useUserStore((state) => state.setVideoMuted);
  const imageProxy = useImageProxySettingsStore((state) => state.imageProxy);

  useEffect(() => {
    handledErrorForSourceRef.current = null;
  }, []);

  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;

    let errorLogged = false;

    return player.subscribe(({ error }) => {
      if (error && !errorLogged) {
        errorLogged = true;
        if (handledErrorForSourceRef.current !== src) {
          handledErrorForSourceRef.current = src;
          onPlaybackError?.();
        }
      }
    });
  }, [onPlaybackError, src]);

  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;

    player.muted = persistedMuted;
  }, [persistedMuted]);

  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;

    return player.subscribe(({ muted }) => {
      if (typeof muted === "boolean" && muted !== persistedMuted) {
        setVideoMuted(muted);
      }
    });
  }, [persistedMuted, setVideoMuted]);

  function onProviderChange(provider: MediaProviderAdapter | null) {
    if (!provider) return;
    if (isHLSProvider(provider)) {
      provider.config = {
        backBufferLength: 0,
        lowLatencyMode: false,
      };
    }
    if (isDASHProvider(provider)) {
      provider.config = {};
    }
  }

  return (
    <MediaPlayer
      ref={playerRef}
      className={cn(
        "bg-muted-background group relative aspect-video w-full overflow-hidden font-sans text-foreground ring-media-focus @container data-[focus]:ring-4 data-[hocus]:ring-4",
        className
      )}
      title={title}
      src={src}
      viewType="video"
      streamType="on-demand"
      preload="metadata"
      playsInline
      crossOrigin="anonymous"
      autoplay
      muted={persistedMuted}
      logLevel="warn"
      onProviderChange={onProviderChange}
      onCanPlay={onCanPlay}
      onPlaying={() => {
        handledErrorForSourceRef.current = null;
      }}
    >
      <MediaProvider>
        <source src={src} type={sourceMimeType ?? "video/mp4"} />

        <Poster
          className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity data-[visible]:opacity-100"
          src={getOptimizedImageSrc(image, "500", undefined, imageProxy)}
          alt={title}
        />
      </MediaProvider>

      <VideoLayout persistentProgress />
    </MediaPlayer>
  );
}
