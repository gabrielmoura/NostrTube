import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import * as Tooltip from "@radix-ui/react-tooltip";
import { useCaptionOptions, useMediaPlayer } from "@vidstack/react";
import { RiClosedCaptioningFill as SubtitlesIcon } from "react-icons/ri";
import { LuCheckCheck as CheckCircle, LuCircle as CircleIcon } from "react-icons/lu";

export interface MenuProps {
  side?: DropdownMenu.MenuContentProps["side"];
  align?: DropdownMenu.MenuContentProps["align"];
  offset?: DropdownMenu.MenuContentProps["sideOffset"];
  tooltipSide?: Tooltip.TooltipContentProps["side"];
  tooltipAlign?: Tooltip.TooltipContentProps["align"];
  tooltipOffset?: number;
}

export const buttonClass =
  "group ring-media-focus relative inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-md outline-none ring-inset hover:bg-white/10 focus-visible:ring-4 aria-disabled:hidden";

export const tooltipClass =
  "animate-out fade-out slide-out-to-bottom-2 data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in data-[state=delayed-open]:slide-in-from-bottom-4 z-10 rounded-sm bg-black/90 px-2 py-0.5 text-sm font-medium text-white parent-data-[open]:hidden";
const menuClass =
  "animate-out fade-out z-[9999] slide-in-from-bottom-4 data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:slide-out-to-bottom-2 flex max-h-[400px] min-w-[260px] flex-col rounded-md border border-white/10 bg-black/95 p-2.5 font-sans text-[15px] font-medium outline-none backdrop-blur-sm duration-300";

export function MenuCaptions({
                               side = "top",
                               align = "end",
                               offset = 0,
                               tooltipSide = "top",
                               tooltipAlign = "center",
                               tooltipOffset = 0
                             }: MenuProps) {
  const player = useMediaPlayer(),
    options = useCaptionOptions(),
    hint = options.selectedTrack?.label ?? "Off";
  return (
    <DropdownMenu.Root>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <DropdownMenu.Trigger
            aria-label="Subtitles"
            className={buttonClass}
            disabled={options.disabled}
          >
            <SubtitlesIcon className="h-6 w-6" />
          </DropdownMenu.Trigger>
        </Tooltip.Trigger>
        <Tooltip.Content
          className={tooltipClass}
          side={tooltipSide}
          align={tooltipAlign}
          sideOffset={tooltipOffset}
        >
          Captions
        </Tooltip.Content>
      </Tooltip.Root>
      <DropdownMenu.Content
        className={menuClass}
        side={side}
        align={align}
        sideOffset={offset}
        collisionBoundary={player?.el}
      >
        <DropdownMenu.Label className="mb-2 flex w-full items-center px-1.5 text-[15px] font-medium">
          <SubtitlesIcon className="mr-1.5 h-5 w-5 translate-y-px" />
          Captions
          <span className="ml-auto text-sm text-white/50">{hint}</span>
        </DropdownMenu.Label>
        <DropdownMenu.RadioGroup
          aria-label="Captions"
          className="flex w-full flex-col"
          value={options.selectedValue}
        >
          {options.map(({ label, value, select }) => (
            <Radio value={value} onSelect={select} key={value}>
              {label}
            </Radio>
          ))}
        </DropdownMenu.RadioGroup>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
}

function Radio({ children, ...props }: DropdownMenu.MenuRadioItemProps) {
  return (
    <DropdownMenu.RadioItem
      className="group relative flex w-full cursor-pointer select-none items-center justify-start rounded-sm p-2.5 text-sm outline-none ring-media-focus data-[focus]:ring-[3px] hocus:bg-white/10"
      {...props}
    >
      <CircleIcon className="h-4 w-4 text-white group-data-[state=checked]:hidden" />
      <CheckCircle className="hidden h-4 w-4 text-media-brand group-data-[state=checked]:block" />
      <span className="ml-2">{children}</span>
    </DropdownMenu.RadioItem>
  );
}