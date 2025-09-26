import captionStyles from "./captions.module.css";

import {Captions, Controls, Gesture} from "@vidstack/react";

import {TimeGroup} from "./components/time-group";
import {Title} from "./components/title";

import {Fullscreen, Mute, PIP, Play} from "./components/buttons.tsx";
import * as Sliders from "./components/sliders.tsx";

import {BufferingIndicator} from "./components/Buffering.tsx";
import {cn} from "@/helper/format.ts";

// Offset tooltips/menus/slider previews in the lower controls group so they're clearly visible.
const popupOffset = 30;

export interface VideoLayoutProps {
    thumbnails?: string;
    persistentProgress?: boolean;
}

export function VideoLayout({
                                thumbnails,
                                persistentProgress,
                            }: VideoLayoutProps) {
    return (
        <div>
            <BufferingIndicator/>
            <Gestures/>
            <Captions
                className={`${captionStyles.captions} absolute inset-0 bottom-2 z-10 select-none break-words opacity-0 transition-[opacity,bottom] duration-300 group-hover:opacity-100 media-captions:opacity-100 media-controls:bottom-[85px] media-preview:opacity-0`}
            />
            {persistentProgress && (
                <div className="absolute inset-x-0 bottom-0 flex flex-col justify-end sm:hidden">
                    <Sliders.PersistentProgress thumbnails={thumbnails}/>
                </div>
            )}
            <Controls.Root className={cn(
                "absolute inset-0 z-10 flex h-full w-full flex-col",
                "data-[visible]:opacity-90 opacity-0 transition-opacity bg-gradient-to-t from-background/80 via-transparent to-transparent",
                "data-[visible]:duration-300 data-[visible]:ease-in"
            )}>

                <div className="flex-1"/>
                <Controls.Group className="absolute right-0 top-0 flex items-center px-2">
                    {/*<Menus.Settings />*/}
                </Controls.Group>
                <Controls.Group className="-mb-2 flex w-full items-center px-2">
                    <Sliders.Time thumbnails={thumbnails}/>
                </Controls.Group>
                <Controls.Group
                    className="-mt-0.5 flex w-full items-center justify-between overflow-hidden px-0.5 pb-0.5">
                    <div className="flex grow items-center justify-start overflow-hidden">
                        <Play tooltipOffset={popupOffset}/>
                        <div className="group/volume flex items-center px-1">
                            <Mute tooltipOffset={popupOffset}/>
                            <Sliders.Volume/>
                        </div>
                        <TimeGroup/>
                        <Title/>
                    </div>
                    <div className="flex-1"/>
                    <div className="flex gap-x-1">
                        {/*<Menus.Captions*/}
                        {/*    offset={popupOffset}*/}
                        {/*    tooltipOffset={popupOffset}*/}
                        {/*/>*/}
                        <PIP tooltipOffset={popupOffset}/>
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