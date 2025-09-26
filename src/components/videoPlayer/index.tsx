//@vidstack/react
// Base styles for media player and provider (~400B).
import '@vidstack/react/player/styles/base.css';
import {MediaPlayer, MediaPlayerInstance, MediaProvider, Poster} from '@vidstack/react';
// See "Icons" component page for setup before importing the following:
import type {DataVideo} from "./types.ts";
import {useRef} from "react";
import {VideoLayout} from "./layout.tsx";
import {imageNewSrc} from "@/helper/http.ts";
import {cn} from "@/helper/format.ts";

interface VideoPlayerParams extends DataVideo {
    onCanPlay?: () => void,
    className?: string
}

export function VideoPlayer({image, src, title, onCanPlay, className}: VideoPlayerParams) {
    let player = useRef<MediaPlayerInstance>();

    // player.onplay((this: GlobalEventHandlers, ev: Event)=>function (this: GlobalEventHandlers, ev: Event) {
    //     this.addEventListener("")
    // })


    // function onProviderChange(
    //     provider: MediaProviderAdapter ,
    //     // nativeEvent: MediaProviderChangeEvent,
    // ) {
    //     // We can configure provider's here.
    //     if (isHLSProvider(provider)) {
    //         provider.config = {};
    //     }
    // }


    return <MediaPlayer
        className={cn(
            "bg-muted-background group relative aspect-video h-auto w-full overflow-hidden font-sans text-foreground ring-media-focus @container data-[focus]:ring-4 data-[hocus]:ring-4",
            className
        )}
        title={title} src={src}
        crossOrigin
        playsinline
        // onProviderChange={onProviderChange}
        // onCanPlay={onCanPlay}
        onPlay={onCanPlay}
        ref={player}
        autoplay={false}
        logLevel='warn'
        viewType='video'
        streamType='on-demand'
    >


        <MediaProvider>
            <Poster
                className="absolute inset-0 block h-full w-full border-0 object-cover opacity-0 outline-none ring-0 transition-opacity data-[visible]:opacity-100"
                src={imageNewSrc(image, "500")}
                alt={title}
            />
        </MediaProvider>


        <VideoLayout persistentProgress={true}/>
    </MediaPlayer>
}