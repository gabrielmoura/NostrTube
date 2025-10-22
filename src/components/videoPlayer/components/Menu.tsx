import { AirPlayButton, Menu } from '@vidstack/react';
import { AirPlayIcon, SettingsIcon } from '@vidstack/react/icons';
import { SpeedSubmenu } from "@/components/videoPlayer/components/SpeedSubmenu.tsx";

export function Menus() {
    return (
        <Menu.Root>
            <Menu.Button
                className="group relative inline-flex h-10 w-10 items-center justify-center rounded-md text-white/90 hover:text-sky-400 hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-sky-400 outline-none transition-all duration-200"
                aria-label="Settings"
            >
                <SettingsIcon className="h-6 w-6 transition-transform duration-200 ease-out group-data-[open]:rotate-90" />
            </Menu.Button>

            <Menu.Items
                className="data-[open]:animate-in data-[open]:fade-in data-[open]:slide-in-from-bottom-4 animate-out fade-out slide-out-to-bottom-2
                   flex max-h-[400px] min-w-[260px] flex-col gap-2 overflow-y-auto overscroll-y-contain
                   rounded-lg border border-white/10 bg-neutral-900/95 p-3
                   text-[15px] font-medium text-white/90 shadow-lg backdrop-blur-md outline-none
                   transition-[height] duration-300 will-change-[height] data-[resizing]:overflow-hidden"
                placement="top"
                offset={8}
            >
                {/* Submenu de Velocidade */}
                <div className="py-1">
                    <SpeedSubmenu />
                </div>

                {/* Divisor sutil */}
                <div className="my-2 h-px bg-white/10" />

                {/* AirPlay */}
                <AirPlayButton
                    className="group inline-flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-white/90 hover:bg-white/10 hover:text-sky-400 transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                >
                    <AirPlayIcon className="w-6 h-6 shrink-0" />
                    <span className="text-sm">Transmitir via AirPlay</span>
                </AirPlayButton>
            </Menu.Items>
        </Menu.Root>
    );
}
