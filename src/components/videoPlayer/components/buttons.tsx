import {
    CaptionButton,
    FullscreenButton,
    isTrackCaptionKind,
    MuteButton,
    PIPButton,
    PlayButton,
    useMediaState,
} from "@vidstack/react";

import {
    RiClosedCaptioningFill as SubtitlesIcon,
    RiFullscreenExitFill as FullscreenExitIcon,
    RiFullscreenFill as FullscreenIcon,
    RiPauseFill as PauseIcon,
    RiPictureInPicture2Fill as PictureInPictureIcon,
    RiPictureInPictureExitFill as PictureInPictureExitIcon,
    RiPlayFill as PlayIcon,
    RiSettings3Fill as SettingsIcon,
    RiVolumeDownFill as VolumeLowIcon,
    RiVolumeMuteFill as MuteIcon,
    RiVolumeUpFill as VolumeHighIcon,
} from "react-icons/ri";

import {Popover} from "@radix-ui/themes";

export interface MediaButtonProps {
    tooltipOffset?: number;
}

export const buttonClass =
    "group ring-media-focus relative inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-md outline-none ring-inset hover:bg-white/10 focus-visible:ring-4 aria-disabled:hidden";

export const tooltipClass =
    "animate-out fade-out slide-out-to-bottom-2 data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in data-[state=delayed-open]:slide-in-from-bottom-4 z-10 rounded-sm bg-black/90 px-2 py-0.5 text-sm font-medium text-white parent-data-[open]:hidden";

export function Play({
                         tooltipOffset = 0,

                     }: MediaButtonProps) {
    const isPaused = useMediaState("paused");
    return (
        <Popover.Root>
            <Popover.Trigger>
                <PlayButton className={buttonClass}>
                    {isPaused ? (
                        <PlayIcon className="h-7 w-7 translate-x-px"/>
                    ) : (
                        <PauseIcon className="h-7 w-7"/>
                    )}
                </PlayButton>
            </Popover.Trigger>
            <Popover.Content
                className={tooltipClass}

                sideOffset={tooltipOffset}
            >
                {isPaused ? "Play" : "Pause"}
            </Popover.Content>
        </Popover.Root>
    );
}

export function Mute({
                         tooltipOffset = 0,

                     }: MediaButtonProps) {
    const volume = useMediaState("volume"),
        isMuted = useMediaState("muted");
    return (
        <Popover.Root>
            <Popover.Trigger>
                <MuteButton className={buttonClass}>
                    {isMuted || volume == 0 ? (
                        <MuteIcon className="h-6 w-6"/>
                    ) : volume < 0.5 ? (
                        <VolumeLowIcon className="h-6 w-6"/>
                    ) : (
                        <VolumeHighIcon className="h-6 w-6"/>
                    )}
                </MuteButton>
            </Popover.Trigger>
            <Popover.Content
                className={tooltipClass}

                sideOffset={tooltipOffset}
            >
                {isMuted ? "Unmute" : "Mute"}
            </Popover.Content>
        </Popover.Root>
    );
}

export function Caption({
                            tooltipOffset = 0,

                        }: MediaButtonProps) {
    const track = useMediaState("textTrack"),
        isOn = track && isTrackCaptionKind(track);
    return (
        <Popover.Root>
            <Popover.Trigger>
                <CaptionButton className={buttonClass}>
                    <SubtitlesIcon
                        className={`h-7 w-7 ${!isOn ? "text-white/60" : ""}`}
                    />
                </CaptionButton>
            </Popover.Trigger>
            <Popover.Content
                className={tooltipClass}

                sideOffset={tooltipOffset}
            >
                {isOn ? "Closed-Captions Off" : "Closed-Captions On"}
            </Popover.Content>
        </Popover.Root>
    );
}

export function PIP({
                        tooltipOffset = 0,

                    }: MediaButtonProps) {
    const isActive = useMediaState("pictureInPicture");
    return (
        <Popover.Root>
            <Popover.Trigger>
                <PIPButton className={buttonClass}>
                    {isActive ? (
                        <PictureInPictureExitIcon className="h-6 w-6"/>
                    ) : (
                        <PictureInPictureIcon className="h-6 w-6"/>
                    )}
                </PIPButton>
            </Popover.Trigger>
            <Popover.Content
                className={tooltipClass}

                sideOffset={tooltipOffset}
            >
                {isActive ? "Exit PIP" : "Enter PIP"}
            </Popover.Content>
        </Popover.Root>
    );
}

export function Fullscreen({
                               tooltipOffset = 0,

                           }: MediaButtonProps) {
    const isActive = useMediaState("fullscreen");
    return (
        <Popover.Root>
            <Popover.Trigger>
                <FullscreenButton className={buttonClass}>
                    {isActive ? (
                        <FullscreenExitIcon className="h-6 w-6"/>
                    ) : (
                        <FullscreenIcon className="h-6 w-6"/>
                    )}
                </FullscreenButton>
            </Popover.Trigger>
            <Popover.Content
                className={tooltipClass}

                sideOffset={tooltipOffset}
            >
                {isActive ? "Exit Fullscreen" : "Enter Fullscreen"}
            </Popover.Content>
        </Popover.Root>
    );
}

export function Settings({
                             tooltipOffset = 0,

                         }: MediaButtonProps) {
    return (
        <Popover.Root>
            <Popover.Trigger>
                <FullscreenButton className={buttonClass}>
                    <SettingsIcon className="h-7 w-7"/>
                </FullscreenButton>
            </Popover.Trigger>
            <Popover.Content
                className={tooltipClass}

                sideOffset={tooltipOffset}
            >
                Settings
            </Popover.Content>
        </Popover.Root>
    );
}
