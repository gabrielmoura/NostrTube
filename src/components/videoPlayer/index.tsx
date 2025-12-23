// @vidstack/react
import "@vidstack/react/player/styles/base.css";

import {
  isHLSProvider,
  MediaPlayer,
  type MediaPlayerInstance,
  MediaProvider,
  type MediaProviderAdapter,
  Poster,
} from "@vidstack/react";

import { useEffect, useRef } from "react";
import type { DataVideo } from "./types.ts";
import { VideoLayout } from "./layout.tsx";
import { getOptimizedImageSrc } from "@/helper/http.ts";
import { cn } from "@/helper/format.ts";

interface VideoPlayerParams extends DataVideo {
  onCanPlay?: () => void;
  className?: string;
}

export function VideoPlayer({
                              image,
                              src,
                              title,
                              onCanPlay,
                              className,
                            }: VideoPlayerParams) {
  const playerRef = useRef<MediaPlayerInstance | null>(null);

  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;

    return player.subscribe(({ paused, viewType, error }) => {
      if (error) {
        console.error("Media Player Error:", error);
      }

      if (import.meta.env.DEV) {
        console.debug("view:", viewType, "paused:", paused);
      }
    });
  }, []);

  function onProviderChange(provider: MediaProviderAdapter) {
    if (isHLSProvider(provider)) {
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
      logLevel={import.meta.env.PROD ? "warn" : "debug"}
      onProviderChange={onProviderChange}
      onCanPlay={onCanPlay}
    >
      <MediaProvider>
        <source src={src} type="video/mp4" />

        <Poster
          className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity data-[visible]:opacity-100"
          src={getOptimizedImageSrc(image, "500")}
          alt={title}
        />
      </MediaProvider>

      <VideoLayout persistentProgress />
    </MediaPlayer>
  );
}
