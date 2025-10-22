import { Menu, usePlaybackRateOptions } from '@vidstack/react';
import { CheckIcon } from 'lucide-react'; // ou qualquer outro ícone de check do seu setup

const mySpeeds = [0.5, 0.75, 1, 1.5, 2, 2.5, 3];

export function SpeedSubmenu() {
    const options = usePlaybackRateOptions({ rates: mySpeeds });
    const hint = options.selectedValue === '1' ? 'Normal' : options.selectedValue + 'x';

    return (
        <Menu.Root>
            <Menu.Button
                disabled={options.disabled}
                className="w-full text-left rounded-md px-3 py-2 text-sm text-white/90 hover:bg-white/10 hover:text-sky-400 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <span className="font-medium">Velocidade:</span>{' '}
                <span className="opacity-80">{hint}</span>
            </Menu.Button>

            <Menu.Content
                className="mt-2 w-full rounded-md border border-white/10 bg-neutral-900/95 shadow-lg backdrop-blur-md p-1 text-sm text-white/90"
            >
                <Menu.RadioGroup value={options.selectedValue} className="flex flex-col">
                    {options.map(({ label, value, select }) => (
                        <Menu.Radio
                            value={value}
                            onSelect={select}
                            key={value}
                            className="group flex w-full items-center justify-between rounded-md px-3 py-2 text-left hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-sky-400 transition-colors duration-150 cursor-pointer"
                        >
                            <span className="group-data-[checked]:text-sky-400">{label}</span>
                            {options.selectedValue === value && (
                                <CheckIcon className="w-4 h-4 text-sky-400" />
                            )}
                        </Menu.Radio>
                    ))}
                </Menu.RadioGroup>
            </Menu.Content>
        </Menu.Root>
    );
}
