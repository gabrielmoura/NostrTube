import captionStyles from "./captions.module.css";

import { Captions, Controls, Gesture } from "@vidstack/react";

import { TimeGroup } from "./components/time-group";
import { TitleChapter } from "./components/title";

import { Fullscreen, GoogleCast, Mute, PIP, Play } from "./components/buttons.tsx";
import * as Sliders from "./components/sliders.tsx";

import { BufferingIndicator } from "./components/Buffering.tsx";
import { cn } from "@/helper/format.ts";
import { MenuCaptions } from "@/components/videoPlayer/components/MenuCaptions.tsx";
import { Menus } from "@/components/videoPlayer/components/Menu.tsx";


// Offset tooltips/menus/slider previews in the lower controls group so they're clearly visible.
const popupOffset = 30;

export interface VideoLayoutProps {
  thumbnails?: string;
  persistentProgress?: boolean;
}

export function VideoLayout({
                              thumbnails,
                              persistentProgress
                            }: VideoLayoutProps) {
  return (
    <div>
      <BufferingIndicator />
      <Gestures />
      <Captions
        className={`${captionStyles.captions} absolute inset-0 bottom-2 z-10 select-none break-words opacity-0 transition-[opacity,bottom] duration-300 group-hover:opacity-100 media-captions:opacity-100 media-controls:bottom-[85px] media-preview:opacity-0`}
      />
      {persistentProgress && (
        <div className="absolute inset-x-0 bottom-0 flex flex-col justify-end sm:hidden">
          <Sliders.PersistentProgress thumbnails={thumbnails} />
        </div>
      )}
      <Controls.Root className={cn(
        "absolute inset-0 z-10 flex h-full w-full flex-col",
        "opacity-0 transition-opacity duration-300 bg-gradient-to-t from-black/90 via-black/20 to-black/40",
        "data-[visible]:opacity-100"
      )}>

        <div className="flex-1" />
        <Controls.Group className="absolute right-2 top-2 flex items-center rounded-lg border border-white/10 bg-black/45 px-1 shadow-sm backdrop-blur-md">
          <Menus />
        </Controls.Group>
        <Controls.Group className="-mb-2 flex w-full items-center px-2">
          <Sliders.Time thumbnails={thumbnails} />
        </Controls.Group>
        <Controls.Group
          className="-mt-0.5 flex w-full items-center justify-between overflow-hidden border-t border-white/10 bg-black/45 px-1 pb-1 shadow-[0_-8px_24px_rgba(0,0,0,0.25)] backdrop-blur-md">
          <div className="flex grow items-center justify-start overflow-hidden">
            <Play tooltipOffset={popupOffset} />
            <div className="group/volume flex items-center px-1">
              <Mute tooltipOffset={popupOffset} />
              <Sliders.Volume />
            </div>
            <TimeGroup />
            <TitleChapter />
          </div>
          <div className="flex-1" />
          <div className="flex gap-x-1">
            <MenuCaptions
              offset={popupOffset}
              tooltipOffset={popupOffset}
            />
            <GoogleCast tooltipOffset={popupOffset} />
            <PIP tooltipOffset={popupOffset} />
            <Fullscreen
              tooltipOffset={popupOffset}
            />
          </div>
        </Controls.Group>


      </Controls.Root>

    </div>
  );
}

function Gestures() {
  return (
    <>
      <Gesture
        className="absolute inset-0 z-0 block h-full w-full"
        event="pointerup"
        action="toggle:paused"
      />
      <Gesture
        className="absolute inset-0 z-0 block h-full w-full"
        event="dblpointerup"
        action="toggle:fullscreen"
      />
      <Gesture
        className="absolute left-0 top-0 z-10 block h-full w-1/5"
        event="dblpointerup"
        action="seek:-10"
      />
      <Gesture
        className="absolute right-0 top-0 z-10 block h-full w-1/5"
        event="dblpointerup"
        action="seek:10"
      />
    </>
  );
}
