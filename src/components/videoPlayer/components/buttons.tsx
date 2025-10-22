import {
    CaptionButton,
    FullscreenButton,
    isTrackCaptionKind,
    MuteButton,
    PIPButton,
    PlayButton,
    Tooltip,
    type TooltipPlacement,
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
    RiVolumeDownFill as VolumeLowIcon,
    RiVolumeMuteFill as MuteIcon,
    RiVolumeUpFill as VolumeHighIcon,
} from "react-icons/ri";

export interface MediaButtonProps {
    tooltipOffset?: number;
    tooltipPlacement?: TooltipPlacement;
}

// 🎨 Base de estilo para botões do player
export const buttonClass =
    "group relative inline-flex h-10 w-10 items-center justify-center rounded-md text-white/90 hover:text-sky-400 hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-sky-400 outline-none transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed";

// 🎨 Base de estilo para tooltips
export const tooltipClass =
    "animate-out fade-out slide-out-to-bottom-2 data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in data-[state=delayed-open]:slide-in-from-bottom-4 z-10 rounded-md bg-black/90 px-2 py-1 text-sm font-medium text-white/90 shadow backdrop-blur-sm";

// ----------------------------- //
//           BOTÕES              //
// ----------------------------- //

export function Play({tooltipOffset = 0, tooltipPlacement}: MediaButtonProps) {
    const isPaused = useMediaState("paused");

    return (
        <Tooltip.Root>
            <Tooltip.Trigger asChild>
                <PlayButton className={buttonClass}>
                    {isPaused ? (
                        <PlayIcon className="h-7 w-7 translate-x-px transition-transform duration-200"/>
                    ) : (
                        <PauseIcon className="h-7 w-7 transition-transform duration-200"/>
                    )}
                </PlayButton>
            </Tooltip.Trigger>
            <Tooltip.Content
                className={tooltipClass}
                sideOffset={tooltipOffset}
                placement={tooltipPlacement}
            >
                {isPaused ? "Play" : "Pause"}
            </Tooltip.Content>
        </Tooltip.Root>
    );
}

export function Mute({tooltipOffset = 0, tooltipPlacement}: MediaButtonProps) {
    const volume = useMediaState("volume");
    const isMuted = useMediaState("muted");

    const Icon =
        isMuted || volume === 0
            ? MuteIcon
            : volume < 0.5
                ? VolumeLowIcon
                : VolumeHighIcon;

    return (
        <Tooltip.Root>
            <Tooltip.Trigger asChild>
                <MuteButton className={buttonClass}>
                    <Icon className="h-6 w-6 transition-transform duration-200"/>
                </MuteButton>
            </Tooltip.Trigger>
            <Tooltip.Content
                className={tooltipClass}
                sideOffset={tooltipOffset}
                placement={tooltipPlacement}
            >
                {isMuted ? "Unmute" : "Mute"}
            </Tooltip.Content>
        </Tooltip.Root>
    );
}

export function Caption({
                            tooltipOffset = 0,
                            tooltipPlacement,
                        }: MediaButtonProps) {
    const track = useMediaState("textTrack");
    const isOn = track && isTrackCaptionKind(track);

    return (
        <Tooltip.Root>
            <Tooltip.Trigger asChild>
                <CaptionButton className={buttonClass}>
                    <SubtitlesIcon
                        className={`h-6 w-6 transition-colors duration-200 ${
                            isOn ? "text-sky-400" : "text-white/60 group-hover:text-white"
                        }`}
                    />
                </CaptionButton>
            </Tooltip.Trigger>
            <Tooltip.Content
                className={tooltipClass}
                placement={tooltipPlacement}
                sideOffset={tooltipOffset}
            >
                {isOn ? "Subtitles Off" : "Subtitles On"}
            </Tooltip.Content>
        </Tooltip.Root>
    );
}

export function PIP({tooltipOffset = 0, tooltipPlacement}: MediaButtonProps) {
    const isActive = useMediaState("pictureInPicture");
    const Icon = isActive ? PictureInPictureExitIcon : PictureInPictureIcon;

    return (
        <Tooltip.Root>
            <Tooltip.Trigger asChild>
                <PIPButton className={buttonClass}>
                    <Icon className="h-6 w-6 transition-transform duration-200"/>
                </PIPButton>
            </Tooltip.Trigger>
            <Tooltip.Content
                className={tooltipClass}
                placement={tooltipPlacement}
                sideOffset={tooltipOffset}
            >
                {isActive ? "Exit PIP" : "Enter PIP"}
            </Tooltip.Content>
        </Tooltip.Root>
    );
}

export function Fullscreen({
                               tooltipOffset = 0,
                               tooltipPlacement,
                           }: MediaButtonProps) {
    const isActive = useMediaState("fullscreen");
    const Icon = isActive ? FullscreenExitIcon : FullscreenIcon;

    return (
        <Tooltip.Root>
            <Tooltip.Trigger asChild>
                <FullscreenButton className={buttonClass}>
                    <Icon className="h-6 w-6 transition-transform duration-200"/>
                </FullscreenButton>
            </Tooltip.Trigger>
            <Tooltip.Content
                className={tooltipClass}
                placement={tooltipPlacement}
                sideOffset={tooltipOffset}
            >
                {isActive ? "Exit Fullscreen" : "Enter Fullscreen"}
            </Tooltip.Content>
        </Tooltip.Root>
    );
}

// export function Settings({
//                              tooltipOffset = 0,
//                              tooltipPlacement,
//                          }: MediaButtonProps) {
//     return (
//         <Tooltip.Root>
//             <Tooltip.Trigger asChild>
//                 <SettingsButton className={buttonClass}>
//                     <SettingsIcon className="h-7 w-7 transition-transform duration-200"/>
//                 </SettingsButton>
//             </Tooltip.Trigger>
//             <Tooltip.Content
//                 className={tooltipClass}
//                 placement={tooltipPlacement}
//                 sideOffset={tooltipOffset}
//             >
//                 Settings
//             </Tooltip.Content>
//         </Tooltip.Root>
//     );
// }
